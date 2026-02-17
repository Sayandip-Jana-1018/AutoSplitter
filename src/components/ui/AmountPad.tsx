'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Check, X } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

interface AmountPadProps {
    open: boolean;
    initialAmount?: number; // in rupees (not paise)
    onConfirm: (amountInPaise: number) => void;
    onClose: () => void;
}

const KEYS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'del'],
];

export default function AmountPad({ open, initialAmount = 0, onConfirm, onClose }: AmountPadProps) {
    const [value, setValue] = useState(initialAmount > 0 ? String(initialAmount) : '');
    const haptics = useHaptics();

    const handleKey = useCallback((key: string) => {
        haptics.light();
        setValue(prev => {
            if (key === 'del') return prev.slice(0, -1);
            if (key === '.' && prev.includes('.')) return prev;
            if (key === '.' && prev === '') return '0.';
            // Limit to 2 decimal places
            const decIndex = prev.indexOf('.');
            if (decIndex !== -1 && prev.length - decIndex > 2) return prev;
            // Max 7 digits before decimal
            if (decIndex === -1 && prev.replace('.', '').length >= 7 && key !== '.') return prev;
            return prev + key;
        });
    }, [haptics]);

    const handleConfirm = useCallback(() => {
        haptics.medium();
        const numericValue = parseFloat(value || '0');
        if (numericValue <= 0) return;
        onConfirm(Math.round(numericValue * 100)); // convert to paise
    }, [value, haptics, onConfirm]);

    const displayAmount = value || '0';
    const numericDisplay = parseFloat(displayAmount) || 0;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9000,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '100%', maxWidth: 420,
                            background: 'var(--bg-primary)',
                            borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
                            padding: 'var(--space-4)',
                            paddingBottom: 'calc(env(safe-area-inset-bottom, 8px) + var(--space-4))',
                            boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
                        }}
                    >
                        {/* Handle bar */}
                        <div style={{
                            width: 36, height: 4, borderRadius: 2,
                            background: 'var(--fg-muted)', margin: '0 auto var(--space-4)',
                            opacity: 0.3,
                        }} />

                        {/* Amount display */}
                        <div style={{
                            textAlign: 'center', padding: 'var(--space-4) 0',
                            marginBottom: 'var(--space-3)',
                        }}>
                            <div style={{
                                fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)',
                                fontWeight: 600, marginBottom: 8,
                            }}>
                                Enter Amount
                            </div>
                            <div style={{
                                fontSize: numericDisplay > 99999 ? 32 : 42,
                                fontWeight: 800,
                                fontFamily: 'var(--font-mono, monospace)',
                                background: numericDisplay > 0
                                    ? 'linear-gradient(135deg, var(--accent-400), var(--accent-500))'
                                    : 'var(--fg-muted)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                transition: 'all 0.15s',
                                letterSpacing: '-1px',
                            }}>
                                ₹{displayAmount || '0'}
                            </div>
                        </div>

                        {/* Number pad */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 8, marginBottom: 'var(--space-3)',
                        }}>
                            {KEYS.flat().map((key) => (
                                <motion.button
                                    key={key}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleKey(key)}
                                    style={{
                                        height: 56, borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border-default)',
                                        background: key === 'del'
                                            ? 'rgba(239, 68, 68, 0.08)'
                                            : 'var(--bg-glass)',
                                        backdropFilter: 'blur(8px)',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: key === 'del' ? 0 : 'var(--text-lg)',
                                        fontWeight: 700, color: 'var(--fg-primary)',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {key === 'del' ? <Delete size={20} style={{ color: '#ef4444' }} /> : key}
                                </motion.button>
                            ))}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                style={{
                                    height: 48, borderRadius: 'var(--radius-xl)',
                                    border: '1px solid var(--border-default)',
                                    background: 'var(--bg-glass)',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 6, fontSize: 'var(--text-sm)', fontWeight: 600,
                                    color: 'var(--fg-secondary)',
                                }}
                            >
                                <X size={16} /> Cancel
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleConfirm}
                                style={{
                                    height: 48, borderRadius: 'var(--radius-xl)',
                                    border: 'none',
                                    background: numericDisplay > 0
                                        ? 'linear-gradient(135deg, var(--accent-500), var(--accent-600))'
                                        : 'var(--bg-glass)',
                                    cursor: numericDisplay > 0 ? 'pointer' : 'not-allowed',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 6, fontSize: 'var(--text-sm)', fontWeight: 700,
                                    color: numericDisplay > 0 ? 'white' : 'var(--fg-muted)',
                                    boxShadow: numericDisplay > 0
                                        ? '0 4px 16px rgba(var(--accent-500-rgb), 0.3)'
                                        : 'none',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <Check size={16} /> Confirm
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
