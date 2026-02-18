'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Database, Wifi, Clock, Server, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

/* glassmorphic card style matching app theme */
const glassCard: React.CSSProperties = {
    background: 'var(--surface-card)',
    backdropFilter: 'blur(24px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-card)',
    padding: 'var(--space-5)',
    position: 'relative',
    overflow: 'hidden',
};

interface HealthStatus {
    database: { status: 'ok' | 'error'; latencyMs: number };
    api: { status: 'ok' | 'degraded' | 'error'; avgLatencyMs: number };
    counts: {
        users: number;
        groups: number;
        transactions: number;
        settlements: number;
        notifications: number;
    };
    uptime: string;
}

export default function SystemHealthPage() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchHealth = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/health');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setHealth(data.data);
        } catch {
            setError('Failed to fetch system health. Are you authorized?');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHealth(); }, []);

    const StatusDot = ({ status }: { status: string }) => (
        <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: status === 'ok' ? '#10b981' : status === 'degraded' ? '#f59e0b' : '#ef4444',
            boxShadow: `0 0 8px ${status === 'ok' ? 'rgba(16,185,129,0.5)' : status === 'degraded' ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.5)'}`,
        }} />
    );

    return (
        <div style={{ padding: 'var(--space-4)', maxWidth: 640, margin: '0 auto' }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, rgba(var(--accent-500-rgb), 0.15), rgba(var(--accent-500-rgb), 0.05))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--accent-400)',
                    }}>
                        <Activity size={20} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--fg-primary)' }}>
                            System Health
                        </h1>
                        <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--fg-muted)' }}>
                            Admin • Real-time diagnostics
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchHealth}
                    disabled={loading}
                    style={{
                        background: 'rgba(var(--accent-500-rgb), 0.08)',
                        border: '1px solid rgba(var(--accent-500-rgb), 0.15)',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px 12px',
                        color: 'var(--accent-400)',
                        fontSize: 'var(--text-2xs)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    Refresh
                </button>
            </motion.div>

            {error && (
                <div style={{
                    ...glassCard,
                    borderColor: 'rgba(239, 68, 68, 0.2)',
                    marginBottom: 'var(--space-4)',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <AlertCircle size={18} style={{ color: '#ef4444' }} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)' }}>{error}</span>
                </div>
            )}

            {health && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {/* Service Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        style={glassCard}
                    >
                        <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Server size={16} style={{ color: 'var(--accent-400)' }} /> Service Status
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {[
                                { label: 'Database', status: health.database.status, detail: `${health.database.latencyMs}ms latency`, icon: <Database size={14} /> },
                                { label: 'API Server', status: health.api.status, detail: `${health.api.avgLatencyMs}ms avg`, icon: <Wifi size={14} /> },
                            ].map(item => (
                                <div key={item.label} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--border-subtle)',
                                }}>
                                    <span style={{ color: 'var(--fg-muted)' }}>{item.icon}</span>
                                    <span style={{ flex: 1, fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-primary)' }}>{item.label}</span>
                                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--fg-tertiary)', marginRight: 8 }}>{item.detail}</span>
                                    <StatusDot status={item.status} />
                                    <span style={{
                                        fontSize: 'var(--text-2xs)', fontWeight: 600,
                                        color: item.status === 'ok' ? '#10b981' : '#ef4444',
                                        textTransform: 'uppercase',
                                    }}>
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Data Counts */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        style={glassCard}
                    >
                        <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Activity size={16} style={{ color: 'var(--accent-400)' }} /> Data Overview
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                            {[
                                { label: 'Users', value: health.counts.users, color: '#3b82f6' },
                                { label: 'Groups', value: health.counts.groups, color: '#8b5cf6' },
                                { label: 'Transactions', value: health.counts.transactions, color: '#10b981' },
                                { label: 'Settlements', value: health.counts.settlements, color: '#f59e0b' },
                                { label: 'Notifications', value: health.counts.notifications, color: 'var(--accent-400)' },
                            ].map(item => (
                                <div key={item.label} style={{
                                    textAlign: 'center',
                                    padding: '14px 8px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--border-subtle)',
                                }}>
                                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: item.color }}>
                                        {item.value.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--fg-muted)', marginTop: 4 }}>
                                        {item.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Uptime */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        style={{ ...glassCard, display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                        <Clock size={18} style={{ color: 'var(--accent-400)' }} />
                        <div>
                            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-primary)' }}>
                                Server Uptime
                            </div>
                            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--fg-muted)' }}>
                                {health.uptime}
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle size={14} style={{ color: '#10b981' }} />
                            <span style={{ fontSize: 'var(--text-2xs)', color: '#10b981', fontWeight: 600 }}>
                                All Systems Operational
                            </span>
                        </div>
                    </motion.div>
                </div>
            )}

            {loading && !health && (
                <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--fg-muted)' }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 'var(--text-sm)' }}>Checking system health...</p>
                </div>
            )}
        </div>
    );
}
