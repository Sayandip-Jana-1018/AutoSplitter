import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * GET /api/analytics — enhanced analytics endpoint.
 * Returns monthly trends, category breakdown, budget comparison, and smart insights.
 * All computed from real transaction + budget data.
 */

const CATEGORY_LABELS: Record<string, string> = {
    food: 'Food', transport: 'Transport', stay: 'Stay', shopping: 'Shopping',
    tickets: 'Tickets', entertainment: 'Entertainment', general: 'General',
    utilities: 'Utilities', groceries: 'Groceries', health: 'Health',
    education: 'Education', other: 'Other',
};

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Fetch last 6 months of transactions paid by user
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const transactions = await prisma.transaction.findMany({
            where: {
                payerId: user.id,
                deletedAt: null,
                date: { gte: sixMonthsAgo },
            },
            include: { splits: true },
            orderBy: { date: 'asc' },
        });

        // Current month key
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

        // ── Monthly Trend ──
        const monthlyMap = new Map<string, number>();
        for (const txn of transactions) {
            const d = new Date(txn.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyMap.set(key, (monthlyMap.get(key) || 0) + txn.amount);
        }

        // Generate all 6 months even if empty
        const monthlyTrend: { month: string; total: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyTrend.push({ month: key, total: monthlyMap.get(key) || 0 });
        }

        // ── Category Breakdown (current month) ──
        const categoryMap = new Map<string, number>();
        const lastMonthCategoryMap = new Map<string, number>();
        let currentMonthTotal = 0;

        for (const txn of transactions) {
            const d = new Date(txn.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

            if (key === currentMonth) {
                const cat = txn.category || 'general';
                categoryMap.set(cat, (categoryMap.get(cat) || 0) + txn.amount);
                currentMonthTotal += txn.amount;
            }
            if (key === lastMonth) {
                const cat = txn.category || 'general';
                lastMonthCategoryMap.set(cat, (lastMonthCategoryMap.get(cat) || 0) + txn.amount);
            }
        }

        const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
            category,
            label: CATEGORY_LABELS[category] || category,
            amount,
            percentage: currentMonthTotal > 0 ? Math.round((amount / currentMonthTotal) * 100) : 0,
        })).sort((a, b) => b.amount - a.amount);

        // ── Budget Comparison ──
        const budgets = await prisma.budget.findMany({
            where: { userId: user.id, month: currentMonth },
        });

        const budgetComparison = budgets.map(b => ({
            category: b.category,
            label: CATEGORY_LABELS[b.category] || b.category,
            budget: b.amount,
            actual: categoryMap.get(b.category) || 0,
            overBudget: (categoryMap.get(b.category) || 0) > b.amount,
        }));

        // ── Smart Insights ──
        const insights: { type: string; message: string; severity: 'info' | 'warning' | 'success' }[] = [];

        // Category comparison insights
        for (const [cat, currentAmount] of categoryMap) {
            const lastAmount = lastMonthCategoryMap.get(cat) || 0;
            const label = CATEGORY_LABELS[cat] || cat;
            if (lastAmount > 0) {
                const change = Math.round(((currentAmount - lastAmount) / lastAmount) * 100);
                if (change > 20) {
                    insights.push({
                        type: 'overspend',
                        message: `${label} spending up ${change}% from last month`,
                        severity: 'warning',
                    });
                } else if (change < -15) {
                    insights.push({
                        type: 'saving',
                        message: `You saved ${Math.abs(change)}% on ${label.toLowerCase()} this month`,
                        severity: 'success',
                    });
                }
            }
        }

        // Over-budget insights
        for (const bc of budgetComparison) {
            if (bc.overBudget) {
                const over = Math.round(((bc.actual - bc.budget) / bc.budget) * 100);
                insights.push({
                    type: 'over_budget',
                    message: `${bc.label} is ${over}% over budget (₹${Math.round(bc.actual / 100)} / ₹${Math.round(bc.budget / 100)})`,
                    severity: 'warning',
                });
            }
        }

        // Total trend insight
        const thisTotal = monthlyTrend[monthlyTrend.length - 1]?.total || 0;
        const prevTotal = monthlyTrend[monthlyTrend.length - 2]?.total || 0;
        if (prevTotal > 0) {
            const change = Math.round(((thisTotal - prevTotal) / prevTotal) * 100);
            if (Math.abs(change) > 10) {
                insights.push({
                    type: change > 0 ? 'spending_up' : 'spending_down',
                    message: change > 0
                        ? `Total spending up ${change}% this month`
                        : `Total spending down ${Math.abs(change)}% this month — great job! 🎉`,
                    severity: change > 0 ? 'info' : 'success',
                });
            }
        }

        // Top category
        if (categoryBreakdown.length > 0) {
            const top = categoryBreakdown[0];
            insights.push({
                type: 'top_category',
                message: `Top spending: ${top.label} (${top.percentage}% of expenses)`,
                severity: 'info',
            });
        }

        return NextResponse.json({
            data: {
                monthlyTrend,
                categoryBreakdown,
                budgetComparison,
                insights,
                currentMonth,
                totalThisMonth: currentMonthTotal,
            },
        });
    } catch (error) {
        console.error('Analytics GET error:', error);
        return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
    }
}
