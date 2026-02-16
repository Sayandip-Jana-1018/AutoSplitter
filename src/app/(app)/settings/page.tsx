'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Palette, Moon, Sun, Bell, Shield, LogOut, ChevronRight, Smartphone } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useThemeContext } from '@/components/providers/ThemeProvider';
import { ACCENT_COLORS } from '@/hooks/useTheme';

const MOCK_USER = {
    name: 'Sayan Das',
    email: 'sayan@example.com',
    joinedDate: 'Feb 2026',
};

export default function SettingsPage() {
    const { theme, accent, setTheme, setAccent } = useThemeContext();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Settings</h2>
                <p style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)' }}>
                    Customize your experience
                </p>
            </div>

            {/* Profile Card */}
            <Card padding="normal">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <Avatar name={MOCK_USER.name} size="lg" />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{MOCK_USER.name}</div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-tertiary)' }}>{MOCK_USER.email}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-muted)', marginTop: 2 }}>
                            Member since {MOCK_USER.joinedDate}
                        </div>
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                </div>
            </Card>

            {/* Appearance */}
            <SettingsGroup title="Appearance" icon={<Palette size={18} />}>
                {/* Theme Toggle */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3) 0',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Dark Mode</span>
                    </div>
                    <ToggleSwitch
                        checked={theme === 'dark'}
                        onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    />
                </div>

                {/* Accent Color */}
                <div style={{ padding: 'var(--space-3) 0' }}>
                    <div style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 500,
                        marginBottom: 'var(--space-3)',
                    }}>
                        Accent Color
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: 'var(--space-2)',
                        flexWrap: 'wrap',
                    }}>
                        {ACCENT_COLORS.map((a) => (
                            <motion.button
                                key={a.value}
                                whileTap={{ scale: 0.85 }}
                                onClick={() => setAccent(a.value)}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: a.color,
                                    border: accent === a.value
                                        ? '3px solid var(--fg-primary)'
                                        : '2px solid transparent',
                                    cursor: 'pointer',
                                    outline: accent === a.value ? '2px solid var(--bg-primary)' : 'none',
                                    transition: 'all 0.15s',
                                }}
                                title={a.label}
                            />
                        ))}
                    </div>
                </div>
            </SettingsGroup>

            {/* Notifications */}
            <SettingsGroup title="Notifications" icon={<Bell size={18} />}>
                <SettingsRow label="Push Notifications" subtitle="Get notified about settlements" />
                <SettingsRow label="Expense Reminders" subtitle="Daily summary of pending splits" />
            </SettingsGroup>

            {/* Privacy */}
            <SettingsGroup title="Privacy & Security" icon={<Shield size={18} />}>
                <SettingsRow label="Data Processing" subtitle="All data processed on-device" disabled />
                <SettingsRow label="Export My Data" action />
                <SettingsRow label="Delete Account" danger action />
            </SettingsGroup>

            {/* App Info */}
            <SettingsGroup title="App" icon={<Smartphone size={18} />}>
                <SettingsRow label="Version" subtitle="1.0.0 (MVP)" disabled />
                <SettingsRow label="Install as App (PWA)" action />
            </SettingsGroup>

            {/* Sign Out */}
            <Button
                variant="danger"
                fullWidth
                leftIcon={<LogOut size={16} />}
                onClick={() => window.location.href = '/login'}
            >
                Sign Out
            </Button>
        </div>
    );
}

// ── Sub-components ──

function SettingsGroup({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--fg-secondary)',
                marginBottom: 'var(--space-2)',
            }}>
                {icon}
                {title}
            </div>
            <Card padding="normal">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                }}>
                    {children}
                </div>
            </Card>
        </div>
    );
}

function SettingsRow({
    label,
    subtitle,
    danger,
    action,
    disabled,
}: {
    label: string;
    subtitle?: string;
    danger?: boolean;
    action?: boolean;
    disabled?: boolean;
}) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-3) 0',
            borderTop: '1px solid var(--border-subtle)',
            opacity: disabled ? 0.6 : 1,
        }}>
            <div>
                <span style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    color: danger ? 'var(--color-error)' : 'var(--fg-primary)',
                }}>
                    {label}
                </span>
                {subtitle && (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <ChevronRight size={16} style={{ color: 'var(--fg-muted)' }} />}
        </div>
    );
}

function ToggleSwitch({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <motion.button
            onClick={onChange}
            style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                background: checked ? 'var(--accent-500)' : 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                cursor: 'pointer',
                position: 'relative',
                padding: 0,
            }}
        >
            <motion.div
                animate={{ x: checked ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: 2,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
            />
        </motion.button>
    );
}
