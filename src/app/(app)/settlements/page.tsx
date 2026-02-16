'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, Check, ExternalLink, Share2, Download, GitBranch } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import SettlementGraph from '@/components/features/SettlementGraph';
import { formatCurrency, cn } from '@/lib/utils';
import { exportAsText, exportAsCSV, shareSettlement } from '@/lib/export';
import { openUpiPayment, generateReminder, sendWhatsAppReminder } from '@/lib/upi';

const MOCK_SETTLEMENTS = [
    { id: '1', from: { name: 'You', id: 'self' }, to: { name: 'Priya Gupta', id: '3' }, amount: 175000, status: 'pending' },
    { id: '2', from: { name: 'Aman Singh', id: '2' }, to: { name: 'You', id: 'self' }, amount: 85000, status: 'pending' },
    { id: '3', from: { name: 'Rahul Verma', id: '4' }, to: { name: 'Sayan Das', id: '1' }, amount: 62500, status: 'settled' },
    { id: '4', from: { name: 'You', id: 'self' }, to: { name: 'Tanisha Roy', id: '5' }, amount: 42000, status: 'pending' },
];

const GRAPH_MEMBERS = ['You', 'Priya Gupta', 'Aman Singh', 'Rahul Verma', 'Tanisha Roy'];
const GRAPH_SETTLEMENTS = MOCK_SETTLEMENTS
    .filter((s) => s.status === 'pending')
    .map((s) => ({ from: s.from.name, to: s.to.name, amount: s.amount }));

const totalYouOwe = MOCK_SETTLEMENTS
    .filter((s) => s.from.id === 'self' && s.status === 'pending')
    .reduce((sum, s) => sum + s.amount, 0);

const totalOwedToYou = MOCK_SETTLEMENTS
    .filter((s) => s.to.id === 'self' && s.status === 'pending')
    .reduce((sum, s) => sum + s.amount, 0);

export default function SettlementsPage() {
    const [tab, setTab] = useState<'pending' | 'settled'>('pending');
    const [showGraph, setShowGraph] = useState(false);

    const filteredSettlements = MOCK_SETTLEMENTS.filter((s) =>
        tab === 'pending' ? s.status === 'pending' : s.status === 'settled'
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Settlements</h2>
                <p style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)' }}>
                    Minimum transfers to settle all debts
                </p>
            </div>

            {/* Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-3)',
            }}>
                <Card padding="normal">
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                        You Owe
                    </p>
                    <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-error)' }}>
                        {formatCurrency(totalYouOwe)}
                    </p>
                </Card>
                <Card padding="normal">
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                        Owed to You
                    </p>
                    <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-success)' }}>
                        {formatCurrency(totalOwedToYou)}
                    </p>
                </Card>
            </div>

            {/* Settlement Graph Toggle */}
            <Button
                variant="outline"
                fullWidth
                leftIcon={<GitBranch size={16} />}
                onClick={() => setShowGraph(!showGraph)}
            >
                {showGraph ? 'Hide' : 'Show'} Transfer Graph
            </Button>

            <AnimatePresence>
                {showGraph && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <Card padding="normal">
                            <SettlementGraph members={GRAPH_MEMBERS} settlements={GRAPH_SETTLEMENTS} />
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-lg)',
                padding: 3,
            }}>
                {(['pending', 'settled'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            flex: 1,
                            padding: '8px 16px',
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
                        {t === 'pending' ? 'Pending' : 'Settled'}
                    </button>
                ))}
            </div>

            {/* Settlement List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {filteredSettlements.map((settlement, i) => {
                    const isSender = settlement.from.id === 'self';
                    const isReceiver = settlement.to.id === 'self';
                    const isSettled = settlement.status === 'settled';

                    return (
                        <motion.div
                            key={settlement.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                        >
                            <Card
                                padding="normal"
                                glow={!isSettled}
                                style={isSettled ? { opacity: 0.7 } : undefined}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                    {/* Transfer direction */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                        <Avatar name={settlement.from.name} size="sm" />
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-2)',
                                                fontSize: 'var(--text-sm)',
                                            }}>
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: isSender ? 'var(--color-error)' : 'var(--fg-primary)',
                                                }}>
                                                    {settlement.from.name}
                                                </span>
                                                <ArrowRightLeft size={14} style={{ color: 'var(--fg-muted)' }} />
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: isReceiver ? 'var(--color-success)' : 'var(--fg-primary)',
                                                }}>
                                                    {settlement.to.name}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{
                                                fontSize: 'var(--text-lg)',
                                                fontWeight: 700,
                                                color: isSender ? 'var(--color-error)' : isReceiver ? 'var(--color-success)' : 'var(--fg-primary)',
                                            }}>
                                                {formatCurrency(settlement.amount)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {!isSettled && (
                                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                            {isSender && (
                                                <>
                                                    <Button size="sm" fullWidth leftIcon={<ExternalLink size={14} />} onClick={() => openUpiPayment({ upiId: 'user@okaxis', payeeName: settlement.to.name, amount: settlement.amount / 100, note: `AutoSplit: ${settlement.from.name} → ${settlement.to.name}` })}>
                                                        Pay via UPI
                                                    </Button>
                                                    <Button size="sm" variant="ghost" iconOnly>
                                                        <Check size={16} />
                                                    </Button>
                                                </>
                                            )}
                                            {isReceiver && (
                                                <>
                                                    <Button size="sm" fullWidth variant="outline" leftIcon={<Share2 size={14} />} onClick={() => { const msg = generateReminder('You', settlement.from.name, settlement.amount / 100); navigator.clipboard.writeText(msg); }}>
                                                        Send Reminder
                                                    </Button>
                                                    <Button size="sm" variant="ghost" iconOnly>
                                                        <Check size={16} />
                                                    </Button>
                                                </>
                                            )}
                                            {!isSender && !isReceiver && (
                                                <Badge variant="accent">Between others</Badge>
                                            )}
                                        </div>
                                    )}

                                    {isSettled && (
                                        <Badge variant="success" size="sm">
                                            <Check size={12} /> Settled
                                        </Badge>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="outline" fullWidth leftIcon={<Download size={16} />} onClick={() => {
                    const data = {
                        groupName: 'Goa Trip',
                        tripName: 'Goa_Trip_2025',
                        members: GRAPH_MEMBERS.map((m) => ({ name: m })),
                        transactions: [],
                        settlements: MOCK_SETTLEMENTS.filter((s) => s.status === 'pending').map((s) => ({ from: s.from.name, to: s.to.name, amount: s.amount })),
                        totalSpent: MOCK_SETTLEMENTS.reduce((sum, s) => sum + s.amount, 0),
                        exportDate: new Date(),
                    };
                    exportAsText(data);
                }}>
                    Export .txt
                </Button>
                <Button variant="outline" fullWidth leftIcon={<Share2 size={16} />} onClick={() => {
                    const data = {
                        groupName: 'Goa Trip',
                        tripName: 'Goa_Trip_2025',
                        members: GRAPH_MEMBERS.map((m) => ({ name: m })),
                        transactions: [],
                        settlements: MOCK_SETTLEMENTS.filter((s) => s.status === 'pending').map((s) => ({ from: s.from.name, to: s.to.name, amount: s.amount })),
                        totalSpent: MOCK_SETTLEMENTS.reduce((sum, s) => sum + s.amount, 0),
                        exportDate: new Date(),
                    };
                    shareSettlement(data);
                }}>
                    Share
                </Button>
            </div>
        </div>
    );
}
