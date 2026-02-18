'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, X, Receipt, Users, ArrowRightLeft, Clock } from 'lucide-react';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useRouter } from 'next/navigation';

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    read: boolean;
    link?: string;
    createdAt: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    new_expense: <Receipt size={16} />,
    payment_reminder: <Clock size={16} />,
    settlement_completed: <ArrowRightLeft size={16} />,
    group_activity: <Users size={16} />,
};

const TYPE_COLORS: Record<string, string> = {
    new_expense: 'var(--accent-400)',
    payment_reminder: '#f59e0b',
    settlement_completed: '#10b981',
    group_activity: '#3b82f6',
};

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationPanel() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [mounted, setMounted] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => { setMounted(true); }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.data || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch { /* silent */ }
    }, []);

    // Poll notifications every 30s
    useEffect(() => {
        if (!mounted) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30_000);
        return () => clearInterval(interval);
    }, [mounted, fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true }),
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch { /* silent */ }
    };

    const handleNotificationClick = async (notif: Notification) => {
        // Mark as read
        if (!notif.read) {
            try {
                await fetch('/api/notifications', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: [notif.id] }),
                });
                setNotifications(prev =>
                    prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch { /* silent */ }
        }

        // Navigate if link exists
        if (notif.link) {
            setOpen(false);
            router.push(notif.link);
        }
    };

    if (!isFeatureEnabled('notifications')) return null;

    return (
        <div ref={panelRef} style={{ position: 'relative' }} suppressHydrationWarning>
            {mounted && (
                <>
                    {/* Bell icon button */}
                    <button
                        onClick={() => setOpen(!open)}
                        style={{
                            width: 34,
                            height: 34,
                            position: 'relative',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(var(--accent-500-rgb), 0.08)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(var(--accent-500-rgb), 0.12)',
                            color: 'var(--accent-500)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            padding: 0,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(var(--accent-500-rgb), 0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(var(--accent-500-rgb), 0.08)';
                        }}
                        aria-label="Notifications"
                    >
                        <Bell size={16} />
                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                style={{
                                    position: 'absolute',
                                    top: 2, right: 2,
                                    width: 16, height: 16,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                    color: '#fff',
                                    fontSize: 9,
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid var(--bg-primary)',
                                }}
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.span>
                        )}
                    </button>

                    {/* Dropdown panel */}
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                style={{
                                    position: 'fixed',
                                    top: 72,
                                    right: 16,
                                    width: 340,
                                    maxWidth: 'calc(100vw - 32px)',
                                    maxHeight: 420,
                                    background: 'var(--surface-popover)',
                                    backdropFilter: 'blur(24px) saturate(1.5)',
                                    WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
                                    border: '1px solid var(--border-glass)',
                                    borderRadius: 'var(--radius-xl)',
                                    boxShadow: 'var(--shadow-lg)',
                                    overflow: 'hidden',
                                    zIndex: 100,
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                {/* Header */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '14px 16px 10px',
                                    borderBottom: '1px solid var(--border-subtle)',
                                }}>
                                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--fg-primary)' }}>
                                        Notifications
                                    </h3>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllRead}
                                                style={{
                                                    background: 'none', border: 'none',
                                                    color: 'var(--accent-400)',
                                                    fontSize: 'var(--text-2xs)', fontWeight: 600,
                                                    cursor: 'pointer', padding: '2px 8px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                }}
                                            >
                                                <CheckCheck size={12} /> Read all
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setOpen(false)}
                                            style={{
                                                background: 'none', border: 'none',
                                                color: 'var(--fg-tertiary)', cursor: 'pointer',
                                                padding: 2, display: 'flex',
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Notification list */}
                                <div style={{ overflowY: 'auto', flex: 1 }}>
                                    {notifications.length === 0 ? (
                                        <div style={{
                                            padding: 'var(--space-8) var(--space-4)',
                                            textAlign: 'center',
                                            color: 'var(--fg-tertiary)',
                                            fontSize: 'var(--text-sm)',
                                        }}>
                                            <Bell size={24} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                                            <p>No notifications yet</p>
                                        </div>
                                    ) : (
                                        notifications.map((notif, i) => (
                                            <motion.div
                                                key={notif.id}
                                                initial={{ opacity: 0, x: -12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                onClick={() => handleNotificationClick(notif)}
                                                style={{
                                                    padding: '12px 16px',
                                                    display: 'flex',
                                                    gap: 12,
                                                    cursor: notif.link ? 'pointer' : 'default',
                                                    borderBottom: '1px solid var(--border-subtle)',
                                                    background: notif.read ? 'transparent' : 'rgba(var(--accent-500-rgb), 0.04)',
                                                    transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(var(--accent-500-rgb), 0.06)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(var(--accent-500-rgb), 0.04)'; }}
                                            >
                                                {/* Icon */}
                                                <div style={{
                                                    width: 32, height: 32,
                                                    borderRadius: '50%',
                                                    background: `color-mix(in srgb, ${TYPE_COLORS[notif.type] || 'var(--accent-400)'} 12%, transparent)`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: TYPE_COLORS[notif.type] || 'var(--accent-400)',
                                                    flexShrink: 0,
                                                }}>
                                                    {TYPE_ICONS[notif.type] || <Bell size={16} />}
                                                </div>

                                                {/* Content */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{
                                                        fontSize: 'var(--text-xs)',
                                                        fontWeight: notif.read ? 500 : 600,
                                                        color: 'var(--fg-primary)',
                                                        lineHeight: 1.4,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                    }}>
                                                        {notif.body}
                                                    </p>
                                                    <span style={{
                                                        fontSize: 'var(--text-2xs)',
                                                        color: 'var(--fg-muted)',
                                                        marginTop: 2,
                                                        display: 'block',
                                                    }}>
                                                        {timeAgo(notif.createdAt)}
                                                    </span>
                                                </div>

                                                {/* Unread dot */}
                                                {!notif.read && (
                                                    <div style={{
                                                        width: 6, height: 6,
                                                        borderRadius: '50%',
                                                        background: 'var(--accent-500)',
                                                        flexShrink: 0,
                                                        alignSelf: 'center',
                                                    }} />
                                                )}
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}

