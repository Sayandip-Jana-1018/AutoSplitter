import { prisma } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════
// Balance Recomputation Utility
// ═══════════════════════════════════════════════════════════════

/**
 * Recompute all member balances for a group from scratch.
 * Iterates all non-deleted transactions across all trips and
 * computes net balance per user (positive = owed money, negative = owes money).
 */
export async function recomputeGroupBalances(
    groupId: string
): Promise<Record<string, number>> {
    const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
            members: true,
            trips: {
                include: {
                    transactions: {
                        where: { deletedAt: null },
                        include: { splits: true },
                    },
                },
            },
        },
    });

    if (!group) return {};

    const balances: Record<string, number> = {};

    // Initialize all members with 0
    for (const member of group.members) {
        balances[member.userId] = 0;
    }

    // Sum up all transactions
    for (const trip of group.trips) {
        for (const txn of trip.transactions) {
            // Payer gets credit
            balances[txn.payerId] = (balances[txn.payerId] || 0) + txn.amount;

            // Each split user gets a debit
            for (const split of txn.splits) {
                balances[split.userId] = (balances[split.userId] || 0) - split.amount;
            }
        }
    }

    return balances;
}

/**
 * Check if a user has any unsettled balance in a group.
 * Returns true if balance is non-zero.
 */
export async function hasUnsettledBalance(
    groupId: string,
    userId: string
): Promise<boolean> {
    const balances = await recomputeGroupBalances(groupId);
    const balance = balances[userId] || 0;
    return Math.abs(balance) > 50; // Allow ₹0.50 tolerance for rounding
}
