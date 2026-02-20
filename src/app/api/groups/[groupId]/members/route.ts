import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// DELETE /api/groups/:groupId/members — remove a member from the group
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ groupId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { groupId } = await params;
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Verify the group exists and the current user is the owner or admin
        const group = await prisma.group.findFirst({
            where: { id: groupId },
            include: {
                members: { where: { userId: currentUser.id } },
            },
        });

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        const isOwner = group.ownerId === currentUser.id;
        const isAdmin = group.members[0]?.role === 'admin';

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Only the group owner or admin can remove members' }, { status: 403 });
        }

        // Cannot remove the owner
        if (userId === group.ownerId) {
            return NextResponse.json({ error: 'Cannot remove the group owner' }, { status: 400 });
        }

        // Cannot remove yourself (use leave instead)
        if (userId === currentUser.id) {
            return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
        }

        // Delete the membership
        await prisma.groupMember.deleteMany({
            where: {
                groupId,
                userId,
            },
        });

        // Notify the removed user
        await prisma.notification.create({
            data: {
                userId,
                type: 'member_removed',
                title: '🚪 Removed from group',
                body: `You were removed from "${group.name}" by ${currentUser.name || 'an admin'}`,
                link: '/groups', // Link to groups list since they can no longer access the specific group
            },
        });

        // Notify remaining members
        const remainingMemberIds = group.members
            .filter(m => m.userId !== userId && m.userId !== currentUser.id)
            .map(m => m.userId);

        if (remainingMemberIds.length > 0) {
            // Get removed user details to show name
            const removedUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

            await prisma.notification.createMany({
                data: remainingMemberIds.map(memberId => ({
                    userId: memberId,
                    type: 'member_removed',
                    title: '🚪 Member removed',
                    body: `${removedUser?.name || 'A member'} was removed from "${group.name}"`,
                    link: `/groups/${groupId}`,
                })),
            });
        }

        return NextResponse.json({ success: true, message: 'Member removed' });
    } catch (error) {
        console.error('Remove member error:', error);
        return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
    }
}
