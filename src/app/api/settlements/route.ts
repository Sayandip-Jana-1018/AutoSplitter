import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const SettleSchema = z.object({
    tripId: z.string().cuid(),
    toUserId: z.string().cuid(),
    amount: z.number().int().positive(),
    method: z.string().default('upi'),
    note: z.string().optional(),
});

// GET /api/settlements?tripId=xxx — get computed settlements for a trip
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const tripId = searchParams.get('tripId');
        if (!tripId) {
            return NextResponse.json({ error: 'tripId required' }, { status: 400 });
        }

        // Get all transactions + splits for this trip
        const transactions = await prisma.transaction.findMany({
            where: { tripId },
            include: { splits: true },
        });

        // Calculate net balances
        const balances: Record<string, number> = {};

        for (const txn of transactions) {
            // Payer is owed by everyone
            balances[txn.payerId] = (balances[txn.payerId] || 0) + txn.amount;
            // Each split person owes their share
            for (const split of txn.splits) {
                balances[split.userId] = (balances[split.userId] || 0) - split.amount;
            }
        }

        // Greedy netting: minimize transfers
        const debtors: { id: string; amount: number }[] = [];
        const creditors: { id: string; amount: number }[] = [];

        for (const [userId, balance] of Object.entries(balances)) {
            if (balance < 0) debtors.push({ id: userId, amount: -balance });
            else if (balance > 0) creditors.push({ id: userId, amount: balance });
        }

        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        const transfers: { from: string; to: string; amount: number }[] = [];
        let i = 0, j = 0;
        while (i < debtors.length && j < creditors.length) {
            const transfer = Math.min(debtors[i].amount, creditors[j].amount);
            if (transfer > 0) {
                transfers.push({ from: debtors[i].id, to: creditors[j].id, amount: transfer });
            }
            debtors[i].amount -= transfer;
            creditors[j].amount -= transfer;
            if (debtors[i].amount === 0) i++;
            if (creditors[j].amount === 0) j++;
        }

        // Get recorded settlements
        const recorded = await prisma.settlement.findMany({
            where: { tripId },
            include: {
                from: { select: { id: true, name: true, image: true } },
                to: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            computed: transfers,
            recorded,
            balances,
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to compute settlements' }, { status: 500 });
    }
}

// POST /api/settlements — record a settlement payment
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const parsed = SettleSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const settlement = await prisma.settlement.create({
            data: {
                tripId: parsed.data.tripId,
                fromId: user.id,
                toId: parsed.data.toUserId,
                amount: parsed.data.amount,
                method: parsed.data.method,
                note: parsed.data.note,
            },
        });

        return NextResponse.json(settlement, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to record settlement' }, { status: 500 });
    }
}
