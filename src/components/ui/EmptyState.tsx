'use client';

import { motion } from 'framer-motion';
import { Inbox, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

/**
 * Beautiful empty state component.
 * Matches the app's glassmorphic, dark-mode-first design.
 */
export default function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 'var(--space-10) var(--space-4)',
                gap: 'var(--space-3)',
                minHeight: 240,
            }}
        >
            {/* Icon circle */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(var(--accent-500-rgb), 0.12), rgba(var(--accent-500-rgb), 0.04))',
                    border: '1px solid rgba(var(--accent-500-rgb), 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-400)',
                }}
            >
                {icon || <Inbox size={28} />}
            </motion.div>

            {/* Title */}
            <h3 style={{
                fontWeight: 700,
                fontSize: 'var(--text-base)',
                color: 'var(--fg-primary)',
                letterSpacing: '-0.01em',
            }}>
                {title}
            </h3>

            {/* Description */}
            <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--fg-tertiary)',
                maxWidth: 300,
                lineHeight: 1.6,
            }}>
                {description}
            </p>

            {/* CTA Button */}
            {actionLabel && onAction && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    style={{ marginTop: 'var(--space-2)' }}
                >
                    <Button
                        onClick={onAction}
                        leftIcon={<Plus size={16} />}
                        size="sm"
                    >
                        {actionLabel}
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}
