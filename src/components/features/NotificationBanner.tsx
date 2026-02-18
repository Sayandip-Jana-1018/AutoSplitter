'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface PendingSettlement {
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    amount: number;
}

export default function NotificationBanner() {
    const [settlements, setSettlements] = useState<PendingSettlement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissed, setDismissed] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [mounted, setMounted] = useState(false);
    const haptics = useHaptics();

    // Prevent hydration mismatch — only render after mount
    useEffect(() => { setMounted(true); }, []);

    // Fetch current user
    useEffect(() => {
        fetch('/api/me')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data?.id) setCurrentUserId(data.id); })
            .catch(() => { });
    }, []);

    // Fetch pending settlements
    useEffect(() => {
        if (!currentUserId) return;
        setDataLoaded(false);
        fetch('/api/settlements')
            .then(r => r.ok ? r.json() : { computed: [] })
            .then(data => {
                const pending = (data.computed || [])
                    .filter((s: any) => s.from === currentUserId || s.to === currentUserId)
                    .map((s: any) => ({
                        fromId: s.from,
                        fromName: s.fromName || 'Someone',
                        toId: s.to,
                        toName: s.toName || 'Someone',
                        amount: s.amount,
                    }));
                setSettlements(pending);
                setDataLoaded(true);
            })
            .catch(() => { setDataLoaded(true); });
    }, [currentUserId]);

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
    if (!mounted) return null;

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
