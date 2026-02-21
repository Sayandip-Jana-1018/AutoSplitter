import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// GET /api/settlements/by-group — returns per-group settlement data in one call
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) {
            return NextResponse.json({ groups: [], global: { computed: [], recorded: [] } });
        }

        // 1) Get all groups the user belongs to, with members + active trip
        const groups = await prisma.group.findMany({
            where: {
                deletedAt: null,
                OR: [
                    { ownerId: user.id },
                    { members: { some: { userId: user.id } } },
                ],
            },
            include: {
                members: {
                    include: { user: { select: { id: true, name: true, image: true, upiId: true } } },
                },
                trips: {
                    where: { isActive: true },
                    take: 1,
                    select: { id: true },
                },
            },
        });

        // Build global name/image/upi maps
        const nameMap: Record<string, string> = {};
        const imageMap: Record<string, string | null> = {};
        const upiMap: Record<string, string | null> = {};

        for (const g of groups) {
            // Include owner
            nameMap[g.ownerId] = nameMap[g.ownerId] || 'Unknown';
            for (const m of g.members) {
                nameMap[m.user.id] = m.user.name || 'Unknown';
                imageMap[m.user.id] = m.user.image || null;
                upiMap[m.user.id] = m.user.upiId || null;
            }
        }

        // 2) Collect all active tripIds
        const tripIdToGroup = new Map<string, typeof groups[0]>();
        const allTripIds: string[] = [];

        for (const g of groups) {
            if (g.trips[0]) {
                tripIdToGroup.set(g.trips[0].id, g);
                allTripIds.push(g.trips[0].id);
            }
        }

        if (allTripIds.length === 0) {
            return NextResponse.json({ groups: [], global: { computed: [], recorded: [] } });
        }

        // 3) Batch-fetch ALL transactions + splits across all trips
        const allTransactions = await prisma.transaction.findMany({
            where: { tripId: { in: allTripIds }, deletedAt: null },
            include: { splits: true },
        });

        // 4) Batch-fetch ALL completed settlements
        const allCompletedSettlements = await prisma.settlement.findMany({
            where: {
                tripId: { in: allTripIds },
                status: { in: ['completed', 'confirmed'] },
                deletedAt: null,
            },
        });

        // 5) Batch-fetch ALL recorded settlements (for the list)
        const allRecordedSettlements = await prisma.settlement.findMany({
            where: { tripId: { in: allTripIds }, deletedAt: null },
            include: {
                from: { select: { id: true, name: true, image: true } },
                to: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        // 6) Group transactions and settlements by tripId
        const txnsByTrip = new Map<string, typeof allTransactions>();
        for (const txn of allTransactions) {
            const arr = txnsByTrip.get(txn.tripId) || [];
            arr.push(txn);
            txnsByTrip.set(txn.tripId, arr);
        }

        const settByTrip = new Map<string, typeof allCompletedSettlements>();
        for (const s of allCompletedSettlements) {
            const arr = settByTrip.get(s.tripId) || [];
            arr.push(s);
            settByTrip.set(s.tripId, arr);
        }

        const recordedByTrip = new Map<string, typeof allRecordedSettlements>();
        for (const r of allRecordedSettlements) {
            const arr = recordedByTrip.get(r.tripId) || [];
            arr.push(r);
            recordedByTrip.set(r.tripId, arr);
        }

        // 7) For each group, compute per-group settlements using greedy netting
        const perGroupResults = [];

        for (const tripId of allTripIds) {
            const group = tripIdToGroup.get(tripId);
            if (!group) continue;

            const transactions = txnsByTrip.get(tripId) || [];
            const completedSettlements = settByTrip.get(tripId) || [];
            const recorded = recordedByTrip.get(tripId) || [];

            // Calculate balances within this group
            const balances: Record<string, number> = {};
            for (const txn of transactions) {
                balances[txn.payerId] = (balances[txn.payerId] || 0) + txn.amount;
                for (const split of txn.splits) {
                    balances[split.userId] = (balances[split.userId] || 0) - split.amount;
                }
            }
            for (const s of completedSettlements) {
                balances[s.fromId] = (balances[s.fromId] || 0) + s.amount;
                balances[s.toId] = (balances[s.toId] || 0) - s.amount;
            }

            // Greedy netting (Simplify Debts) within this group
            const debtors: { id: string; amount: number }[] = [];
            const creditors: { id: string; amount: number }[] = [];
            for (const [userId, balance] of Object.entries(balances)) {
                if (balance < -1) debtors.push({ id: userId, amount: -balance });
                else if (balance > 1) creditors.push({ id: userId, amount: balance });
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

            const computedWithNames = transfers.map(t => ({
                from: t.from,
                to: t.to,
                amount: t.amount,
                fromName: nameMap[t.from] || 'Unknown',
                toName: nameMap[t.to] || 'Unknown',
                fromImage: imageMap[t.from] || null,
                toImage: imageMap[t.to] || null,
                toUpiId: upiMap[t.to] || null,
            }));

            const members = group.members.map(m => ({
                id: m.user.id,
                name: m.user.name || 'Unknown',
                image: m.user.image || null,
            }));

            perGroupResults.push({
                groupId: group.id,
                groupName: group.name,
                groupEmoji: group.emoji,
                tripId,
                members,
                computed: computedWithNames,
                recorded: recorded.map(r => ({
                    id: r.id,
                    fromId: r.fromId,
                    toId: r.toId,
                    amount: r.amount,
                    status: r.status,
                    method: r.method,
                    note: r.note,
                    from: r.from,
                    to: r.to,
                    createdAt: r.createdAt,
                })),
            });
        }

        // 8) Compute global pairwise debts
        const pairwise = new Map<string, number>();
        const addDebt = (fromId: string, toId: string, amount: number) => {
            if (fromId === toId) return;
            const key = fromId < toId ? `${fromId}:${toId}` : `${toId}:${fromId}`;
            const sign = fromId < toId ? 1 : -1;
            pairwise.set(key, (pairwise.get(key) || 0) + amount * sign);
        };

        for (const txn of allTransactions) {
            for (const split of txn.splits) {
                addDebt(split.userId, txn.payerId, split.amount);
            }
        }
        for (const s of allCompletedSettlements) {
            addDebt(s.fromId, s.toId, -s.amount);
        }

        const globalTransfers: { from: string; to: string; amount: number; fromName: string; toName: string; fromImage: string | null; toImage: string | null; toUpiId: string | null }[] = [];
        for (const [key, amount] of pairwise.entries()) {
            if (Math.abs(amount) < 1) continue;
            const [userA, userB] = key.split(':');
            if (amount > 0) {
                globalTransfers.push({
                    from: userA, to: userB, amount,
                    fromName: nameMap[userA] || 'Unknown', toName: nameMap[userB] || 'Unknown',
                    fromImage: imageMap[userA] || null, toImage: imageMap[userB] || null,
                    toUpiId: upiMap[userB] || null,
                });
            } else {
                globalTransfers.push({
                    from: userB, to: userA, amount: -amount,
                    fromName: nameMap[userB] || 'Unknown', toName: nameMap[userA] || 'Unknown',
                    fromImage: imageMap[userB] || null, toImage: imageMap[userA] || null,
                    toUpiId: upiMap[userA] || null,
                });
            }
        }

        return NextResponse.json({
            groups: perGroupResults,
            global: {
                computed: globalTransfers,
                recorded: allRecordedSettlements,
            },
        });
    } catch (error) {
        console.error('Settlements by-group error:', error);
        return NextResponse.json({ error: 'Failed to compute settlements' }, { status: 500 });
    }
}
