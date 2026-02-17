'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
    const router = useRouter();
    const haptics = useHaptics();

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
            })
            .catch(() => { });
    }, [currentUserId]);

    // Auto-cycle through settlements
    useEffect(() => {
        if (settlements.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex(i => (i + 1) % settlements.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [settlements.length]);

    const handleTap = useCallback(() => {
        haptics.light();
        router.push('/settlements');
    }, [haptics, router]);

    const handleDismiss = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        haptics.light();
        setDismissed(true);
    }, [haptics]);

    if (dismissed || settlements.length === 0) return null;

    const current = settlements[currentIndex % settlements.length];
    if (!current) return null;

    const isDebtor = current.fromId === currentUserId;
    const label = isDebtor
        ? `You owe ${current.toName} ${formatCurrency(current.amount)}`
        : `${current.fromName} owes you ${formatCurrency(current.amount)}`;

    return (
        <AnimatePresence>
            <motion.div
                key={currentIndex}
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                onClick={handleTap}
                style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-xl)',
                    background: isDebtor
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.06))'
                        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.06))',
                    border: `1px solid ${isDebtor ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)'}`,
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    marginBottom: 'var(--space-2)',
                }}
            >
                <AlertCircle size={16} style={{ color: isDebtor ? '#ef4444' : '#10b981', flexShrink: 0 }} />
                <span style={{
                    flex: 1, fontSize: 'var(--text-xs)', fontWeight: 600,
                    color: 'var(--fg-primary)', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {label}
                </span>
                <span style={{
                    fontSize: 'var(--text-2xs)', fontWeight: 700,
                    color: isDebtor ? '#ef4444' : '#10b981',
                    display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                }}>
                    {isDebtor ? 'Settle' : 'View'} <ArrowRight size={12} />
                </span>
                <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={handleDismiss}
                    style={{
                        background: 'none', border: 'none', padding: 4,
                        color: 'var(--fg-tertiary)', cursor: 'pointer', flexShrink: 0,
                    }}
                >
                    <X size={14} />
                </motion.button>
            </motion.div>
        </AnimatePresence>
    );
}
