'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

interface GroupPreview {
    id: string;
    name: string;
    emoji: string;
    _count: { members: number };
}

export default function InvitePage() {
    const router = useRouter();
    const params = useParams();
    const code = params.code as string;

    const [group, setGroup] = useState<GroupPreview | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(true);
    const [state, setState] = useState<'preview' | 'joining' | 'success' | 'error'>('preview');
    const [errorMsg, setErrorMsg] = useState('');

    // Fetch group preview on mount
    useEffect(() => {
        async function loadPreview() {
            try {
                const res = await fetch(`/api/groups/join?code=${encodeURIComponent(code)}`);
                if (res.ok) {
                    const data = await res.json();
                    setGroup(data);
                } else {
                    const err = await res.json().catch(() => ({ error: 'Invalid invite link' }));
                    setErrorMsg(err.error || 'Invalid invite link');
                    setState('error');
                }
            } catch {
                setErrorMsg('Network error');
                setState('error');
            } finally {
                setLoadingPreview(false);
            }
        }
        loadPreview();
    }, [code]);

    const handleJoin = async () => {
        setState('joining');
        try {
            const res = await fetch('/api/groups/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteCode: code }),
            });
            const data = await res.json();
            if (res.ok) {
                setState('success');
            } else {
                if (data.message === 'Already a member') {
                    setState('success');
                } else {
                    setErrorMsg(data.error || 'Failed to join');
                    setState('error');
                }
            }
        } catch {
            setErrorMsg('Network error');
            setState('error');
        }
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

                        {/* Loading state */}
                        {loadingPreview && (
                            <div style={{ padding: 'var(--space-6) 0' }}>
                                <Loader2 size={32} style={{ color: 'var(--accent-500)', animation: 'spin 1s linear infinite' }} />
                                <p style={{ marginTop: 'var(--space-3)', color: 'var(--fg-secondary)' }}>Loading invite...</p>
                            </div>
                        )}

                        {/* Error state */}
                        {state === 'error' && (
                            <div style={{ padding: 'var(--space-4) 0' }}>
                                <AlertCircle size={48} style={{ color: 'var(--color-error)', marginBottom: 'var(--space-3)' }} />
                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 4 }}>
                                    Invite Error
                                </h3>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', marginBottom: 'var(--space-4)' }}>
                                    {errorMsg}
                                </p>
                                <Button fullWidth onClick={() => router.push('/dashboard')}>
                                    Go to Dashboard
                                </Button>
                            </div>
                        )}

                        {/* Preview state */}
                        {!loadingPreview && state === 'preview' && group && (
                            <>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                                    style={{ fontSize: 56, marginBottom: 'var(--space-3)' }}
                                >
                                    {group.emoji}
                                </motion.div>

                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginBottom: 4 }}>
                                    You&apos;ve been invited to join
                                </p>
                                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                                    {group.name}
                                </h2>

                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 'var(--space-3)',
                                    marginBottom: 'var(--space-5)',
                                }}>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)' }}>
                                        <Users size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                                        {group._count.members} member{group._count.members !== 1 ? 's' : ''} already in
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

                        {/* Joining state */}
                        {state === 'joining' && (
                            <div style={{ padding: 'var(--space-6) 0' }}>
                                <Loader2 size={32} style={{ color: 'var(--accent-500)', animation: 'spin 1s linear infinite' }} />
                                <p style={{ fontWeight: 500, marginTop: 'var(--space-3)' }}>Joining group...</p>
                            </div>
                        )}

                        {/* Success state */}
                        {state === 'success' && group && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                style={{ padding: 'var(--space-4) 0' }}
                            >
                                <CheckCircle2 size={48} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-3)' }} />
                                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 4 }}>
                                    Welcome to {group.name}!
                                </h3>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', marginBottom: 'var(--space-4)' }}>
                                    You&apos;re now a member. Start tracking expenses together.
                                </p>
                                <Button fullWidth onClick={() => router.push('/groups')}>
                                    Go to Groups
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
