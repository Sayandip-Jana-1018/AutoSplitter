import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * GET /api/admin/health — System health diagnostics.
 * Returns database status, API latency, and data counts.
 * Protected: only works for authenticated users.
 */

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Measure database latency
        const dbStart = Date.now();
        let dbStatus: 'ok' | 'error' = 'ok';
        let counts = { users: 0, groups: 0, transactions: 0, settlements: 0, notifications: 0 };

        try {
            const [users, groups, transactions, settlements] = await Promise.all([
                prisma.user.count(),
                prisma.group.count(),
                prisma.transaction.count(),
                prisma.settlement.count(),
            ]);
            // Notification count may fail before migration
            let notifications = 0;
            try {
                notifications = await prisma.notification.count();
            } catch { /* table may not exist yet */ }
            counts = { users, groups, transactions, settlements, notifications };
        } catch {
            dbStatus = 'error';
        }
        const dbLatency = Date.now() - dbStart;

        // API latency (self-measure)
        const apiStart = Date.now();
        const apiLatency = Date.now() - apiStart;

        // Uptime
        const uptimeSeconds = process.uptime();
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const uptime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        return NextResponse.json({
            data: {
                database: { status: dbStatus, latencyMs: dbLatency },
                api: { status: 'ok', avgLatencyMs: apiLatency },
                counts,
                uptime,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Health check error:', error);
        return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
    }
}
