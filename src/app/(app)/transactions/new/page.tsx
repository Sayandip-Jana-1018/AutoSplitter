'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Delete, Check, ChevronDown, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { PaymentIcon } from '@/components/ui/Icons';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { CATEGORIES, PAYMENT_METHODS, formatCurrency, toPaise, cn, getCategoryData } from '@/lib/utils';

import styles from './quickadd.module.css';

interface GroupItem {
    id: string;
    name: string;
    emoji: string;
    members: { user: { id: string; name: string | null; image: string | null } }[];
}

function QuickAddContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { user: currentUser, loading: userLoading } = useCurrentUser();

    // Data state
    const [groups, setGroups] = useState<GroupItem[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [activeTripId, setActiveTripId] = useState<string>('');
    const [members, setMembers] = useState<{ id: string; name: string; image?: string | null }[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(true);

    // Form state
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('general');
    const [method, setMethod] = useState('cash');
    const [payerId, setPayerId] = useState('');
    const [showCategories, setShowCategories] = useState(false);
    const [showPayers, setShowPayers] = useState(false);
    const [showMethods, setShowMethods] = useState(false);
    const [showGroups, setShowGroups] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

    // Custom Category State
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCatValue, setCustomCatValue] = useState('');

    // Custom split state
    const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
    const [customSplits, setCustomSplits] = useState<{ userId: string; amount: number }[]>([]);

    // Pre-fill from URL params (from scan page)
    useEffect(() => {
        const paramAmount = searchParams.get('amount');
        const paramTitle = searchParams.get('title');
        const paramMethod = searchParams.get('method');
        const paramSplitData = searchParams.get('splitData');
        if (paramAmount) setAmount(paramAmount);
        if (paramTitle) setTitle(paramTitle);
        if (paramMethod) setMethod(paramMethod);

        if (paramSplitData) {
            try {
                const splits = JSON.parse(paramSplitData);
                if (Array.isArray(splits) && splits.length > 0) {
                    setCustomSplits(splits);
                    setSplitType('custom');
                    // Sync selected members with the custom split
                    const memberIds = new Set(splits.map((s: { userId: string }) => s.userId));
                    setSelectedMembers(memberIds);
                }
            } catch (e) {
                console.error("Failed to parse split data", e);
            }
        }
    }, [searchParams]);

    // Fetch groups on mount
    useEffect(() => {
        async function loadGroups() {
            try {
                const res = await fetch('/api/groups');
                if (res.ok) {
                    const data = await res.json();
                    setGroups(data);
                    if (data.length > 0) {
                        setSelectedGroupId(data[0].id);
                    }
                }
            } catch {
                // handle silently
            } finally {
                setLoadingGroups(false);
            }
        }
        loadGroups();
    }, []);

    useEffect(() => {
        if (!selectedGroupId) return;
        async function loadGroupDetail() {
            try {
                const res = await fetch(`/api/groups/${selectedGroupId}`);
                if (res.ok) {
                    const data = await res.json();
                    // Get active trip — if none, auto-create one
                    if (data.activeTrip) {
                        setActiveTripId(data.activeTrip.id);
                    } else {
                        // Auto-create a default trip for this group
                        try {
                            const tripRes = await fetch('/api/trips', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    groupId: selectedGroupId,
                                    title: 'General',
                                }),
                            });
                            if (tripRes.ok) {
                                const trip = await tripRes.json();
                                setActiveTripId(trip.id);
                            }
                        } catch { /* silently fail */ }
                    }
                    // Set members from group
                    const memberList = (data.members || []).map((m: { user: { id: string; name: string | null; image?: string | null } }) => ({
                        id: m.user.id,
                        name: m.user.name || 'Unknown',
                        image: m.user.image || null,
                    }));
                    setMembers(memberList);

                    // Only default select all if NOT using custom split from URL
                    if (splitType !== 'custom') {
                        setSelectedMembers(new Set(memberList.map((m: { id: string }) => m.id)));
                    } else if (customSplits.length > 0) {
                        // If it IS custom, make sure only the people in customSplits are selected
                        setSelectedMembers(new Set(customSplits.map(s => s.userId)));
                    }

                    // Default payer to current user
                    if (currentUser && memberList.some((m: { id: string }) => m.id === currentUser.id)) {
                        setPayerId(currentUser.id);
                    } else if (memberList.length > 0) {
                        setPayerId(memberList[0].id);
                    }
                }
            } catch {
                // handle silently
            }
        }
        loadGroupDetail();
    }, [selectedGroupId, currentUser, splitType, customSplits]);

    const numericAmount = parseFloat(amount) || 0;
    const selectedCount = selectedMembers.size;
    const splitPerPerson = selectedCount > 0
        ? formatCurrency(toPaise(numericAmount / selectedCount))
        : '₹0';

    // Calculate custom amount for a member if custom split is active
    const getMemberAmount = (memberId: string) => {
        if (splitType !== 'custom') return null;
        const split = customSplits.find(s => s.userId === memberId);
        return split ? formatCurrency(split.amount) : '₹0';
    };

    const toggleMember = useCallback((memberId: string) => {
        // Compute new member set from current value (not inside updater to avoid nested setState)
        const next = new Set(selectedMembers);
        if (next.has(memberId)) {
            if (next.size <= 1) return;
            next.delete(memberId);
        } else {
            next.add(memberId);
        }

        // Set both states at the same level so React batches them together
        setSelectedMembers(next);

        if (splitType === 'custom') {
            const totalPaise = toPaise(numericAmount);
            const memberArr = Array.from(next);
            const perPerson = Math.floor(totalPaise / memberArr.length);
            const remainder = totalPaise - perPerson * memberArr.length;
            setCustomSplits(memberArr.map((id, i) => ({
                userId: id,
                amount: perPerson + (i === memberArr.length - 1 ? remainder : 0),
            })));
        }
    }, [selectedMembers, splitType, numericAmount]);

    const handleNumPad = useCallback((key: string) => {
        if (key === 'del') {
            setAmount((prev) => prev.slice(0, -1));
        } else if (key === '.') {
            if (!amount.includes('.')) {
                setAmount((prev) => (prev || '0') + '.');
            }
        } else {
            const parts = amount.split('.');
            if (parts[1] && parts[1].length >= 2) return;
            if (!parts[1] && parts[0] && parts[0].length >= 7) return;
            setAmount((prev) => {
                if (prev === '0' && key !== '.') return key;
                return prev + key;
            });
        }
        if (navigator.vibrate) navigator.vibrate(10);
    }, [amount]);

    const catData = getCategoryData(category);

    const handleSave = async () => {
        // Use category label as fallback title
        const effectiveTitle = title.trim() || catData.label;

        if (!numericAmount || numericAmount <= 0) {
            toast('Amount must be greater than zero', 'error');
            return;
        }
        if (!selectedGroupId) {
            toast('Please select a group', 'error');
            return;
        }
        // Validate custom splits sum to total
        if (splitType === 'custom') {
            const totalPaise = toPaise(numericAmount);
            const selArr = Array.from(selectedMembers);
            const allocated = customSplits
                .filter(s => selArr.includes(s.userId))
                .reduce((sum, s) => sum + s.amount, 0);
            if (allocated !== totalPaise) {
                toast(`Split amounts (${formatCurrency(allocated)}) don't match total (${formatCurrency(totalPaise)})`, 'error');
                return;
            }
        }

        // If no trip exists yet, auto-create one
        let tripId = activeTripId;
        if (!tripId) {
            try {
                const tripRes = await fetch('/api/trips', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ groupId: selectedGroupId, title: 'General' }),
                });
                if (tripRes.ok) {
                    const trip = await tripRes.json();
                    tripId = trip.id;
                    setActiveTripId(trip.id);
                } else {
                    toast('Failed to create trip for this group', 'error');
                    return;
                }
            } catch {
                toast('Network error — please try again', 'error');
                return;
            }
        }

        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                tripId,
                title: effectiveTitle,
                amount: toPaise(numericAmount),
                category,
                method,
                splitType,
                payerId, // send who actually paid
            };

            const paramReceiptUrl = searchParams.get('receiptUrl');
            if (paramReceiptUrl) {
                payload.receiptUrl = paramReceiptUrl;
            }

            if (splitType === 'custom') {
                payload.splits = customSplits;
            } else {
                payload.splitAmong = Array.from(selectedMembers);
            }

            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast(`Expense added! ${formatCurrency(toPaise(numericAmount))} for "${effectiveTitle}"`, 'success');
                router.push('/transactions');
            } else {
                const err = await res.json().catch(() => ({}));
                toast(err.error || 'Failed to add expense', 'error');
            }
        } catch {
            toast('Network error — please check your connection', 'error');
        } finally {
            setSaving(false);
        }
    };

    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    const payerMember = members.find(m => m.id === payerId);
    const payerDisplay = payerMember
        ? (payerMember.id === currentUser?.id ? `${payerMember.name} (You)` : payerMember.name)
        : 'Select';
    const methodData = PAYMENT_METHODS[method];

    if (loadingGroups || userLoading) {
        return (
            <div className={styles.quickAdd} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-500)' }} />
            </div>
        );
    }

    if (groups.length === 0) {
        return (
            <div className={styles.quickAdd} style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 'var(--space-4)' }}>
                <div style={{ fontSize: '48px' }}>📋</div>
                <h3 style={{ color: 'var(--fg-primary)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>
                    No groups yet
                </h3>
                <p style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)' }}>
                    Create a group first to start adding expenses
                </p>
                <Button onClick={() => router.push('/groups')}>Go to Groups</Button>
            </div>
        );
    }

    return (
        <div className={styles.quickAdd}>
            {/* ── Group Selector Chip ── */}
            <div className={styles.metaRow} style={{ justifyContent: 'center' }}>
                <button className={cn(styles.chip, styles.chipActive)} onClick={() => setShowGroups(true)}>
                    <span>{selectedGroup?.emoji || '📋'}</span>
                    {selectedGroup?.name || 'Select Group'}
                    <ChevronDown size={14} />
                </button>
            </div>

            {/* ── Amount Display ── */}
            <div className={styles.amountDisplay}>
                <span className={styles.currencySign}>₹</span>
                <motion.div
                    className={cn(styles.amountValue, !amount && styles.placeholder)}
                    key={amount || 'placeholder'}
                    initial={{ scale: 0.95, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                    {amount || '0'}
                </motion.div>
            </div>

            {/* ── Title ── */}
            <input
                className={styles.titleInput}
                placeholder="What was this for?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
            />

            {/* ── Meta Row: Category / Payer / Method chips ── */}
            <div className={styles.metaRow}>
                <button className={cn(styles.chip)} onClick={() => setShowCategories(true)}>
                    <span>{catData.emoji}</span>
                    {catData.label}
                    <ChevronDown size={14} />
                </button>

                <button className={cn(styles.chip)} onClick={() => setShowPayers(true)}>
                    👤 {payerDisplay.split(' ')[0]}
                    <ChevronDown size={14} />
                </button>

                <button className={cn(styles.chip)} onClick={() => setShowMethods(true)}>
                    {methodData.emoji} {methodData.label}
                    <ChevronDown size={14} />
                </button>
            </div>

            {/* ── Split Among Toggle ── */}
            {members.length > 1 && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    marginTop: 'var(--space-2)',
                    marginBottom: 'var(--space-2)',
                }}>
                    <span style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--fg-tertiary)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        textAlign: 'center',
                        opacity: 0.8
                    }}>
                        {splitType === 'custom' ? 'Split by Items (Custom)' : 'Split among'}
                    </span>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: 10, // Increased gap between pills (was 6)
                    }}>
                        {members.map((member) => {
                            const isSelected = selectedMembers.has(member.id);
                            const isPayer = member.id === payerId;
                            const customAmount = getMemberAmount(member.id);

                            return (
                                <motion.button
                                    key={member.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => toggleMember(member.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8, // Increased internal gap
                                        padding: '6px 12px 6px 6px', // More breathing room inside pill
                                        borderRadius: 'var(--radius-full)',
                                        border: isSelected
                                            ? '1.5px solid var(--accent-500)'
                                            : '1.5px solid var(--border-default)',
                                        background: isSelected
                                            ? 'rgba(var(--accent-500-rgb), 0.08)' // Slightly more visible background
                                            : 'var(--bg-surface)', // Explicit surface color
                                        cursor: 'pointer',
                                        opacity: isSelected ? 1 : 0.6,
                                        transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                        boxShadow: isSelected ? '0 2px 8px rgba(var(--accent-500-rgb), 0.15)' : 'none', // Subtle lift for selected
                                    }}
                                >
                                    <Avatar name={member.name} image={member.image} size="sm" /> {/* Bumped up to size="sm" for better visibility */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                                        <span style={{
                                            fontSize: 'var(--text-sm)', // Slightly larger text
                                            fontWeight: isSelected ? 600 : 500,
                                            textDecoration: isSelected ? 'none' : 'line-through',
                                            color: isSelected ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
                                        }}>
                                            {member.id === currentUser?.id ? 'You' : member.name.split(' ')[0]}
                                        </span>
                                        {/* Show quantity or small numeric value if custom split */}
                                        {splitType === 'custom' && isSelected && (
                                            <span style={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                color: 'var(--accent-600)',
                                                marginTop: 2
                                            }}>
                                                {customAmount}
                                            </span>
                                        )}
                                    </div>

                                    {isPayer && (
                                        <span style={{
                                            fontSize: 9,
                                            background: isSelected ? 'var(--accent-500)' : 'var(--color-error, #ef4444)',
                                            color: '#fff',
                                            padding: '2px 6px',
                                            borderRadius: 'var(--radius-full)',
                                            fontWeight: 700,
                                            letterSpacing: '0.02em',
                                            marginLeft: 2,
                                        }}>{isSelected ? 'PAID' : 'PAID ONLY'}</span>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Split Mode Toggle + Split Info ── */}
            {numericAmount > 0 && selectedCount > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'center' }}
                >
                    {/* Equal / Custom toggle */}
                    <div style={{
                        display: 'flex',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--border-default)',
                        overflow: 'hidden',
                    }}>
                        {(['equal', 'custom'] as const).map(mode => (
                            <button key={mode} onClick={() => {
                                if (mode === 'equal') { setSplitType('equal'); setCustomSplits([]); }
                                else {
                                    setSplitType('custom');
                                    // Initialize custom splits with equal amounts for selected members
                                    const selArr = Array.from(selectedMembers);
                                    const totalPaise = toPaise(numericAmount);
                                    const perPerson = Math.floor(totalPaise / selArr.length);
                                    const remainder = totalPaise - perPerson * selArr.length;
                                    setCustomSplits(selArr.map((id, i) => ({
                                        userId: id,
                                        amount: perPerson + (i === selArr.length - 1 ? remainder : 0),
                                    })));
                                }
                            }}
                                style={{
                                    padding: '6px 16px', fontSize: 'var(--text-xs)', fontWeight: 600,
                                    border: 'none', cursor: 'pointer',
                                    background: splitType === mode ? 'var(--accent-500)' : 'transparent',
                                    color: splitType === mode ? '#fff' : 'var(--fg-secondary)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {mode === 'equal' ? '÷ Equal' : '✏️ Custom'}
                            </button>
                        ))}
                    </div>

                    {splitType === 'equal' ? (
                        <div className={styles.splitInfo}>
                            Split equally: <span className={styles.splitAmount}>{splitPerPerson}</span> / person
                            ({selectedCount} of {members.length} people)
                        </div>
                    ) : (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: '0 4px' }}>
                            {/* Per-person amount inputs */}
                            {(() => {
                                const selArr = Array.from(selectedMembers);
                                const totalPaise = toPaise(numericAmount);

                                return selArr.map((memberId, idx) => {
                                    const member = members.find(m => m.id === memberId);
                                    if (!member) return null;
                                    const isLast = idx === selArr.length - 1;
                                    const split = customSplits.find(s => s.userId === memberId);
                                    const currentAmount = split?.amount || 0;

                                    // For last person: auto-calculate remaining
                                    const othersTotal = customSplits
                                        .filter(s => s.userId !== memberId && selArr.includes(s.userId))
                                        .reduce((sum, s) => sum + s.amount, 0);
                                    const autoFillAmount = isLast ? Math.max(0, totalPaise - othersTotal) : currentAmount;

                                    // If last person, auto-update their split
                                    if (isLast && split && split.amount !== autoFillAmount) {
                                        setTimeout(() => {
                                            setCustomSplits(prev => prev.map(s =>
                                                s.userId === memberId ? { ...s, amount: autoFillAmount } : s
                                            ));
                                        }, 0);
                                    }

                                    return (
                                        <div key={memberId} style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '12px 16px',
                                            background: isLast
                                                ? 'linear-gradient(135deg, rgba(var(--accent-500-rgb), 0.06), rgba(var(--accent-500-rgb), 0.02))'
                                                : 'var(--bg-surface)',
                                            borderRadius: 16,
                                            border: isLast
                                                ? '1.5px solid rgba(var(--accent-500-rgb), 0.2)'
                                                : '1px solid var(--border-subtle)',
                                            transition: 'all 0.2s ease',
                                        }}>
                                            <Avatar name={member.name} image={member.image} size="sm" />
                                            <span style={{
                                                flex: 1, fontSize: 'var(--text-sm)', fontWeight: 600,
                                                color: 'var(--fg-primary)',
                                            }}>
                                                {member.id === currentUser?.id ? 'You' : member.name.split(' ')[0]}
                                                {isLast && (
                                                    <span style={{
                                                        fontSize: 10, color: 'var(--accent-500)',
                                                        fontWeight: 500, marginLeft: 6,
                                                        opacity: 0.8,
                                                    }}>(remainder)</span>
                                                )}
                                            </span>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 2,
                                                background: isLast ? 'rgba(var(--accent-500-rgb), 0.1)' : 'var(--bg-elevated)',
                                                borderRadius: 12,
                                                padding: '6px 4px 6px 10px',
                                                border: `1px solid ${isLast ? 'var(--accent-500)' : 'var(--border-default)'}`,
                                            }}>
                                                <span style={{
                                                    fontSize: 'var(--text-sm)',
                                                    color: isLast ? 'var(--accent-500)' : 'var(--fg-tertiary)',
                                                    fontWeight: 600,
                                                }}>₹</span>
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    value={isLast ? (autoFillAmount / 100).toFixed(2) : (currentAmount / 100) || ''}
                                                    readOnly={isLast}
                                                    onChange={e => {
                                                        if (isLast) return;
                                                        const val = Math.round(parseFloat(e.target.value || '0') * 100);
                                                        setCustomSplits(prev => {
                                                            const existing = prev.find(s => s.userId === memberId);
                                                            if (existing) return prev.map(s => s.userId === memberId ? { ...s, amount: val } : s);
                                                            return [...prev, { userId: memberId, amount: val }];
                                                        });
                                                    }}
                                                    style={{
                                                        width: 72, padding: '4px 6px',
                                                        fontSize: 'var(--text-base)', fontWeight: 700,
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: isLast ? 'var(--accent-500)' : 'var(--fg-primary)',
                                                        outline: 'none',
                                                        textAlign: 'right',
                                                    }}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    );
                                });
                            })()}

                            {/* Running total bar */}
                            {(() => {
                                const totalPaise = toPaise(numericAmount);
                                const allocated = customSplits
                                    .filter(s => Array.from(selectedMembers).includes(s.userId))
                                    .reduce((sum, s) => sum + s.amount, 0);
                                const pct = totalPaise > 0 ? Math.min((allocated / totalPaise) * 100, 100) : 0;
                                const isExact = allocated === totalPaise;
                                const isOver = allocated > totalPaise;

                                return (
                                    <div style={{ width: '100%', marginTop: 4 }}>
                                        <div style={{
                                            height: 6, borderRadius: 3,
                                            background: 'var(--border-subtle)',
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${pct}%`,
                                                borderRadius: 3,
                                                background: isExact
                                                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                                    : isOver
                                                        ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                                                        : 'linear-gradient(90deg, var(--accent-400), var(--accent-600))',
                                                transition: 'width 0.3s, background 0.3s',
                                            }} />
                                        </div>
                                        <div style={{
                                            fontSize: 'var(--text-xs)', textAlign: 'center',
                                            marginTop: 6,
                                            color: isExact ? '#22c55e' : isOver ? '#ef4444' : 'var(--fg-tertiary)',
                                            fontWeight: 700,
                                            letterSpacing: '0.02em',
                                        }}>
                                            {formatCurrency(allocated)} of {formatCurrency(totalPaise)} allocated
                                            {isExact && ' ✓'}
                                            {isOver && ' ⚠ over!'}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </motion.div>
            )}

            {/* ── Numpad ── */}
            <div className={styles.numpad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'].map((key) => (
                    <motion.button
                        key={key}
                        className={cn(
                            styles.numKey,
                            key === 'del' && styles.numKeyDelete,
                        )}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleNumPad(key)}
                    >
                        {key === 'del' ? <Delete size={22} /> : key}
                    </motion.button>
                ))}
            </div>

            {/* ── Submit ── */}
            <div className={styles.submitBtn}>
                <Button
                    fullWidth
                    size="lg"
                    disabled={!numericAmount}
                    loading={saving}
                    leftIcon={<Check size={18} />}
                    onClick={handleSave}
                >
                    Add Expense · {numericAmount > 0 ? formatCurrency(toPaise(numericAmount)) : '₹0'}
                </Button>
            </div>

            {/* ── Group Picker Modal ── */}
            <Modal
                isOpen={showGroups}
                onClose={() => setShowGroups(false)}
                title="Select Group"
                size="small"
                transparentOverlay
            >
                <div className={styles.payerGrid}>
                    {groups.map((g) => (
                        <motion.button
                            key={g.id}
                            className={cn(
                                styles.payerItem,
                                selectedGroupId === g.id && styles.payerItemActive,
                            )}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { setSelectedGroupId(g.id); setShowGroups(false); }}
                        >
                            <span style={{ fontSize: 24 }}>{g.emoji}</span>
                            <span className={styles.payerName}>{g.name}</span>
                            {selectedGroupId === g.id && (
                                <Check size={16} style={{ marginLeft: 'auto', color: 'var(--accent-500)' }} />
                            )}
                        </motion.button>
                    ))}
                </div>
            </Modal>

            {/* ── Category Picker Modal ── */}
            <Modal
                isOpen={showCategories}
                onClose={() => { setShowCategories(false); setIsCustomCategory(false); }}
                title={isCustomCategory ? "Custom Category" : "Category"}
                size="small"
                transparentOverlay
            >
                {isCustomCategory ? (
                    <div style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 14, top: 12, fontSize: 18 }}>📌</span>
                            <input
                                autoFocus
                                placeholder="e.g. Flight to Goa"
                                value={customCatValue}
                                onChange={(e) => setCustomCatValue(e.target.value)}
                                style={{
                                    width: '100%', padding: '14px 16px 14px 44px', borderRadius: '14px',
                                    border: '1px solid var(--border-subtle)', background: 'var(--bg-glass)',
                                    color: 'var(--fg-primary)', fontSize: '15px', fontWeight: 500,
                                    outline: 'none', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
                                }}
                            />
                        </div>
                        <Button
                            fullWidth
                            disabled={!customCatValue.trim()}
                            onClick={() => {
                                setCategory(customCatValue.trim());
                                setShowCategories(false);
                                setIsCustomCategory(false);
                            }}
                        >
                            Save Category
                        </Button>
                        <button
                            onClick={() => { setIsCustomCategory(false); setCustomCatValue(''); }}
                            style={{ marginTop: 2, background: 'none', border: 'none', color: 'var(--fg-tertiary)', fontSize: 13, cursor: 'pointer', padding: 8, fontWeight: 500 }}
                        >
                            Back to preset categories
                        </button>
                    </div>
                ) : (
                    <div className={styles.categoryGrid}>
                        {Object.entries(CATEGORIES).map(([key, val]) => (
                            <motion.button
                                key={key}
                                className={cn(
                                    styles.categoryItem,
                                    category === key && styles.categoryItemActive,
                                    (!CATEGORIES[category] && key === 'other') && styles.categoryItemActive
                                )}
                                whileTap={{ scale: 0.93 }}
                                onClick={() => {
                                    if (key === 'other') {
                                        setIsCustomCategory(true);
                                        setCustomCatValue('');
                                    } else {
                                        setCategory(key);
                                        setShowCategories(false);
                                    }
                                }}
                            >
                                <span className={styles.categoryEmoji}>{val.emoji}</span>
                                <span className={styles.categoryLabel}>{val.label}</span>
                            </motion.button>
                        ))}
                    </div>
                )}
            </Modal>

            {/* ── Payer Picker Modal ── */}
            <Modal
                isOpen={showPayers}
                onClose={() => setShowPayers(false)}
                title="Who paid?"
                size="small"
                transparentOverlay
            >
                <div className={styles.payerGrid}>
                    {members.map((member) => (
                        <motion.button
                            key={member.id}
                            className={cn(
                                styles.payerItem,
                                payerId === member.id && styles.payerItemActive,
                            )}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { setPayerId(member.id); setShowPayers(false); }}
                        >
                            <Avatar name={member.name} image={member.image} size="sm" />
                            <span className={styles.payerName}>
                                {member.id === currentUser?.id ? `${member.name} (You)` : member.name}
                            </span>
                            {payerId === member.id && (
                                <Check size={16} style={{ marginLeft: 'auto', color: 'var(--accent-500)' }} />
                            )}
                        </motion.button>
                    ))}
                </div>
            </Modal>

            {/* ── Method Picker Modal ── */}
            <Modal
                isOpen={showMethods}
                onClose={() => setShowMethods(false)}
                title="Payment Method"
                size="small"
                transparentOverlay
            >
                <div className={styles.payerGrid}>
                    {Object.entries(PAYMENT_METHODS).map(([key, val]) => (
                        <motion.button
                            key={key}
                            className={cn(
                                styles.payerItem,
                                method === key && styles.payerItemActive,
                            )}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { setMethod(key); setShowMethods(false); }}
                        >
                            <PaymentIcon method={key} size={22} />
                            <span className={styles.payerName}>{val.label}</span>
                            {method === key && (
                                <Check size={16} style={{ marginLeft: 'auto', color: 'var(--accent-500)' }} />
                            )}
                        </motion.button>
                    ))}
                </div>
            </Modal>
        </div>
    );
}

export default function QuickAddPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={32} style={{ color: 'var(--fg-muted)' }} />
            </div>
        }>
            <QuickAddContent />
        </Suspense>
    );
}
