'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SpendingPieChart, DailySpendingChart, MemberSpendChart } from '@/components/charts/SpendingCharts';

export default function AnalyticsPage() {
    const router = useRouter();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <button
                    onClick={() => router.back()}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--fg-secondary)', display: 'flex', padding: 4 }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Analytics</h2>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>
                        Spending breakdown for your active trips
                    </p>
                </div>
            </div>

            {/* Charts */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <SpendingPieChart />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                <DailySpendingChart />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
            >
                <MemberSpendChart />
            </motion.div>
        </div>
    );
}
