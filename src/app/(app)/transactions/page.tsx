'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ArrowUpDown, ScanLine, Inbox, Trash2, Pencil, Check, X, Clock, List, ChevronRight, Users, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { CategoryIcon, PaymentIcon, CATEGORY_ICONS, PAYMENT_ICONS } from '@/components/ui/Icons';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

/* ── Glassmorphic styles ── */
const glass: React.CSSProperties = {
    background: 'var(--bg-glass)',
    backdropFilter: 'blur(24px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-card)',
    position: 'relative',
    overflow: 'hidden',
};

interface TransactionData {
    id: string;
    title: string;
    category: string;
    amount: number;
    method: string;
    createdAt: string;
    payer: { id: string; name: string | null };
    splits: { userId: string; amount: number; user: { id: string; name: string | null } }[];
}

type SortKey = 'time' | 'amount';

export default function TransactionsPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<TransactionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortKey>('time');
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

    const startEdit = (txn: TransactionData) => {
        setEditingId(txn.id);
        setEditTitle(txn.title);
        setEditAmount(String(txn.amount / 100));
    };

    const saveEdit = async (txnId: string) => {
        if (!editTitle.trim() || !parseFloat(editAmount)) return;
        setSavingEdit(true);
        try {
            const res = await fetch(`/api/transactions/${txnId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editTitle.trim(),
                    amount: Math.round(parseFloat(editAmount) * 100),
                }),
            });
            if (res.ok) {
                toast('Transaction updated!', 'success');
                setEditingId(null);
                fetchTransactions();
            } else toast('Failed to update', 'error');
        } catch { toast('Network error', 'error'); }
        finally { setSavingEdit(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this expense?')) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setTransactions(prev => prev.filter(t => t.id !== id));
                toast('Expense deleted', 'success');
            } else {
                toast('Failed to delete expense', 'error');
            }
        } catch {
            toast('Network error', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const fetchTransactions = useCallback(async () => {
        try {
            const res = await fetch('/api/transactions?limit=50');
            if (res.ok) {
                const data = await res.json();
                setTransactions(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    let filtered = transactions;
    if (search) {
        filtered = filtered.filter((t) =>
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            (t.payer.name || '').toLowerCase().includes(search.toLowerCase())
        );
    }
    if (filterCategory) {
        filtered = filtered.filter((t) => t.category === filterCategory);
    }
    if (sortBy === 'amount') {
        filtered = [...filtered].sort((a, b) => b.amount - a.amount);
    }

    const totalSpent = filtered.reduce((sum, t) => sum + t.amount, 0);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-4) 0' }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                        ...glass, padding: 'var(--space-4)',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        animationDelay: `${i * 150}ms`,
                    }}>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-xl)', background: 'rgba(var(--accent-500-rgb), 0.06)' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ width: '55%', height: 12, borderRadius: 8, background: 'rgba(var(--accent-500-rgb), 0.08)', marginBottom: 6 }} />
                                <div style={{ width: '35%', height: 10, borderRadius: 6, background: 'rgba(var(--accent-500-rgb), 0.05)' }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

            {/* ═══ SUMMARY HERO — Glassmorphic Stats Card ═══ */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.05 }}
            >
                <div style={{
                    ...glass, borderRadius: 'var(--radius-2xl)', padding: 'var(--space-5)',
                    background: 'linear-gradient(135deg, rgba(var(--accent-500-rgb), 0.08), var(--bg-glass), rgba(var(--accent-500-rgb), 0.04))',
                    boxShadow: 'var(--shadow-card), 0 0 30px rgba(var(--accent-500-rgb), 0.06)',
                }}>
                    {/* Top light edge */}
                    <div style={{
                        position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
                        background: 'linear-gradient(90deg, transparent, rgba(var(--accent-500-rgb), 0.15), transparent)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Total Spent
                        </div>
                        <div style={{
                            fontSize: 'var(--text-2xl)', fontWeight: 800,
                            background: 'linear-gradient(135deg, var(--accent-400), var(--accent-600))',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>
                            {formatCurrency(totalSpent)}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-muted)', marginTop: 4 }}>
                            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Quick Action Row */}
                    <div style={{
                        display: 'flex', gap: 'var(--space-2)', justifyContent: 'center',
                        marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)',
                        borderTop: '1px solid rgba(var(--accent-500-rgb), 0.06)',
                    }}>
                        <button
                            onClick={() => router.push('/transactions/scan')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px', borderRadius: 'var(--radius-full)',
                                background: 'rgba(var(--accent-500-rgb), 0.06)',
                                border: '1px solid rgba(var(--accent-500-rgb), 0.1)',
                                color: 'var(--fg-secondary)', fontSize: 'var(--text-xs)', fontWeight: 600,
                                cursor: 'pointer', transition: 'all 0.2s',
                            }}
                        >
                            <ScanLine size={13} /> Scan
                        </button>
                        <button
                            onClick={() => router.push('/transactions/new')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px', borderRadius: 'var(--radius-full)',
                                background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
                                border: 'none', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 700,
                                cursor: 'pointer', boxShadow: '0 4px 16px rgba(var(--accent-500-rgb), 0.3)',
                                transition: 'all 0.2s',
                            }}
                        >
                            <Plus size={13} /> Add Expense
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* ═══ SEARCH + CONTROLS ═══ */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 }}
            >
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                        ...glass, borderRadius: 'var(--radius-xl)', padding: '0 var(--space-3)',
                        height: 42,
                    }}>
                        <Search size={15} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
                        <input
                            placeholder="Search expenses..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                flex: 1, background: 'none', border: 'none', outline: 'none',
                                fontSize: 'var(--text-sm)', color: 'var(--fg-primary)',
                            }}
                        />
                    </div>
                    <button
                        onClick={() => setSortBy(sortBy === 'time' ? 'amount' : 'time')}
                        title={`Sort by ${sortBy === 'time' ? 'amount' : 'time'}`}
                        style={{
                            width: 42, height: 42, borderRadius: 'var(--radius-xl)',
                            ...glass, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: sortBy === 'amount' ? 'var(--accent-400)' : 'var(--fg-tertiary)',
                            transition: 'all 0.2s',
                        }}
                    >
                        <ArrowUpDown size={15} />
                    </button>
                    <button
                        onClick={() => setViewMode(viewMode === 'list' ? 'timeline' : 'list')}
                        title={`Switch to ${viewMode === 'list' ? 'timeline' : 'list'} view`}
                        style={{
                            width: 42, height: 42, borderRadius: 'var(--radius-xl)',
                            ...glass, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: viewMode === 'timeline' ? 'var(--accent-400)' : 'var(--fg-tertiary)',
                            transition: 'all 0.2s',
                        }}
                    >
                        {viewMode === 'list' ? <Clock size={15} /> : <List size={15} />}
                    </button>
                </div>
            </motion.div>

            {/* ═══ CATEGORY FILTER PILLS ═══ */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.12 }}
            >
                <div style={{
                    display: 'flex', gap: 6, overflowX: 'auto',
                    scrollbarWidth: 'none', paddingBottom: 2,
                }}>
                    <FilterPill
                        active={!filterCategory}
                        onClick={() => setFilterCategory(null)}
                    >
                        All
                    </FilterPill>
                    {Object.entries(CATEGORY_ICONS).slice(0, 6).map(([key, val]) => (
                        <FilterPill
                            key={key}
                            active={filterCategory === key}
                            onClick={() => setFilterCategory(filterCategory === key ? null : key)}
                        >
                            <CategoryIcon category={key} size={13} /> {val.label}
                        </FilterPill>
                    ))}
                </div>
            </motion.div>

            {/* ═══ TRANSACTION LIST — Premium Cards ═══ */}
            {viewMode === 'list' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <AnimatePresence mode="popLayout">
                        {filtered.map((txn, i) => {
                            const catConfig = CATEGORY_ICONS[txn.category] || CATEGORY_ICONS.general;
                            const metConfig = PAYMENT_ICONS[txn.method] || PAYMENT_ICONS.cash;
                            const payerName = txn.payer.name || 'Unknown';
                            return (
                                <motion.div
                                    key={txn.id}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                                >
                                    <div style={{
                                        ...glass,
                                        borderRadius: 'var(--radius-xl)',
                                        padding: 'var(--space-3) var(--space-4)',
                                        cursor: editingId === txn.id ? 'default' : 'pointer',
                                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                    }}
                                        onMouseEnter={(e) => {
                                            if (editingId !== txn.id) {
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                e.currentTarget.style.boxShadow = 'var(--shadow-card-hover), 0 0 20px rgba(var(--accent-500-rgb), 0.04)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '';
                                        }}
                                    >
                                        {editingId === txn.id ? (
                                            /* Inline edit mode */
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                                                    style={{ background: 'var(--surface-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '10px 14px', color: 'var(--fg-primary)', fontSize: 'var(--text-sm)', outline: 'none', width: '100%' }}
                                                    placeholder="Title" />
                                                <input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} type="number" step="0.01"
                                                    style={{ background: 'var(--surface-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '10px 14px', color: 'var(--fg-primary)', fontSize: 'var(--text-sm)', outline: 'none', width: '100%' }}
                                                    placeholder="Amount (₹)" />
                                                <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => setEditingId(null)} style={{ padding: '7px 14px', borderRadius: 'var(--radius-full)', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--fg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', fontWeight: 600 }}>
                                                        <X size={13} /> Cancel
                                                    </button>
                                                    <button onClick={() => saveEdit(txn.id)} disabled={savingEdit} style={{ padding: '7px 14px', borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', fontWeight: 600, opacity: savingEdit ? 0.6 : 1 }}>
                                                        <Check size={13} /> Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                                {/* Category icon with gradient bg */}
                                                <div style={{
                                                    width: 44, height: 44, borderRadius: 'var(--radius-xl)',
                                                    background: `linear-gradient(135deg, ${catConfig.color}15, ${catConfig.color}08)`,
                                                    border: `1px solid ${catConfig.color}12`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0, color: catConfig.color,
                                                }}>
                                                    <CategoryIcon category={txn.category} size={20} />
                                                </div>
                                                {/* Details */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        fontSize: 'var(--text-sm)', fontWeight: 700,
                                                        color: 'var(--fg-primary)',
                                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        lineHeight: 1.3,
                                                    }}>
                                                        {txn.title}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '11px', color: 'var(--fg-tertiary)',
                                                        display: 'flex', gap: 6, alignItems: 'center', marginTop: 3,
                                                        flexWrap: 'wrap',
                                                    }}>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                            <Users size={10} style={{ opacity: 0.6 }} />
                                                            {payerName.split(' ')[0]}
                                                        </span>
                                                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--fg-muted)', opacity: 0.4 }} />
                                                        <span>{timeAgo(txn.createdAt)}</span>
                                                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--fg-muted)', opacity: 0.4 }} />
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                            <PaymentIcon method={txn.method} size={10} /> {metConfig.label}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* Amount + actions */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexShrink: 0 }}>
                                                    <div style={{ textAlign: 'right', marginRight: 4 }}>
                                                        <div style={{
                                                            fontWeight: 800, fontSize: 'var(--text-sm)',
                                                            background: 'linear-gradient(135deg, var(--accent-400), var(--accent-600))',
                                                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                                                            lineHeight: 1.3,
                                                        }}>
                                                            {formatCurrency(txn.amount)}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '10px', color: 'var(--fg-muted)',
                                                            display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end',
                                                        }}>
                                                            <Users size={9} /> ÷{txn.splits?.length || 1}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); startEdit(txn); }}
                                                            style={{
                                                                border: 'none', background: 'none', cursor: 'pointer',
                                                                color: 'var(--fg-muted)', padding: 4, borderRadius: 'var(--radius-md)',
                                                                opacity: 0.4, transition: 'all 0.2s', lineHeight: 0,
                                                            }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--accent-400)'; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--fg-muted)'; }}
                                                            title="Edit"
                                                        >
                                                            <Pencil size={12} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(txn.id); }}
                                                            disabled={deletingId === txn.id}
                                                            style={{
                                                                border: 'none', background: 'none', cursor: 'pointer',
                                                                color: 'var(--fg-muted)', padding: 4, borderRadius: 'var(--radius-md)',
                                                                opacity: deletingId === txn.id ? 0.2 : 0.4, transition: 'all 0.2s', lineHeight: 0,
                                                            }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--color-error)'; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--fg-muted)'; }}
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                /* ═══ TIMELINE VIEW — Vertical timeline with day headers ═══ */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {(() => {
                        // Group by day
                        const grouped: Record<string, TransactionData[]> = {};
                        filtered.forEach(txn => {
                            const day = new Date(txn.createdAt).toLocaleDateString('en-IN', {
                                weekday: 'short', day: 'numeric', month: 'short'
                            });
                            if (!grouped[day]) grouped[day] = [];
                            grouped[day].push(txn);
                        });

                        let itemIdx = 0;
                        return Object.entries(grouped).map(([day, txns]) => (
                            <div key={day}>
                                {/* Date header */}
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    style={{
                                        fontSize: 'var(--text-xs)', fontWeight: 700,
                                        color: 'var(--accent-400)',
                                        padding: 'var(--space-3) 0 var(--space-1) var(--space-6)',
                                        textTransform: 'uppercase', letterSpacing: '0.05em',
                                    }}
                                >
                                    {day}
                                </motion.div>
                                {txns.map(txn => {
                                    const catConfig = CATEGORY_ICONS[txn.category] || CATEGORY_ICONS.general;
                                    const idx = itemIdx++;
                                    return (
                                        <motion.div
                                            key={txn.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: Math.min(idx * 0.04, 0.5), duration: 0.35 }}
                                            style={{
                                                display: 'flex', gap: 'var(--space-3)',
                                                padding: 'var(--space-1) 0',
                                            }}
                                        >
                                            {/* Timeline bar */}
                                            <div style={{
                                                display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', width: 20, flexShrink: 0,
                                            }}>
                                                <div style={{
                                                    width: 10, height: 10, borderRadius: '50%',
                                                    background: `linear-gradient(135deg, var(--accent-400), var(--accent-600))`,
                                                    border: '2px solid var(--bg-primary)',
                                                    boxShadow: '0 0 8px rgba(var(--accent-500-rgb), 0.3)',
                                                    flexShrink: 0,
                                                }} />
                                                <div style={{
                                                    width: 2, flex: 1, minHeight: 24,
                                                    background: 'linear-gradient(to bottom, rgba(var(--accent-500-rgb), 0.2), rgba(var(--accent-500-rgb), 0.05))',
                                                }} />
                                            </div>
                                            {/* Card */}
                                            <div style={{
                                                ...glass, flex: 1,
                                                padding: 'var(--space-3)',
                                                marginBottom: 'var(--space-2)',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: 'var(--radius-lg)',
                                                        background: `${catConfig.color}11`,
                                                        border: `1px solid ${catConfig.color}10`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}>
                                                        <CategoryIcon category={txn.category} size={14} />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            fontWeight: 700, fontSize: 'var(--text-sm)',
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        }}>
                                                            {txn.title}
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: 'var(--fg-tertiary)', marginTop: 1 }}>
                                                            {(txn.payer.name || 'Unknown').split(' ')[0]} · {new Date(txn.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <span style={{
                                                        fontWeight: 800, fontSize: 'var(--text-sm)',
                                                        background: 'linear-gradient(135deg, var(--accent-400), var(--accent-500))',
                                                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                                                        fontFeatureSettings: "'tnum'",
                                                    }}>
                                                        {formatCurrency(txn.amount)}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ));
                    })()}
                </div>
            )}

            {/* ═══ EMPTY STATE — Glassmorphic ═══ */}
            {filtered.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div style={{
                        ...glass, borderRadius: 'var(--radius-2xl)',
                        padding: 'var(--space-10) var(--space-4)',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, rgba(var(--accent-500-rgb), 0.04), var(--bg-glass))',
                    }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{
                                width: 60, height: 60, borderRadius: 'var(--radius-2xl)',
                                background: 'rgba(var(--accent-500-rgb), 0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto var(--space-3)', color: 'var(--accent-400)',
                            }}>
                                <Inbox size={28} />
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--fg-primary)', marginBottom: 4, fontSize: 'var(--text-base)' }}>
                                No transactions found
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', maxWidth: 240, margin: '0 auto' }}>
                                {search || filterCategory ? 'Try adjusting your search or filters' : 'Add your first expense to get started'}
                            </div>
                            {!search && !filterCategory && (
                                <Button
                                    size="sm"
                                    leftIcon={<Plus size={14} />}
                                    onClick={() => router.push('/transactions/new')}
                                    style={{
                                        marginTop: 'var(--space-4)',
                                        background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
                                        boxShadow: '0 4px 20px rgba(var(--accent-500-rgb), 0.3)',
                                    }}
                                >
                                    Add Expense
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

/* ── Filter Pill Sub-component ── */
function FilterPill({ active, onClick, children }: {
    active: boolean; onClick: () => void; children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 13px', borderRadius: 'var(--radius-full)',
                border: `1.5px solid ${active ? 'var(--accent-500)' : 'var(--border-glass)'}`,
                background: active ? 'rgba(var(--accent-500-rgb), 0.12)' : 'var(--bg-glass)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: active ? 'var(--accent-400)' : 'var(--fg-secondary)',
                fontSize: 'var(--text-xs)', fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'all 0.2s',
                boxShadow: active ? '0 0 12px rgba(var(--accent-500-rgb), 0.12)' : 'none',
            }}
        >
            {children}
        </button>
    );
}
