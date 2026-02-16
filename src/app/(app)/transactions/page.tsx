'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, ArrowUpDown, ScanLine } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { CategoryIcon, PaymentIcon, CATEGORY_ICONS, PAYMENT_ICONS } from '@/components/ui/Icons';
import { formatCurrency, timeAgo, cn } from '@/lib/utils';

const MOCK_TRANSACTIONS = [
    { id: '1', title: 'Pizza at Dominos', category: 'food', amount: 129000, payer: 'Sayan Das', time: new Date(Date.now() - 3600000), method: 'gpay', split: 4 },
    { id: '2', title: 'Uber to Airport', category: 'transport', amount: 85000, payer: 'Aman Singh', time: new Date(Date.now() - 7200000), method: 'cash', split: 3 },
    { id: '3', title: 'Hotel Booking', category: 'stay', amount: 450000, payer: 'Priya Gupta', time: new Date(Date.now() - 86400000), method: 'phonepe', split: 4 },
    { id: '4', title: 'Movie Night', category: 'entertainment', amount: 60000, payer: 'Rahul Verma', time: new Date(Date.now() - 172800000), method: 'gpay', split: 4 },
    { id: '5', title: 'Fuel Station', category: 'fuel', amount: 250000, payer: 'Sayan Das', time: new Date(Date.now() - 259200000), method: 'card', split: 4 },
    { id: '6', title: 'Grocery Run', category: 'shopping', amount: 180000, payer: 'Tanisha Roy', time: new Date(Date.now() - 345600000), method: 'paytm', split: 3 },
];

type SortKey = 'time' | 'amount';

export default function TransactionsPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortKey>('time');
    const [filterCategory, setFilterCategory] = useState<string | null>(null);

    let filtered = MOCK_TRANSACTIONS;

    if (search) {
        filtered = filtered.filter((t) =>
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.payer.toLowerCase().includes(search.toLowerCase())
        );
    }

    if (filterCategory) {
        filtered = filtered.filter((t) => t.category === filterCategory);
    }

    if (sortBy === 'amount') {
        filtered = [...filtered].sort((a, b) => b.amount - a.amount);
    }

    const totalSpent = filtered.reduce((sum, t) => sum + t.amount, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <div>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Transactions</h2>
                    <p style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)' }}>
                        Total: {formatCurrency(totalSpent)} · {filtered.length} items
                    </p>
                </div>
                <Button size="sm" variant="outline" leftIcon={<ScanLine size={14} />} onClick={() => router.push('/transactions/scan')}>
                    Scan
                </Button>
                <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => router.push('/transactions/new')}>
                    Add
                </Button>
            </div>

            {/* Search + Filters */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    background: 'var(--surface-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0 var(--space-3)',
                    height: 40,
                }}>
                    <Search size={16} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
                    <input
                        placeholder="Search expenses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            flex: 1,
                            background: 'none',
                            border: 'none',
                            outline: 'none',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--fg-primary)',
                        }}
                    />
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    onClick={() => setSortBy(sortBy === 'time' ? 'amount' : 'time')}
                >
                    <ArrowUpDown size={16} />
                </Button>
            </div>

            {/* Category filters (scrollable) */}
            <div style={{
                display: 'flex',
                gap: 'var(--space-2)',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                paddingBottom: 2,
            }}>
                <button
                    onClick={() => setFilterCategory(null)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        border: `1.5px solid ${!filterCategory ? 'var(--accent-500)' : 'var(--border-default)'}`,
                        background: !filterCategory ? 'rgba(var(--accent-500-rgb), 0.1)' : 'var(--surface-input)',
                        color: !filterCategory ? 'var(--accent-500)' : 'var(--fg-secondary)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                    }}
                >
                    All
                </button>
                {Object.entries(CATEGORY_ICONS).slice(0, 6).map(([key, val]) => (
                    <button
                        key={key}
                        onClick={() => setFilterCategory(filterCategory === key ? null : key)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-full)',
                            border: `1.5px solid ${filterCategory === key ? 'var(--accent-500)' : 'var(--border-default)'}`,
                            background: filterCategory === key ? 'rgba(var(--accent-500-rgb), 0.1)' : 'var(--surface-input)',
                            color: filterCategory === key ? 'var(--accent-500)' : 'var(--fg-secondary)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <CategoryIcon category={key} size={14} /> {val.label}
                    </button>
                ))}
            </div>

            {/* Transaction List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <AnimatePresence mode="popLayout">
                    {filtered.map((txn, i) => {
                        const catConfig = CATEGORY_ICONS[txn.category] || CATEGORY_ICONS.general;
                        const metConfig = PAYMENT_ICONS[txn.method] || PAYMENT_ICONS.cash;
                        return (
                            <motion.div
                                key={txn.id}
                                layout
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2, delay: i * 0.04 }}
                            >
                                <Card interactive padding="compact">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                        <span style={{
                                            width: 40,
                                            height: 40,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: `${catConfig.color}15`,
                                            borderRadius: 'var(--radius-lg)',
                                            flexShrink: 0,
                                            color: catConfig.color,
                                        }}>
                                            <CategoryIcon category={txn.category} size={20} />
                                        </span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: 'var(--text-sm)',
                                                fontWeight: 500,
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
                                                gap: 'var(--space-2)',
                                                alignItems: 'center',
                                            }}>
                                                <span>{txn.payer.split(' ')[0]}</span>
                                                <span>·</span>
                                                <span>{timeAgo(txn.time)}</span>
                                                <span>·</span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><PaymentIcon method={txn.method} size={14} /> {metConfig.label}</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{
                                                fontWeight: 600,
                                                fontSize: 'var(--text-sm)',
                                                color: 'var(--fg-primary)',
                                            }}>
                                                {formatCurrency(txn.amount)}
                                            </div>
                                            <span style={{
                                                fontSize: 'var(--text-xs)',
                                                color: 'var(--fg-tertiary)',
                                            }}>
                                                ÷{txn.split}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: 'var(--space-8)',
                    color: 'var(--fg-tertiary)',
                }}>
                    <p style={{ fontSize: 48, marginBottom: 'var(--space-2)' }}>🔍</p>
                    <p style={{ fontWeight: 500 }}>No transactions found</p>
                    <p style={{ fontSize: 'var(--text-sm)' }}>Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
}
