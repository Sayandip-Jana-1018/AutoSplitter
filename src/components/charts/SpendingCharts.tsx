'use client';

import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

// ── Category Spending Pie Chart ──

interface CategoryData {
    name: string;
    value: number; // paise
    color: string;
}

const MOCK_CATEGORY_DATA: CategoryData[] = [
    { name: 'Food', value: 580000, color: '#ef4444' },
    { name: 'Transport', value: 320000, color: '#3b82f6' },
    { name: 'Stay', value: 850000, color: '#8b5cf6' },
    { name: 'Shopping', value: 190000, color: '#ec4899' },
    { name: 'Tickets', value: 120000, color: '#f59e0b' },
    { name: 'Entertainment', value: 95000, color: '#06b6d4' },
];

export function SpendingPieChart({ data = MOCK_CATEGORY_DATA }: { data?: CategoryData[] }) {
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <Card padding="normal">
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--fg-secondary)' }}>
                Spending by Category
            </h4>
            <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer minWidth={0}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={800}
                        >
                            {data.map((entry, i) => (
                                <Cell key={i} fill={entry.color} stroke="var(--bg-primary)" strokeWidth={2} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ payload }) => {
                                if (!payload?.length) return null;
                                const d = payload[0].payload as CategoryData;
                                return (
                                    <div style={{
                                        background: 'var(--surface-card)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '6px 10px',
                                        fontSize: 'var(--text-xs)',
                                    }}>
                                        <span style={{ fontWeight: 600 }}>{d.name}</span>: {formatCurrency(d.value)}
                                        <span style={{ color: 'var(--fg-tertiary)', marginLeft: 6 }}>
                                            ({Math.round((d.value / total) * 100)}%)
                                        </span>
                                    </div>
                                );
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 'var(--space-2)' }}>
                {data.map((d) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <span style={{ color: 'var(--fg-secondary)' }}>{d.name}</span>
                        <span style={{ fontWeight: 600, color: 'var(--fg-primary)' }}>{Math.round((d.value / total) * 100)}%</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ── Daily Spending Bar Chart ──

interface DailyData {
    day: string;
    amount: number; // paise
}

const MOCK_DAILY_DATA: DailyData[] = [
    { day: 'Mon', amount: 250000 },
    { day: 'Tue', amount: 180000 },
    { day: 'Wed', amount: 420000 },
    { day: 'Thu', amount: 310000 },
    { day: 'Fri', amount: 150000 },
    { day: 'Sat', amount: 580000 },
    { day: 'Sun', amount: 350000 },
];

export function DailySpendingChart({ data = MOCK_DAILY_DATA }: { data?: DailyData[] }) {
    return (
        <Card padding="normal">
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--fg-secondary)' }}>
                Daily Spending
            </h4>
            <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer minWidth={0}>
                    <BarChart data={data} barSize={24}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border-subtle)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="day"
                            tick={{ fill: 'var(--fg-tertiary)', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: 'var(--fg-tertiary)', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) => `₹${(v / 100).toLocaleString('en-IN')}`}
                            width={55}
                        />
                        <Tooltip
                            content={({ payload, label }) => {
                                if (!payload?.length) return null;
                                return (
                                    <div style={{
                                        background: 'var(--surface-card)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '6px 10px',
                                        fontSize: 'var(--text-xs)',
                                    }}>
                                        <span style={{ fontWeight: 600 }}>{label}</span>: {formatCurrency(payload[0].value as number)}
                                    </div>
                                );
                            }}
                        />
                        <Bar
                            dataKey="amount"
                            fill="var(--accent-500)"
                            radius={[6, 6, 0, 0]}
                            animationBegin={0}
                            animationDuration={600}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

// ── Member Spending Comparison ──

interface MemberSpend {
    name: string;
    paid: number;   // paise
    owes: number;   // paise
}

const MOCK_MEMBER_DATA: MemberSpend[] = [
    { name: 'Sayan', paid: 780000, owes: 520000 },
    { name: 'Aman', paid: 450000, owes: 520000 },
    { name: 'Priya', paid: 650000, owes: 520000 },
    { name: 'Rahul', paid: 200000, owes: 520000 },
];

export function MemberSpendChart({ data = MOCK_MEMBER_DATA }: { data?: MemberSpend[] }) {
    return (
        <Card padding="normal">
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--fg-secondary)' }}>
                Who Paid vs Who Owes
            </h4>
            <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer minWidth={0}>
                    <BarChart data={data} layout="vertical" barSize={14}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                        <XAxis
                            type="number"
                            tick={{ fill: 'var(--fg-tertiary)', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) => `₹${(v / 100).toLocaleString('en-IN')}`}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fill: 'var(--fg-secondary)', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            width={50}
                        />
                        <Tooltip
                            content={({ payload, label }) => {
                                if (!payload?.length) return null;
                                return (
                                    <div style={{
                                        background: 'var(--surface-card)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '6px 10px',
                                        fontSize: 'var(--text-xs)',
                                    }}>
                                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
                                        {payload.map((p: any) => (
                                            <div key={p.name}>
                                                {p.name === 'paid' ? 'Paid' : 'Fair share'}: {formatCurrency(p.value)}
                                            </div>
                                        ))}
                                    </div>
                                );
                            }}
                        />
                        <Bar dataKey="paid" fill="var(--accent-500)" radius={[0, 4, 4, 0]} name="paid" />
                        <Bar dataKey="owes" fill="var(--fg-muted)" radius={[0, 4, 4, 0]} name="owes" opacity={0.4} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-500)' }} /> Paid
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--fg-muted)', opacity: 0.4 }} /> Fair Share
                </span>
            </div>
        </Card>
    );
}
