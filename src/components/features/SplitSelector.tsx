'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Equal, Percent, PenLine, Users } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { formatCurrency, cn } from '@/lib/utils';

export type SplitMode = 'equal' | 'percentage' | 'custom';

interface SplitMember {
    id: string;
    name: string;
    included: boolean;
    value: number; // percentage (0-100) or custom paise amount
}

interface SplitSelectorProps {
    totalAmount: number; // in paise
    members: { id: string; name: string }[];
    onChange?: (splits: { memberId: string; amount: number }[]) => void;
}

export default function SplitSelector({ totalAmount, members, onChange }: SplitSelectorProps) {
    const [mode, setMode] = useState<SplitMode>('equal');
    const [splitMembers, setSplitMembers] = useState<SplitMember[]>(
        members.map((m) => ({ ...m, included: true, value: 0 }))
    );

    const includedCount = splitMembers.filter((m) => m.included).length;
    const equalShare = includedCount > 0 ? Math.round(totalAmount / includedCount) : 0;

    const toggleMember = (id: string) => {
        setSplitMembers((prev) =>
            prev.map((m) => (m.id === id ? { ...m, included: !m.included } : m))
        );
    };

    const updateValue = (id: string, value: number) => {
        setSplitMembers((prev) =>
            prev.map((m) => (m.id === id ? { ...m, value } : m))
        );
    };

    const totalPercentage = splitMembers
        .filter((m) => m.included)
        .reduce((sum, m) => sum + m.value, 0);

    const totalCustom = splitMembers
        .filter((m) => m.included)
        .reduce((sum, m) => sum + m.value, 0);

    const modes: { key: SplitMode; label: string; icon: React.ReactNode }[] = [
        { key: 'equal', label: 'Equal', icon: <Equal size={14} /> },
        { key: 'percentage', label: '%', icon: <Percent size={14} /> },
        { key: 'custom', label: 'Custom', icon: <PenLine size={14} /> },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {/* Mode tabs */}
            <div style={{
                display: 'flex',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-lg)',
                padding: 2,
            }}>
                {modes.map((m) => (
                    <button
                        key={m.key}
                        onClick={() => setMode(m.key)}
                        style={{
                            flex: 1,
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            background: mode === m.key ? 'var(--surface-card)' : 'transparent',
                            color: mode === m.key ? 'var(--accent-500)' : 'var(--fg-tertiary)',
                            boxShadow: mode === m.key ? 'var(--shadow-sm)' : 'none',
                            transition: 'all 0.2s',
                        }}
                    >
                        {m.icon} {m.label}
                    </button>
                ))}
            </div>

            {/* Members list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {splitMembers.map((member, i) => (
                    <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            padding: 'var(--space-2) var(--space-3)',
                            background: member.included ? 'var(--surface-card)' : 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-lg)',
                            border: `1px solid ${member.included ? 'var(--border-default)' : 'transparent'}`,
                            opacity: member.included ? 1 : 0.5,
                            transition: 'all 0.2s',
                        }}
                    >
                        {/* Toggle inclusion */}
                        <button
                            onClick={() => toggleMember(member.id)}
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: 'var(--radius-sm)',
                                border: `2px solid ${member.included ? 'var(--accent-500)' : 'var(--border-default)'}`,
                                background: member.included ? 'var(--accent-500)' : 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.2s',
                            }}
                        >
                            {member.included && (
                                <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth={2} strokeLinecap="round" />
                                </svg>
                            )}
                        </button>

                        <Avatar name={member.name} size="xs" />
                        <span style={{
                            flex: 1,
                            fontSize: 'var(--text-sm)',
                            fontWeight: 500,
                            color: 'var(--fg-primary)',
                        }}>
                            {member.name}
                        </span>

                        {/* Value display / input */}
                        {member.included && (
                            <AnimatePresence mode="wait">
                                {mode === 'equal' && (
                                    <motion.span
                                        key="equal"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{
                                            fontSize: 'var(--text-sm)',
                                            fontWeight: 600,
                                            color: 'var(--accent-500)',
                                        }}
                                    >
                                        {formatCurrency(equalShare)}
                                    </motion.span>
                                )}

                                {mode === 'percentage' && (
                                    <motion.div
                                        key="pct"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={member.value || ''}
                                            onChange={(e) => updateValue(member.id, Number(e.target.value))}
                                            placeholder="0"
                                            style={{
                                                width: 50,
                                                padding: '4px 6px',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-default)',
                                                background: 'var(--surface-input)',
                                                color: 'var(--fg-primary)',
                                                fontSize: 'var(--text-sm)',
                                                textAlign: 'right',
                                            }}
                                        />
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>%</span>
                                        <span style={{
                                            fontSize: 'var(--text-xs)',
                                            color: 'var(--fg-muted)',
                                            minWidth: 60,
                                            textAlign: 'right',
                                        }}>
                                            {formatCurrency(Math.round(totalAmount * (member.value / 100)))}
                                        </span>
                                    </motion.div>
                                )}

                                {mode === 'custom' && (
                                    <motion.div
                                        key="custom"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-tertiary)' }}>₹</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={member.value ? member.value / 100 : ''}
                                            onChange={(e) => updateValue(member.id, Math.round(Number(e.target.value) * 100))}
                                            placeholder="0"
                                            style={{
                                                width: 70,
                                                padding: '4px 6px',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-default)',
                                                background: 'var(--surface-input)',
                                                color: 'var(--fg-primary)',
                                                fontSize: 'var(--text-sm)',
                                                textAlign: 'right',
                                            }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Summary / validation */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--text-xs)',
                color: 'var(--fg-tertiary)',
                padding: '0 var(--space-2)',
            }}>
                <span>
                    <Users size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {includedCount}/{members.length} members
                </span>
                {mode === 'percentage' && (
                    <span style={{
                        color: totalPercentage === 100 ? 'var(--color-success)' : 'var(--color-error)',
                        fontWeight: 600,
                    }}>
                        {totalPercentage}% / 100%
                    </span>
                )}
                {mode === 'custom' && (
                    <span style={{
                        color: totalCustom === totalAmount ? 'var(--color-success)' : 'var(--color-error)',
                        fontWeight: 600,
                    }}>
                        {formatCurrency(totalCustom)} / {formatCurrency(totalAmount)}
                    </span>
                )}
                {mode === 'equal' && (
                    <span>{formatCurrency(equalShare)} each</span>
                )}
            </div>
        </div>
    );
}
