import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isFeatureEnabled } from '@/lib/featureFlags';

/**
 * POST /api/ai/chat — AI expense assistant powered by Gemini.
 * Receives a user message, gathers financial context, queries Gemini,
 * and returns an intelligent response based on real data.
 */

export async function POST(req: Request) {
    try {
        if (!isFeatureEnabled('aiChat')) {
            return NextResponse.json({ error: 'AI Chat is disabled' }, { status: 403 });
        }

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { message } = (await req.json()) as { message: string };
        if (!message?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Gather financial context for the AI
        // Use explicit types so this works even before DB migration
        type GroupInfo = { name: string; members: { user: { name: string | null } }[] };
        type SettlementInfo = { status: string; fromId: string; toId: string; amount: number; from: { name: string | null }; to: { name: string | null } };

        let groups: GroupInfo[] = [];
        let owedToUser: { name: string | null; amount: number }[] = [];
        let userOwes: { name: string | null; amount: number }[] = [];

        // Fetch transactions (these fields exist in current schema)
        const recentTransactions = await prisma.transaction.findMany({
            where: { payerId: user.id },
            include: {
                splits: { include: { user: { select: { id: true, name: true } } } },
            },
            orderBy: { date: 'desc' },
            take: 30,
        });

        // Fetch groups and settlements (may use new schema fields)
        try {
            const rawGroups = await prisma.group.findMany({
                where: {
                    members: { some: { userId: user.id } },
                },
                include: {
                    members: { include: { user: { select: { id: true, name: true } } } },
                },
                take: 10,
            });
            groups = rawGroups as unknown as GroupInfo[];

            const rawSettlements = await prisma.settlement.findMany({
                where: {
                    OR: [{ fromId: user.id }, { toId: user.id }],
                },
                include: {
                    from: { select: { id: true, name: true } },
                    to: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 20,
            });
            const settlements = rawSettlements as unknown as SettlementInfo[];
            const pendingSettlements = settlements.filter(s => s.status === 'pending');
            owedToUser = pendingSettlements
                .filter(s => s.toId === user.id)
                .map(s => ({ name: s.from.name, amount: s.amount }));
            userOwes = pendingSettlements
                .filter(s => s.fromId === user.id)
                .map(s => ({ name: s.to.name, amount: s.amount }));
        } catch { /* graceful degradation if schema not yet migrated */ }

        // Build context for the AI
        const totalSpent = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
        const categorySpending = new Map<string, number>();
        for (const txn of recentTransactions) {
            const cat = txn.category || 'general';
            categorySpending.set(cat, (categorySpending.get(cat) || 0) + txn.amount);
        }

        const contextStr = `
User: ${user.name || 'Unknown'}
Groups: ${groups.map(g => `${g.name} (${g.members.length} members: ${g.members.map((m: { user: { name: string | null } }) => m.user.name).join(', ')})`).join('; ')}
Recent spending (last 30 txns): ₹${(totalSpent / 100).toFixed(2)} total
Category breakdown: ${Array.from(categorySpending.entries()).map(([c, a]) => `${c}: ₹${(a / 100).toFixed(2)}`).join(', ')}
People who owe user: ${owedToUser.length > 0 ? owedToUser.map(o => `${o.name}: ₹${(o.amount / 100).toFixed(2)}`).join(', ') : 'None'}
User owes: ${userOwes.length > 0 ? userOwes.map(o => `${o.name}: ₹${(o.amount / 100).toFixed(2)}`).join(', ') : 'No one'}
All amounts are in INR (₹). Stored internally in paise (1 rupee = 100 paise).
`.trim();

        // Check for Gemini API key
        const apiKey = process.env.GEMINI_API_KEY;

        let reply: string;

        if (apiKey) {
            // Call Gemini API
            reply = await callGemini(apiKey, contextStr, message);
        } else {
            // Fallback: smart local response based on message patterns
            reply = generateLocalResponse(message, {
                totalSpent,
                categorySpending,
                owedToUser: owedToUser as { name: string; amount: number }[],
                userOwes: userOwes as { name: string; amount: number }[],
                groups: groups as { name: string; members: { user: { name: string | null } }[] }[],
                userName: user.name || 'there',
            });
        }

        // Save chat messages
        try {
            await prisma.chatMessage.createMany({
                data: [
                    { userId: user.id, role: 'user', content: message },
                    { userId: user.id, role: 'assistant', content: reply },
                ],
            });
        } catch { /* graceful fallback */ }

        return NextResponse.json({ reply });
    } catch (error) {
        console.error('AI Chat error:', error);
        return NextResponse.json({ error: 'Something went wrong with AI chat' }, { status: 500 });
    }
}

/** Call Gemini API */
async function callGemini(apiKey: string, context: string, message: string): Promise<string> {
    const systemPrompt = `You are AutoSplit AI, a friendly financial assistant inside AutoSplit — an expense splitting app.
You help users understand their spending, debts, and group expenses.
Answer concisely (2-3 sentences max). Use ₹ for amounts. Be helpful and friendly.
Here is the user's financial data:

${context}`;

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }] }],
                    generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
                }),
            }
        );

        if (!res.ok) {
            console.error('Gemini API error:', res.status);
            return 'Sorry, I couldn\'t process that right now. Try again in a moment.';
        }

        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I couldn\'t understand that. Try rephrasing?';
    } catch {
        return 'Sorry, I\'m having trouble connecting. Please try again.';
    }
}

/** Local fallback when no API key is set */
function generateLocalResponse(
    message: string,
    ctx: {
        totalSpent: number;
        categorySpending: Map<string, number>;
        owedToUser: { name: string; amount: number }[];
        userOwes: { name: string; amount: number }[];
        groups: { name: string; members: { user: { name: string | null } }[] }[];
        userName: string;
    }
): string {
    const msg = message.toLowerCase();

    if (msg.includes('who owes') || msg.includes('owe me')) {
        if (ctx.owedToUser.length === 0) return 'No one owes you any money right now! 🎉';
        const topOwer = ctx.owedToUser.sort((a, b) => b.amount - a.amount)[0];
        return `${topOwer.name} owes you the most: ₹${(topOwer.amount / 100).toFixed(0)}. Total owed to you: ₹${(ctx.owedToUser.reduce((s, o) => s + o.amount, 0) / 100).toFixed(0)}.`;
    }

    if (msg.includes('i owe') || msg.includes('my debt')) {
        if (ctx.userOwes.length === 0) return 'You\'re debt-free! No pending payments. 🎉';
        return `You owe ${ctx.userOwes.map(o => `₹${(o.amount / 100).toFixed(0)} to ${o.name}`).join(', ')}.`;
    }

    if (msg.includes('spend') || msg.includes('spent') || msg.includes('total')) {
        const catStr = Array.from(ctx.categorySpending.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([c, a]) => `${c}: ₹${(a / 100).toFixed(0)}`)
            .join(', ');
        return `You've spent ₹${(ctx.totalSpent / 100).toFixed(0)} recently. Top categories: ${catStr}.`;
    }

    if (msg.includes('group')) {
        if (ctx.groups.length === 0) return 'You\'re not in any groups yet. Create one to start splitting!';
        return `You're in ${ctx.groups.length} group(s): ${ctx.groups.map(g => g.name).join(', ')}.`;
    }

    if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
        return `Hey ${ctx.userName}! 👋 I'm your AutoSplit assistant. Ask me about your spending, debts, or groups!`;
    }

    return `I can help with: spending summary, who owes you, your debts, and group info. Try asking "How much did I spend?" or "Who owes me?"`;
}
