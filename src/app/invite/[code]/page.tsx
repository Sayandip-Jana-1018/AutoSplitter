'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

// Mock data — would be fetched from API in production
const MOCK_GROUP = {
    name: 'Goa Trip 2025',
    emoji: '🏖️',
    memberCount: 4,
    members: [
        { name: 'Sayan Das' },
        { name: 'Aman Singh' },
        { name: 'Priya Gupta' },
        { name: 'Rahul Verma' },
    ],
};

export default function InvitePage() {
    const router = useRouter();
    const params = useParams();
    const code = params.code as string;
    const [state, setState] = useState<'preview' | 'joining' | 'success'>('preview');

    const handleJoin = () => {
        setState('joining');
        // Simulate API call
        setTimeout(() => setState('success'), 1500);
    };

    return (
        <div style={{
            minHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
            background: 'var(--bg-primary)',
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ width: '100%', maxWidth: 400 }}
            >
                <Card padding="normal" glow>
                    <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                        {/* Group emoji */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                            style={{ fontSize: 56, marginBottom: 'var(--space-3)' }}
                        >
                            {MOCK_GROUP.emoji}
                        </motion.div>

                        {state === 'preview' && (
                            <>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginBottom: 4 }}>
                                    You&apos;ve been invited to join
                                </p>
                                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                                    {MOCK_GROUP.name}
                                </h2>

                                {/* Members preview */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 'var(--space-3)',
                                    marginBottom: 'var(--space-5)',
                                }}>
                                    <div style={{ display: 'flex', gap: -6 }}>
                                        {MOCK_GROUP.members.slice(0, 4).map((m, i) => (
                                            <motion.div
                                                key={m.name}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.3 + i * 0.1 }}
                                                style={{ marginLeft: i > 0 ? -8 : 0 }}
                                            >
                                                <Avatar name={m.name} size="md" />
                                            </motion.div>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)' }}>
                                        <Users size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                                        {MOCK_GROUP.memberCount} members already in
                                    </p>
                                </div>

                                <Button fullWidth onClick={handleJoin}>
                                    Join Group
                                </Button>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-muted)', marginTop: 'var(--space-3)' }}>
                                    Invite code: <code style={{ fontFamily: 'var(--font-mono)' }}>{code}</code>
                                </p>
                            </>
                        )}

                        {state === 'joining' && (
                            <div style={{ padding: 'var(--space-6) 0' }}>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    style={{ display: 'inline-block', marginBottom: 'var(--space-3)' }}
                                >
                                    <Loader2 size={32} style={{ color: 'var(--accent-500)' }} />
                                </motion.div>
                                <p style={{ fontWeight: 500 }}>Joining group...</p>
                            </div>
                        )}

                        {state === 'success' && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                style={{ padding: 'var(--space-4) 0' }}
                            >
                                <CheckCircle2 size={48} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-3)' }} />
                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 4 }}>
                                    Welcome to {MOCK_GROUP.name}!
                                </h3>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', marginBottom: 'var(--space-4)' }}>
                                    You&apos;re now a member. Start tracking expenses together.
                                </p>
                                <Button fullWidth onClick={() => router.push('/dashboard')}>
                                    Go to Dashboard
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
