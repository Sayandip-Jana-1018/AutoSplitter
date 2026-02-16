/**
 * AutoSplit — Settlement Algorithm
 * Greedy Min-Transfer Netting
 *
 * Calculates who owes whom using minimal number of transfers.
 * All amounts in paise (integer) to avoid floating point issues.
 */

export interface Balance {
    userId: string;
    name: string;
    paid: number;     // total paid by this user (paise)
    owes: number;     // total owed by this user (paise)
    balance: number;  // paid - owes (positive = creditor, negative = debtor)
}

export interface Transfer {
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    amount: number; // paise
}

export interface SettlementResult {
    balances: Balance[];
    transfers: Transfer[];
    totalSpent: number; // paise
    perPersonAvg: number; // paise
}

interface TransactionData {
    payerId: string;
    payerName: string;
    splits: { userId: string; userName: string; amount: number }[];
}

/**
 * Calculate balances and optimal transfers for a set of transactions.
 */
export function calculateSettlement(
    transactions: TransactionData[]
): SettlementResult {
    // Step 1: Accumulate paid and owed amounts per user
    const userMap = new Map<string, { name: string; paid: number; owes: number }>();

    for (const txn of transactions) {
        // Payer
        const payer = userMap.get(txn.payerId) || { name: txn.payerName, paid: 0, owes: 0 };
        const totalTxn = txn.splits.reduce((sum, s) => sum + s.amount, 0);
        payer.paid += totalTxn;
        userMap.set(txn.payerId, payer);

        // Each person who owes
        for (const split of txn.splits) {
            const person = userMap.get(split.userId) || { name: split.userName, paid: 0, owes: 0 };
            person.owes += split.amount;
            if (!userMap.has(split.userId)) {
                userMap.set(split.userId, person);
            }
        }
    }

    // Step 2: Calculate balances
    const balances: Balance[] = [];
    let totalSpent = 0;

    for (const [userId, data] of userMap) {
        const balance = data.paid - data.owes;
        balances.push({
            userId,
            name: data.name,
            paid: data.paid,
            owes: data.owes,
            balance,
        });
        totalSpent += data.paid;
    }

    // Avoid double counting — totalSpent is sum of what each person paid
    // which equals the total of all transactions
    totalSpent = totalSpent / 1; // already correct since we count payer.paid once

    const perPersonAvg = balances.length > 0 ? Math.round(totalSpent / balances.length) : 0;

    // Step 3: Greedy min-transfer algorithm
    const transfers = minimizeTransfers(balances);

    return {
        balances: balances.sort((a, b) => b.balance - a.balance),
        transfers,
        totalSpent,
        perPersonAvg,
    };
}

/**
 * Greedy algorithm to minimize the number of transfers.
 * Takes creditors (positive balance) and debtors (negative balance)
 * and matches them to produce minimal transfers.
 */
function minimizeTransfers(balances: Balance[]): Transfer[] {
    const creditors: { userId: string; name: string; amount: number }[] = [];
    const debtors: { userId: string; name: string; amount: number }[] = [];

    for (const b of balances) {
        if (b.balance > 0) {
            creditors.push({ userId: b.userId, name: b.name, amount: b.balance });
        } else if (b.balance < 0) {
            debtors.push({ userId: b.userId, name: b.name, amount: -b.balance });
        }
    }

    // Sort descending by amount
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transfers: Transfer[] = [];
    let ci = 0;
    let di = 0;

    while (ci < creditors.length && di < debtors.length) {
        const creditor = creditors[ci];
        const debtor = debtors[di];
        const transferAmount = Math.min(creditor.amount, debtor.amount);

        if (transferAmount > 0) {
            transfers.push({
                fromId: debtor.userId,
                fromName: debtor.name,
                toId: creditor.userId,
                toName: creditor.name,
                amount: transferAmount,
            });
        }

        creditor.amount -= transferAmount;
        debtor.amount -= transferAmount;

        if (creditor.amount === 0) ci++;
        if (debtor.amount === 0) di++;
    }

    return transfers;
}

/**
 * Calculate an equal split amount per person.
 * Handles remainder by distributing extra paise to first N users.
 */
export function calculateEqualSplit(
    totalPaise: number,
    numPeople: number
): number[] {
    if (numPeople <= 0) return [];

    const base = Math.floor(totalPaise / numPeople);
    const remainder = totalPaise - base * numPeople;

    return Array.from({ length: numPeople }, (_, i) =>
        i < remainder ? base + 1 : base
    );
}
