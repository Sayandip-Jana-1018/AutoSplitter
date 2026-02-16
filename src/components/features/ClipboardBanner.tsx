'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Clipboard, X, ArrowRight } from 'lucide-react';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';
import { PaymentIcon } from '@/components/ui/Icons';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';

/**
 * Floating banner that appears when a UPI transaction is detected on the clipboard.
 * Shows extracted amount + merchant, with "Add" and "Dismiss" actions.
 */
export default function ClipboardBanner() {
    const { detected, dismiss, accept } = useClipboardPaste();

    return (
        <AnimatePresence>
            {detected && (
                <motion.div
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    style={{
                        position: 'fixed',
                        top: 'var(--space-3)',
                        left: 'var(--space-3)',
                        right: 'var(--space-3)',
                        zIndex: 1000,
                        background: 'var(--surface-elevated)',
                        border: '1px solid var(--accent-500)',
                        borderRadius: 'var(--radius-xl)',
                        padding: 'var(--space-3) var(--space-4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <Clipboard size={18} style={{ color: 'var(--accent-500)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginBottom: 1 }}>
                            Transaction detected on clipboard
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--fg-primary)' }}>
                                {detected.amount ? formatCurrency(detected.amount) : '—'}
                            </span>
                            {detected.merchant && (
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-secondary)' }}>
                                    to {detected.merchant}
                                </span>
                            )}
                            {detected.method && <PaymentIcon method={detected.method} size={14} />}
                        </div>
                    </div>
                    <Button size="sm" onClick={() => accept()}>
                        Add <ArrowRight size={12} />
                    </Button>
                    <button
                        onClick={dismiss}
                        style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: 'var(--fg-muted)',
                            padding: 4,
                            display: 'flex',
                        }}
                    >
                        <X size={16} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
