import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isFeatureEnabled } from '@/lib/featureFlags';

/**
 * GET /api/notifications — list user's notifications (newest first, max 50)
 * PATCH /api/notifications — mark notifications as read
 */

export async function GET() {
    try {
        if (!isFeatureEnabled('notifications')) {
            return NextResponse.json({ data: [] });
        }

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: user.id, read: false },
        });

        return NextResponse.json({ data: notifications, unreadCount });
    } catch (error) {
        console.error('Notifications GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const body = await req.json();
        const { ids, markAll } = body as { ids?: string[]; markAll?: boolean };

        if (markAll) {
            await prisma.notification.updateMany({
                where: { userId: user.id, read: false },
                data: { read: true },
            });
        } else if (ids && ids.length > 0) {
            await prisma.notification.updateMany({
                where: { id: { in: ids }, userId: user.id },
                data: { read: true },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Notifications PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }
}
