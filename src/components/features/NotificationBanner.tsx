'use client';

import useSWR from 'swr';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle, Check, ArrowRightLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null);

interface ComputedTransfer {
    from: string;
    fromName: string;
    to: string;
    toName: string;
    amount: number;
}

export default function NotificationBanner() {
    const [dismissed, setDismissed] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('notif-banner-dismissed') === 'true';
        }
        return false;
    });
    const [mounted, setMounted] = useState(false);
    const haptics = useHaptics();
    const router = useRouter();

    // Prevent hydration mismatch — only render after mount
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    const { user: currentUserData } = useCurrentUser();
    const currentUserId = currentUserData?.id || null;

    const { data: settData, isLoading } = useSWR(
        currentUserId ? '/api/settlements' : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60_000 }
    );

    // Derive net totals from computed transfers
    const { totalYouOwe, totalOwedToYou, dataLoaded } = useMemo(() => {
        if (isLoading || !currentUserId) {
            return { totalYouOwe: 0, totalOwedToYou: 0, dataLoaded: false };
        }
        if (settData) {
            const computed: ComputedTransfer[] = settData.computed || [];
            let youOwe = 0;
            let owedToYou = 0;
            for (const t of computed) {
                if (t.from === currentUserId) {
                    youOwe += t.amount;
                } else if (t.to === currentUserId) {
                    owedToYou += t.amount;
                }
            }
            return { totalYouOwe: youOwe, totalOwedToYou: owedToYou, dataLoaded: true };
        }
        if (settData === null) {
            return { totalYouOwe: 0, totalOwedToYou: 0, dataLoaded: true };
        }
        return { totalYouOwe: 0, totalOwedToYou: 0, dataLoaded: false };
    }, [settData, currentUserId, isLoading]);

    const handleDismiss = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        haptics.light();
        setDismissed(true);
        sessionStorage.setItem('notif-banner-dismissed', 'true');
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
    if (totalYouOwe === 0 && totalOwedToYou === 0 && currentUserId) {
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

    if (totalYouOwe === 0 && totalOwedToYou === 0) return null;

    // Build the label based on net amounts
    const netBalance = totalOwedToYou - totalYouOwe;
    const isNetDebtor = netBalance < 0;
    const label = totalYouOwe > 0 && totalOwedToYou > 0
        ? `You owe ${formatCurrency(totalYouOwe)} · ${formatCurrency(totalOwedToYou)} owed to you`
        : totalYouOwe > 0
            ? `You owe ${formatCurrency(totalYouOwe)} overall`
            : `${formatCurrency(totalOwedToYou)} owed to you`;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onClick={() => router.push('/settlements')}
            style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-xl)',
                background: isNetDebtor
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.06))'
                    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.06))',
                border: `1px solid ${isNetDebtor ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)'}`,
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 'var(--space-2)',
                minHeight: 36,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
        >
            <ArrowRightLeft size={14} style={{ color: isNetDebtor ? '#ef4444' : '#10b981', flexShrink: 0 }} />
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
    );
}

