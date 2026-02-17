'use client';

import { motion } from 'framer-motion';

interface PullToRefreshIndicatorProps {
    pullDistance: number;
    refreshing: boolean;
    threshold?: number;
}

export default function PullToRefreshIndicator({
    pullDistance,
    refreshing,
    threshold = 80,
}: PullToRefreshIndicatorProps) {
    if (pullDistance <= 0 && !refreshing) return null;

    const progress = Math.min(pullDistance / threshold, 1);
    const rotation = progress * 360;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: 'var(--space-3) 0',
                transition: 'transform 0.15s ease-out',
                transform: `translateY(${Math.min(pullDistance * 0.4, 40)}px)`,
            }}
        >
            {/* Spinner */}
            <motion.div
                animate={refreshing ? { rotate: 360 } : { rotate: rotation }}
                transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0 }}
                style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--bg-glass)',
                    backdropFilter: 'blur(12px)',
                    border: '2px solid rgba(var(--accent-500-rgb), 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 12px rgba(var(--accent-500-rgb), 0.15)',
                }}
            >
                {/* Inner gradient arc */}
                <svg width={20} height={20} viewBox="0 0 20 20">
                    <circle
                        cx={10} cy={10} r={8}
                        fill="none"
                        stroke="rgba(var(--accent-500-rgb), 0.15)"
                        strokeWidth={2}
                    />
                    <circle
                        cx={10} cy={10} r={8}
                        fill="none"
                        stroke="var(--accent-500)"
                        strokeWidth={2}
                        strokeDasharray={`${progress * 50} 50`}
                        strokeLinecap="round"
                        transform="rotate(-90 10 10)"
                    />
                </svg>
            </motion.div>
            {refreshing && (
                <motion.span
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        fontSize: 'var(--text-2xs)', color: 'var(--fg-tertiary)',
                        fontWeight: 600, marginTop: 6,
                    }}
                >
                    Refreshing...
                </motion.span>
            )}
        </motion.div>
    );
}
