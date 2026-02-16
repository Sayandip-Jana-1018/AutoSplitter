'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, UserPlus, Link2, Copy, Check, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { AvatarGroup } from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';

const GROUP_EMOJIS = ['✈️', '🏖️', '🏠', '🍕', '🎮', '🏕️', '🎉', '🚗', '💼', '🎓', '🏋️', '🎵'];

// Mock data
const MOCK_GROUPS = [
    {
        id: '1',
        name: 'Goa Trip 2026',
        emoji: '🏖️',
        members: [
            { name: 'Sayan Das' },
            { name: 'Aman Singh' },
            { name: 'Priya Gupta' },
            { name: 'Rahul Verma' },
        ],
        totalSpent: '₹23,450',
        activeTrips: 1,
        lastActivity: '2h ago',
    },
    {
        id: '2',
        name: 'Flat Expenses',
        emoji: '🏠',
        members: [
            { name: 'Sayan Das' },
            { name: 'Tanisha Roy' },
            { name: 'Arjun Mehta' },
        ],
        totalSpent: '₹8,200',
        activeTrips: 1,
        lastActivity: '1d ago',
    },
    {
        id: '3',
        name: 'Office Lunch Squad',
        emoji: '🍕',
        members: [
            { name: 'Sayan Das' },
            { name: 'Neha Patel' },
        ],
        totalSpent: '₹2,100',
        activeTrips: 0,
        lastActivity: '3d ago',
    },
];

export default function GroupsPage() {
    const [showCreate, setShowCreate] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('✈️');
    const [inviteLink, setInviteLink] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCreate = () => {
        // TODO: API call
        setInviteLink(`https://autosplit.app/join/abc123`);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <div>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Your Groups</h2>
                    <p style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)' }}>
                        {MOCK_GROUPS.length} groups
                    </p>
                </div>
                <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
                    New Group
                </Button>
            </div>

            {/* Group Cards */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
            }}>
                {MOCK_GROUPS.map((group, i) => (
                    <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.3 }}
                    >
                        <Card interactive padding="normal" glow>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <span style={{
                                    fontSize: 28,
                                    width: 48,
                                    height: 48,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(var(--accent-500-rgb), 0.08)',
                                    borderRadius: 'var(--radius-xl)',
                                    flexShrink: 0,
                                }}>
                                    {group.emoji}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 'var(--text-base)',
                                        fontWeight: 600,
                                        color: 'var(--fg-primary)',
                                        marginBottom: 2,
                                    }}>
                                        {group.name}
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-2)',
                                        flexWrap: 'wrap',
                                    }}>
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>
                                            {group.members.length} members
                                        </span>
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-muted)' }}>·</span>
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>
                                            {group.lastActivity}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{
                                        fontSize: 'var(--text-sm)',
                                        fontWeight: 700,
                                        color: 'var(--fg-primary)',
                                        marginBottom: 2,
                                    }}>
                                        {group.totalSpent}
                                    </div>
                                    <AvatarGroup users={group.members} max={3} size="xs" />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* ── Create Group Modal ── */}
            <Modal
                isOpen={showCreate}
                onClose={() => { setShowCreate(false); setInviteLink(''); setGroupName(''); }}
                title={inviteLink ? 'Invite Members' : 'New Group'}
                size="small"
            >
                <AnimatePresence mode="wait">
                    {!inviteLink ? (
                        <motion.div
                            key="create"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -20 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
                        >
                            <Input
                                label="Group Name"
                                placeholder="e.g. Goa Trip 2026"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                leftIcon={<Users size={18} />}
                            />

                            {/* Emoji Picker */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: 500,
                                    color: 'var(--fg-secondary)',
                                    marginBottom: 'var(--space-2)',
                                }}>
                                    Group Icon
                                </label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(6, 1fr)',
                                    gap: 'var(--space-2)',
                                }}>
                                    {GROUP_EMOJIS.map((emoji) => (
                                        <motion.button
                                            key={emoji}
                                            whileTap={{ scale: 0.85 }}
                                            onClick={() => setSelectedEmoji(emoji)}
                                            style={{
                                                width: '100%',
                                                aspectRatio: '1',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 24,
                                                border: selectedEmoji === emoji
                                                    ? '2px solid var(--accent-500)'
                                                    : '1px solid var(--border-default)',
                                                borderRadius: 'var(--radius-lg)',
                                                background: selectedEmoji === emoji
                                                    ? 'rgba(var(--accent-500-rgb), 0.1)'
                                                    : 'transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            {emoji}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                fullWidth
                                size="lg"
                                disabled={!groupName.trim()}
                                onClick={handleCreate}
                            >
                                Create Group
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="invite"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', textAlign: 'center' }}
                        >
                            <div style={{ fontSize: 48, margin: 'var(--space-2) 0' }}>🎉</div>
                            <p style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)' }}>
                                Share this link with your friends to invite them:
                            </p>

                            <div style={{
                                display: 'flex',
                                gap: 'var(--space-2)',
                                background: 'var(--bg-tertiary)',
                                padding: 'var(--space-2) var(--space-3)',
                                borderRadius: 'var(--radius-lg)',
                                alignItems: 'center',
                            }}>
                                <Link2 size={16} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
                                <span style={{
                                    flex: 1,
                                    fontSize: 'var(--text-sm)',
                                    color: 'var(--fg-primary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {inviteLink}
                                </span>
                                <Button
                                    size="sm"
                                    variant={copied ? 'ghost' : 'primary'}
                                    iconOnly
                                    onClick={handleCopy}
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </Button>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <Button fullWidth variant="secondary" onClick={() => {
                                    setShowCreate(false);
                                    setInviteLink('');
                                    setGroupName('');
                                }}>
                                    Done
                                </Button>
                                <Button fullWidth leftIcon={<UserPlus size={16} />}>
                                    Share via WhatsApp
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Modal>
        </div>
    );
}
