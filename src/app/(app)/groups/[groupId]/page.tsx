'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Plus,
    Users,
    Receipt,
    ArrowRightLeft,
    Settings,
    Share2,
    Copy,
    Check,
    Link2,
    MoreVertical,
    TrendingDown,
    TrendingUp,
    Calendar,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Avatar, { AvatarGroup } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { formatCurrency, timeAgo, cn } from '@/lib/utils';

// Mock data
const GROUP = {
    id: 'abc123',
    name: 'Goa Trip 2026',
    emoji: '🏖️',
    inviteCode: 'https://autosplit.app/join/abc123',
    createdAt: '2026-02-10',
};

const TRIP = {
    id: 'trip1',
    title: 'Goa Feb 2026',
    startDate: '2026-02-14',
    endDate: '2026-02-18',
    totalSpent: 2345000,
    isActive: true,
};

const MEMBERS = [
    { id: '1', name: 'Sayan Das', role: 'admin', balance: 87500 },
    { id: '2', name: 'Aman Singh', role: 'member', balance: -42000 },
    { id: '3', name: 'Priya Gupta', role: 'member', balance: -135000 },
    { id: '4', name: 'Rahul Verma', role: 'member', balance: 89500 },
];

const RECENT_TRANSACTIONS = [
    { id: '1', title: 'Pizza at Dominos', emoji: '🍕', amount: 129000, payer: 'Sayan Das', time: new Date(Date.now() - 3600000) },
    { id: '2', title: 'Uber to Beach', emoji: '🚗', amount: 45000, payer: 'Aman Singh', time: new Date(Date.now() - 7200000) },
    { id: '3', title: 'Hotel Booking', emoji: '🏨', amount: 450000, payer: 'Priya Gupta', time: new Date(Date.now() - 86400000) },
];

type Tab = 'overview' | 'members' | 'activity';

export default function GroupDetailPage() {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>('overview');
    const [showInvite, setShowInvite] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(GROUP.inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <button
                    onClick={() => router.push('/groups')}
                    style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: 'var(--fg-secondary)',
                        display: 'flex',
                        padding: 4,
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <span style={{ fontSize: 28 }}>{GROUP.emoji}</span>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{GROUP.name}</h2>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>
                        {MEMBERS.length} members · Created {GROUP.createdAt}
                    </p>
                </div>
                <Button size="sm" variant="ghost" iconOnly onClick={() => setShowInvite(true)}>
                    <Share2 size={18} />
                </Button>
            </div>

            {/* ── Trip Summary Card ── */}
            <Card padding="normal" glow>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                    <Calendar size={16} style={{ color: 'var(--accent-500)' }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{TRIP.title}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>
                            {TRIP.startDate} → {TRIP.endDate}
                        </div>
                    </div>
                    <Badge variant="accent" size="sm">Active</Badge>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--space-3)',
                }}>
                    <div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginBottom: 2 }}>Total Spent</p>
                        <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{formatCurrency(TRIP.totalSpent)}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginBottom: 2 }}>Per Person</p>
                        <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{formatCurrency(Math.round(TRIP.totalSpent / MEMBERS.length))}</p>
                    </div>
                </div>
            </Card>

            {/* ── Tabs ── */}
            <div style={{
                display: 'flex',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-lg)',
                padding: 3,
            }}>
                {(['overview', 'members', 'activity'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 500,
                            background: tab === t ? 'var(--surface-card)' : 'transparent',
                            color: tab === t ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
                            boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
                            transition: 'all 0.2s',
                        }}
                    >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            <AnimatePresence mode="wait">
                {tab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
                    >
                        {/* Balances */}
                        <div>
                            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--fg-secondary)' }}>
                                Balances
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {MEMBERS.map((member) => (
                                    <Card key={member.id} padding="compact">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                            <Avatar name={member.name} size="sm" />
                                            <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                                                {member.name}
                                                {member.id === '1' && <span style={{ color: 'var(--fg-tertiary)' }}> (You)</span>}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                                {member.balance > 0 ? (
                                                    <TrendingUp size={14} style={{ color: 'var(--color-success)' }} />
                                                ) : member.balance < 0 ? (
                                                    <TrendingDown size={14} style={{ color: 'var(--color-error)' }} />
                                                ) : null}
                                                <span style={{
                                                    fontSize: 'var(--text-sm)',
                                                    fontWeight: 600,
                                                    color: member.balance > 0 ? 'var(--color-success)' : member.balance < 0 ? 'var(--color-error)' : 'var(--fg-tertiary)',
                                                }}>
                                                    {member.balance > 0 ? '+' : ''}{formatCurrency(Math.abs(member.balance))}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-secondary)' }}>Recent</h3>
                                <Button variant="ghost" size="sm" onClick={() => setTab('activity')}>View All</Button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {RECENT_TRANSACTIONS.map((txn) => (
                                    <Card key={txn.id} interactive padding="compact">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                            <span style={{ fontSize: 22 }}>{txn.emoji}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {txn.title}
                                                </div>
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>
                                                    {txn.payer.split(' ')[0]} · {timeAgo(txn.time)}
                                                </div>
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{formatCurrency(txn.amount)}</span>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                            <Button fullWidth leftIcon={<Plus size={16} />} onClick={() => router.push('/transactions/new')}>
                                Add Expense
                            </Button>
                            <Button fullWidth variant="outline" leftIcon={<ArrowRightLeft size={16} />} onClick={() => router.push('/settlements')}>
                                Settle Up
                            </Button>
                        </div>
                    </motion.div>
                )}

                {tab === 'members' && (
                    <motion.div
                        key="members"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
                    >
                        {MEMBERS.map((member, i) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                            >
                                <Card padding="normal">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                        <Avatar name={member.name} size="md" />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                                                {member.name}
                                                {member.id === '1' && <span style={{ color: 'var(--fg-tertiary)' }}> (You)</span>}
                                            </div>
                                            <Badge
                                                variant={member.role === 'admin' ? 'accent' : 'default'}
                                                size="sm"
                                            >
                                                {member.role}
                                            </Badge>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{
                                                fontSize: 'var(--text-sm)',
                                                fontWeight: 600,
                                                color: member.balance > 0 ? 'var(--color-success)' : member.balance < 0 ? 'var(--color-error)' : 'var(--fg-tertiary)',
                                            }}>
                                                {member.balance > 0 ? 'gets back' : member.balance < 0 ? 'owes' : 'settled'}
                                            </div>
                                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--fg-primary)' }}>
                                                {formatCurrency(Math.abs(member.balance))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                        <Button fullWidth variant="outline" leftIcon={<Users size={16} />} onClick={() => setShowInvite(true)}>
                            Invite Members
                        </Button>
                    </motion.div>
                )}

                {tab === 'activity' && (
                    <motion.div
                        key="activity"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
                    >
                        {RECENT_TRANSACTIONS.concat(RECENT_TRANSACTIONS).map((txn, i) => (
                            <motion.div
                                key={`${txn.id}-${i}`}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                            >
                                <Card interactive padding="compact">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                        <span style={{ fontSize: 22 }}>{txn.emoji}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {txn.title}
                                            </div>
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>
                                                {txn.payer} · {timeAgo(txn.time)}
                                            </div>
                                        </div>
                                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{formatCurrency(txn.amount)}</span>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Invite Modal ── */}
            <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite to Group" size="small">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)' }}>
                        Share this link with friends to invite them:
                    </p>
                    <div style={{
                        display: 'flex',
                        gap: 'var(--space-2)',
                        background: 'var(--bg-tertiary)',
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-lg)',
                        alignItems: 'center',
                    }}>
                        <Link2 size={16} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
                        <span style={{
                            flex: 1,
                            fontSize: 'var(--text-sm)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {GROUP.inviteCode}
                        </span>
                        <Button size="sm" variant={copied ? 'ghost' : 'primary'} iconOnly onClick={handleCopy}>
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </Button>
                    </div>
                    <Button fullWidth variant="secondary" leftIcon={<Share2 size={16} />}>
                        Share via WhatsApp
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
