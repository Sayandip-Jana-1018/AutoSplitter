'use client';

import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Users,
    Receipt,
    ArrowRightLeft,
    Plus,
    ArrowRight,
    BarChart3,
    Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar, { AvatarGroup } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { CategoryIcon, PaymentIcon, PAYMENT_ICONS } from '@/components/ui/Icons';
import { formatCurrency, timeAgo, cn } from '@/lib/utils';

// ── Mock Data (until DB is connected) ──
const MOCK_STATS = {
    totalSpent: 2345000,   // ₹23,450
    youOwe: 345000,        // ₹3,450
    youAreOwed: 125000,    // ₹1,250
    activeTrips: 2,
};

const MOCK_MEMBERS = [
    { name: 'Sayan Das' },
    { name: 'Aman Singh' },
    { name: 'Priya Gupta' },
    { name: 'Rahul Verma' },
    { name: 'Neha Sharma' },
];

const MOCK_RECENT = [
    { id: '1', title: 'Dinner at Barbeque Nation', amount: 450000, payer: 'Sayan Das', category: 'food', method: 'gpay', time: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: '2', title: 'Cab to Airport', amount: 120000, payer: 'Aman Singh', category: 'transport', method: 'cash', time: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    { id: '3', title: 'Hotel Room', amount: 890000, payer: 'Priya Gupta', category: 'stay', method: 'phonepe', time: new Date(Date.now() - 24 * 60 * 60 * 1000) },
];

const MOCK_SETTLEMENTS = [
    { from: 'You', to: 'Priya Gupta', amount: 175000 },
    { from: 'Aman Singh', to: 'You', amount: 85000 },
    { from: 'Rahul Verma', to: 'Sayan Das', amount: 62000 },
];

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
    animate: {
        transition: { staggerChildren: 0.08 },
    },
};

export default function DashboardPage() {
    return (
        <motion.div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-6)',
            }}
            initial="initial"
            animate="animate"
            variants={staggerContainer}
        >
            {/* ── Welcome Header ── */}
            <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginBottom: 4,
                }}>
                    <Sparkles size={20} style={{ color: 'var(--accent-400)' }} />
                    <p style={{
                        color: 'var(--fg-tertiary)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                    }}>
                        Dashboard
                    </p>
                </div>
                <h2 style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 800,
                    marginBottom: 6,
                    background: 'linear-gradient(135deg, var(--fg-primary), var(--accent-400))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}>
                    Hey, Sayan! 👋
                </h2>
                <p style={{
                    color: 'var(--fg-secondary)',
                    fontSize: 'var(--text-sm)',
                    lineHeight: 1.5,
                }}>
                    Here&apos;s your expense summary for the current trips.
                </p>
            </motion.div>

            {/* ── Stat Cards ── */}
            <motion.div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 'var(--space-3)',
                }}
                variants={staggerContainer}
            >
                <StatCard
                    label="Total Spent"
                    value={formatCurrency(MOCK_STATS.totalSpent)}
                    icon={<Receipt size={18} />}
                    gradient="linear-gradient(135deg, var(--accent-500), var(--accent-600))"
                    iconBg="rgba(var(--accent-500-rgb), 0.15)"
                />
                <StatCard
                    label="You Owe"
                    value={formatCurrency(MOCK_STATS.youOwe)}
                    icon={<TrendingDown size={18} />}
                    gradient="linear-gradient(135deg, #f87171, #ef4444)"
                    iconBg="rgba(239, 68, 68, 0.15)"
                    accent
                />
                <StatCard
                    label="You Are Owed"
                    value={formatCurrency(MOCK_STATS.youAreOwed)}
                    icon={<TrendingUp size={18} />}
                    gradient="linear-gradient(135deg, #34d399, #10b981)"
                    iconBg="rgba(16, 185, 129, 0.15)"
                />
                <StatCard
                    label="Active Trips"
                    value={MOCK_STATS.activeTrips.toString()}
                    icon={<Users size={18} />}
                    gradient="linear-gradient(135deg, var(--accent-400), var(--accent-500))"
                    iconBg="rgba(var(--accent-500-rgb), 0.15)"
                />
            </motion.div>

            {/* ── Recent Transactions ── */}
            <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.15 }}>
                <SectionHeader title="Recent Transactions" action="View All" href="/transactions" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {MOCK_RECENT.map((txn, i) => {
                        const pay = PAYMENT_ICONS[txn.method] || PAYMENT_ICONS.cash;
                        return (
                            <motion.div
                                key={txn.id}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
                            >
                                <Card interactive padding="compact">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                        <div style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 'var(--radius-lg)',
                                            background: 'rgba(var(--accent-500-rgb), 0.08)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <CategoryIcon category={txn.category} size={18} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: 'var(--text-sm)',
                                                fontWeight: 600,
                                                color: 'var(--fg-primary)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {txn.title}
                                            </div>
                                            <div style={{
                                                fontSize: 'var(--text-xs)',
                                                color: 'var(--fg-tertiary)',
                                                display: 'flex',
                                                gap: 'var(--space-1)',
                                                alignItems: 'center',
                                                marginTop: 2,
                                            }}>
                                                <span>{txn.payer}</span>
                                                <span style={{ opacity: 0.4 }}>·</span>
                                                <span>{timeAgo(txn.time)}</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{
                                                fontWeight: 700,
                                                fontSize: 'var(--text-sm)',
                                                color: 'var(--fg-primary)',
                                            }}>
                                                {formatCurrency(txn.amount)}
                                            </div>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 3,
                                                fontSize: 'var(--text-xs)',
                                                color: pay.color,
                                                marginTop: 2,
                                            }}>
                                                <PaymentIcon method={txn.method} size={12} /> {pay.label}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* ── Pending Settlements ── */}
            <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.25 }}>
                <SectionHeader title="Pending Settlements" action="Settle Up" href="/settlements" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {MOCK_SETTLEMENTS.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 + i * 0.06 }}
                        >
                            <Card padding="compact" glow>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <div style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 'var(--radius-md)',
                                        background: s.from === 'You'
                                            ? 'rgba(239, 68, 68, 0.1)'
                                            : 'rgba(16, 185, 129, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <ArrowRightLeft
                                            size={15}
                                            style={{
                                                color: s.from === 'You' ? 'var(--color-error)' : 'var(--color-success)',
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <span style={{
                                            fontSize: 'var(--text-sm)',
                                            color: 'var(--fg-primary)',
                                            fontWeight: 500,
                                        }}>
                                            {s.from === 'You' ? (
                                                <>You → <strong>{s.to}</strong></>
                                            ) : (
                                                <><strong>{s.from}</strong> → You</>
                                            )}
                                        </span>
                                    </div>
                                    <span style={{
                                        fontWeight: 700,
                                        fontSize: 'var(--text-sm)',
                                        color: s.from === 'You' ? 'var(--color-error)' : 'var(--color-success)',
                                    }}>
                                        {formatCurrency(s.amount)}
                                    </span>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Add Button */}
                <div style={{ marginTop: 'var(--space-4)' }}>
                    <Button variant="outline" fullWidth leftIcon={<Plus size={16} />}>
                        Add New Expense
                    </Button>
                </div>
            </motion.div>

            {/* ── Analytics Quick Link ── */}
            <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.35 }}>
                <a href="/analytics" style={{ textDecoration: 'none' }}>
                    <Card interactive padding="normal">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div style={{
                                width: 42,
                                height: 42,
                                borderRadius: 'var(--radius-lg)',
                                background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                boxShadow: '0 4px 16px rgba(var(--accent-500-rgb), 0.3)',
                            }}>
                                <BarChart3 size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)' }}>
                                    Spending Analytics
                                </div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
                                    Charts &amp; breakdowns
                                </div>
                            </div>
                            <ArrowRight size={16} style={{ color: 'var(--fg-muted)' }} />
                        </div>
                    </Card>
                </a>
            </motion.div>

            {/* ── Group Members ── */}
            <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.4 }}>
                <SectionHeader title="Trip Members" />
                <Card padding="normal">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <AvatarGroup users={MOCK_MEMBERS} max={5} size="md" />
                        <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                            Manage
                        </Button>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
}

// ── Sub-components ──

function StatCard({
    label,
    value,
    icon,
    gradient,
    iconBg,
    accent,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    gradient: string;
    iconBg: string;
    accent?: boolean;
}) {
    return (
        <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
            <Card glow={accent} padding="normal">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)',
                }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-lg)',
                        background: iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--fg-primary)',
                    }}>
                        {icon}
                    </div>
                    <div>
                        <p style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--fg-tertiary)',
                            fontWeight: 500,
                            marginBottom: 4,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                        }}>
                            {label}
                        </p>
                        <p style={{
                            fontSize: 'var(--text-xl)',
                            fontWeight: 800,
                            background: gradient,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            {value}
                        </p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

function SectionHeader({
    title,
    action,
    href,
}: {
    title: string;
    action?: string;
    href?: string;
}) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-3)',
        }}>
            <h3 style={{
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                color: 'var(--fg-primary)',
            }}>
                {title}
            </h3>
            {action && href && (
                <a
                    href={href}
                    style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--accent-400)',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'color 0.2s',
                    }}
                >
                    {action}
                    <ArrowRight size={14} />
                </a>
            )}
        </div>
    );
}
