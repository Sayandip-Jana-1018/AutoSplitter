'use client';

import useSWR from 'swr';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null);

interface PendingSettlement {
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    amount: number;
}

export default function NotificationBanner() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissed, setDismissed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const haptics = useHaptics();

    // Prevent hydration mismatch — only render after mount
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    const { user: currentUserData } = useCurrentUser();
    const currentUserId = currentUserData?.id || null;

    const { data: settData, isLoading } = useSWR(currentUserId ? '/api/settlements' : null, fetcher);

    // Derive settlements and loading state from SWR data (no setState in effect)
    const { settlements, dataLoaded } = useMemo(() => {
        if (isLoading || !currentUserId) {
            return { settlements: [] as PendingSettlement[], dataLoaded: false };
        }
        if (settData) {
            const pending: PendingSettlement[] = (settData.computed || [])
                .filter((s: Record<string, unknown>) => s.from === currentUserId || s.to === currentUserId)
                .map((s: Record<string, unknown>) => ({
                    fromId: String(s.from || ''),
                    fromName: String(s.fromName || 'Someone'),
                    toId: String(s.to || ''),
                    toName: String(s.toName || 'Someone'),
                    amount: Number(s.amount || 0),
                }));
            return { settlements: pending, dataLoaded: true };
        }
        if (settData === null) {
            return { settlements: [] as PendingSettlement[], dataLoaded: true };
        }
        return { settlements: [] as PendingSettlement[], dataLoaded: false };
    }, [settData, currentUserId, isLoading]);

    // Auto-cycle through settlements
    useEffect(() => {
        if (settlements.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex(i => (i + 1) % settlements.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [settlements.length]);

    const handleDismiss = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        haptics.light();
        setDismissed(true);
    }, [haptics]);

    if (dismissed) return null;
    if (!mounted) return <></>;

    // Loading state
    if (!dataLoaded) {
        return (
            <div
                style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-xl)',
                    background: 'linear-gradient(135deg, rgba(var(--accent-500-rgb), 0.08), rgba(var(--accent-500-rgb), 0.04))',
                    border: '1px solid rgba(var(--accent-500-rgb), 0.12)',
                    display: 'flex', alignItems: 'center', gap: 10,
                    marginBottom: 'var(--space-2)',
                    minHeight: 36,
                }}
            >
                <AlertCircle size={14} style={{ color: 'var(--accent-400)', flexShrink: 0, animation: 'spin 2s linear infinite' }} />
                <span style={{
                    flex: 1, fontSize: 'var(--text-xs)', fontWeight: 500,
                    color: 'var(--fg-tertiary)',
                }}>
                    Checking settlements...
                </span>
            </div>
        );
    }

    // All settled state
    if (settlements.length === 0 && currentUserId) {
        return (
            <div
                style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-xl)',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.06))',
                    border: '1px solid rgba(16, 185, 129, 0.18)',
                    display: 'flex', alignItems: 'center', gap: 10,
                    marginBottom: 'var(--space-2)',
                }}
            >
                <Check size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                <span style={{
                    flex: 1, fontSize: 'var(--text-xs)', fontWeight: 600,
                    color: 'var(--fg-primary)',
                }}>
                    All payments settled! 🎉
                </span>
                <button
                    onClick={handleDismiss}
                    style={{
                        background: 'none', border: 'none', padding: 4,
                        color: 'var(--fg-tertiary)', cursor: 'pointer', flexShrink: 0,
                    }}
                >
                    <X size={12} />
                </button>
            </div>
        );
    }

    if (settlements.length === 0) return null;

    const current = settlements[currentIndex % settlements.length];
    if (!current) return null;

    const isDebtor = current.fromId === currentUserId;
    const label = isDebtor
        ? `You owe ${current.toName} ${formatCurrency(current.amount)}`
        : `${current.fromName} owes you ${formatCurrency(current.amount)}`;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-xl)',
                    background: isDebtor
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.06))'
                        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.06))',
                    border: `1px solid ${isDebtor ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)'}`,
                    display: 'flex', alignItems: 'center', gap: 10,
                    marginBottom: 'var(--space-2)',
                    minHeight: 36,
                }}
            >
                <AlertCircle size={14} style={{ color: isDebtor ? '#ef4444' : '#10b981', flexShrink: 0 }} />
                <span style={{
                    flex: 1, fontSize: 'var(--text-xs)', fontWeight: 600,
                    color: 'var(--fg-primary)', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {label}
                </span>
                <button
                    onClick={handleDismiss}
                    style={{
                        background: 'none', border: 'none', padding: 4,
                        color: 'var(--fg-tertiary)', cursor: 'pointer', flexShrink: 0,
                    }}
                >
                    <X size={12} />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
