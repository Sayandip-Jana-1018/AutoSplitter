'use client';

import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    size?: BadgeSize;
    className?: string;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
    default: {
        background: 'var(--bg-tertiary)',
        color: 'var(--fg-secondary)',
        border: '1px solid var(--border-default)',
    },
    success: {
        background: 'var(--color-success-bg)',
        color: 'var(--color-success)',
        border: '1px solid var(--color-success-border)',
    },
    warning: {
        background: 'var(--color-warning-bg)',
        color: 'var(--color-warning)',
        border: '1px solid var(--color-warning-border)',
    },
    error: {
        background: 'var(--color-error-bg)',
        color: 'var(--color-error)',
        border: '1px solid var(--color-error-border)',
    },
    info: {
        background: 'var(--color-info-bg)',
        color: 'var(--color-info)',
        border: '1px solid var(--color-info-border)',
    },
    accent: {
        background: 'rgba(var(--accent-500-rgb), 0.1)',
        color: 'var(--accent-500)',
        border: '1px solid rgba(var(--accent-500-rgb), 0.2)',
    },
};

const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
    sm: { padding: '2px 8px', fontSize: 'var(--text-xs)' },
    md: { padding: '4px 12px', fontSize: 'var(--text-sm)' },
};

export default function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
    return (
        <span
            className={cn(className)}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: 'var(--radius-full)',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                lineHeight: 1.4,
                ...variantStyles[variant],
                ...sizeStyles[size],
            }}
        >
            {children}
        </span>
    );
}
