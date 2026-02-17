'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserPlus, Search, Send, Trash2, Mail, Phone,
    Users, UserCheck, Inbox, X, ExternalLink,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import styles from './contacts.module.css';

interface Contact {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    linkedUser?: {
        id: string;
        name: string | null;
        image: string | null;
        email: string | null;
    } | null;
    addedAt: string;
}

export default function ContactsPage() {
    const { user: currentUser } = useCurrentUser();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [invitingId, setInvitingId] = useState<string | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    // Fetch contacts
    useEffect(() => {
        async function loadContacts() {
            try {
                const res = await fetch('/api/contacts');
                if (res.ok) {
                    const data = await res.json();
                    setContacts(data);
                }
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        }
        loadContacts();
    }, []);

    // Filtered contacts
    const filteredContacts = useMemo(() => {
        if (!searchQuery.trim()) return contacts;
        const q = searchQuery.toLowerCase();
        return contacts.filter(
            c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
        );
    }, [contacts, searchQuery]);

    // Stats
    const totalContacts = contacts.length;
    const linkedCount = contacts.filter(c => c.linkedUser).length;
    const pendingCount = totalContacts - linkedCount;

    // Add contact
    const handleAdd = async () => {
        setFormError('');
        if (!formName.trim()) { setFormError('Name is required'); return; }
        if (!formEmail.trim() || !formEmail.includes('@')) { setFormError('Valid email is required'); return; }

        setSaving(true);
        try {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formName.trim(), email: formEmail.trim(), phone: formPhone.trim() || undefined }),
            });

            if (res.ok) {
                const newContact = await res.json();
                setContacts(prev => [newContact, ...prev]);
                setShowAddModal(false);
                setFormName(''); setFormEmail(''); setFormPhone('');
            } else {
                const err = await res.json();
                setFormError(err.error || 'Failed to add contact');
            }
        } catch {
            setFormError('Something went wrong');
        } finally {
            setSaving(false);
        }
    };

    // Delete contact
    const handleDelete = async (contactId: string) => {
        try {
            const res = await fetch(`/api/contacts?id=${contactId}`, { method: 'DELETE' });
            if (res.ok) {
                setContacts(prev => prev.filter(c => c.id !== contactId));
            }
        } catch {
            // silent
        }
    };

    // Invite contact — show share options
    const [shareData, setShareData] = useState<{ message: string; url: string; contactName: string; contactEmail: string; contactPhone: string | null } | null>(null);
    const [copied, setCopied] = useState(false);

    const handleInvite = async (contact: Contact) => {
        setInvitingId(contact.id);
        try {
            const res = await fetch('/api/contacts/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contactId: contact.id }),
            });

            if (res.ok) {
                const data = await res.json();
                setShareData({
                    message: data.message,
                    url: data.inviteUrl,
                    contactName: data.contactName,
                    contactEmail: data.contactEmail,
                    contactPhone: contact.phone || null,
                });
            }
        } catch {
            // silent
        } finally {
            setInvitingId(null);
        }
    };

    const shareViaWhatsApp = () => {
        if (!shareData) return;
        const text = encodeURIComponent(shareData.message);
        const phone = shareData.contactPhone?.replace(/[^0-9]/g, '') || '';
        // If phone is available, directly chat; otherwise open general WhatsApp
        const url = phone
            ? `https://wa.me/${phone}?text=${text}`
            : `https://wa.me/?text=${text}`;
        window.open(url, '_blank');
    };

    const shareViaSMS = () => {
        if (!shareData) return;
        const body = encodeURIComponent(shareData.message);
        const phone = shareData.contactPhone?.replace(/[^0-9]/g, '') || '';
        window.open(`sms:${phone}?body=${body}`, '_blank');
    };

    const shareViaEmail = () => {
        if (!shareData) return;
        const subject = encodeURIComponent('Join me on AutoSplit!');
        const body = encodeURIComponent(shareData.message);
        window.open(`mailto:${shareData.contactEmail}?subject=${subject}&body=${body}`, '_blank');
    };

    const shareViaCopy = () => {
        if (!shareData) return;
        navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Get initials
    const getInitials = (name: string) => {
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <div className={styles.contactsContainer}>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className={styles.contactCard} style={{
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        animationDelay: `${i * 150}ms`,
                    }}>
                        <div className={styles.contactAvatar} style={{ background: 'rgba(var(--accent-500-rgb), 0.06)' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ width: '60%', height: 14, borderRadius: 8, background: 'rgba(var(--accent-500-rgb), 0.08)', marginBottom: 8 }} />
                            <div style={{ width: '80%', height: 10, borderRadius: 6, background: 'rgba(var(--accent-500-rgb), 0.05)' }} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={styles.contactsContainer}>
            {/* ═══ STATS ROW ═══ */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{totalContacts}</div>
                    <div className={styles.statLabel}>Total</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{linkedCount}</div>
                    <div className={styles.statLabel}>On App</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{pendingCount}</div>
                    <div className={styles.statLabel}>Invite</div>
                </div>
            </div>

            {/* ═══ SUBHEADER ═══ */}
            <div className={styles.subheader}>
                <p className={styles.subheaderText}>
                    {totalContacts} contact{totalContacts !== 1 ? 's' : ''} · Manage your split buddies
                </p>
                <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
                    <UserPlus size={14} /> Add Contact
                </button>
            </div>

            {/* ═══ SEARCH ═══ */}
            {contacts.length > 0 && (
                <div className={styles.searchBar}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                        className={styles.searchInput}
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            )}

            {/* ═══ CONTACT LIST ═══ */}
            {filteredContacts.length === 0 && contacts.length === 0 ? (
                <motion.div
                    className={styles.emptyState}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className={styles.emptyIcon}>
                        <Inbox size={28} />
                    </div>
                    <h3 className={styles.emptyTitle}>No contacts yet</h3>
                    <p className={styles.emptyDesc}>Add friends to split expenses with them</p>
                    <Button
                        size="sm"
                        leftIcon={<UserPlus size={14} />}
                        onClick={() => setShowAddModal(true)}
                        style={{
                            background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
                            boxShadow: '0 4px 20px rgba(var(--accent-500-rgb), 0.3)',
                        }}
                    >
                        Add Your First Contact
                    </Button>
                </motion.div>
            ) : (
                <div className={styles.contactList}>
                    <AnimatePresence mode="popLayout">
                        {filteredContacts.map((contact, i) => (
                            <motion.div
                                key={contact.id}
                                className={styles.contactCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: i * 0.04, duration: 0.3 }}
                                layout
                            >
                                <div className={styles.contactAvatar}>
                                    {getInitials(contact.name)}
                                </div>
                                <div className={styles.contactInfo}>
                                    <div className={styles.contactName}>{contact.name}</div>
                                    <div className={styles.contactMeta}>
                                        <span className={styles.contactEmail}>{contact.email}</span>
                                        {contact.linkedUser && (
                                            <span className={styles.linkedBadge}>
                                                <UserCheck size={10} /> On App
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.contactActions}>
                                    {!contact.linkedUser && (
                                        <button
                                            className={styles.actionBtn}
                                            title="Send Invite"
                                            onClick={() => handleInvite(contact)}
                                            disabled={invitingId === contact.id}
                                        >
                                            {invitingId === contact.id
                                                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }}>
                                                    <Send size={14} />
                                                </motion.div>
                                                : <Send size={14} />
                                            }
                                        </button>
                                    )}
                                    <button
                                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                        title="Remove Contact"
                                        onClick={() => handleDelete(contact.id)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredContacts.length === 0 && searchQuery && (
                        <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--fg-tertiary)' }}>
                            No contacts matching &quot;{searchQuery}&quot;
                        </div>
                    )}
                </div>
            )}

            {/* ═══ ADD CONTACT MODAL ═══ */}
            <Modal
                isOpen={showAddModal}
                onClose={() => { setShowAddModal(false); setFormError(''); }}
                title="Add Contact"
                size="small"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
                    >
                        {formError && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={{
                                    padding: '8px 12px', borderRadius: 'var(--radius-lg)',
                                    background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)',
                                    color: '#ef4444', fontSize: 'var(--text-xs)',
                                }}
                            >
                                {formError}
                            </motion.div>
                        )}

                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Name</label>
                            <input
                                className={styles.formInput}
                                placeholder="e.g. Rahul Sharma"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Email</label>
                            <input
                                className={styles.formInput}
                                type="email"
                                placeholder="rahul@example.com"
                                value={formEmail}
                                onChange={(e) => setFormEmail(e.target.value)}
                            />
                        </div>

                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Phone (optional)</label>
                            <input
                                className={styles.formInput}
                                type="tel"
                                placeholder="+91 98765 43210"
                                value={formPhone}
                                onChange={(e) => setFormPhone(e.target.value)}
                            />
                        </div>

                        <Button
                            fullWidth
                            size="lg"
                            disabled={!formName.trim() || !formEmail.trim()}
                            loading={saving}
                            leftIcon={<UserPlus size={18} />}
                            onClick={handleAdd}
                            style={{
                                background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
                                boxShadow: '0 4px 20px rgba(var(--accent-500-rgb), 0.3)',
                                marginTop: 'var(--space-2)',
                            }}
                        >
                            Add Contact
                        </Button>
                    </motion.div>
                </AnimatePresence>
            </Modal>

            {/* ═══ SHARE MODAL ═══ */}
            <Modal
                isOpen={!!shareData}
                onClose={() => { setShareData(null); setCopied(false); }}
                title={`Invite ${shareData?.contactName || ''}`}
                size="small"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', textAlign: 'center', marginBottom: 'var(--space-2)' }}>
                        Choose how to send the invite:
                    </p>

                    {/* WhatsApp */}
                    <button
                        onClick={shareViaWhatsApp}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                            padding: 'var(--space-3) var(--space-4)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-default)',
                            background: 'var(--bg-secondary)',
                            cursor: 'pointer',
                            color: 'var(--fg-primary)',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <span style={{ fontSize: 24 }}>💬</span>
                        <span style={{ flex: 1, textAlign: 'left' }}>WhatsApp</span>
                        <ExternalLink size={14} style={{ color: 'var(--fg-tertiary)' }} />
                    </button>

                    {/* SMS */}
                    <button
                        onClick={shareViaSMS}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                            padding: 'var(--space-3) var(--space-4)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-default)',
                            background: 'var(--bg-secondary)',
                            cursor: 'pointer',
                            color: 'var(--fg-primary)',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <span style={{ fontSize: 24 }}>📱</span>
                        <span style={{ flex: 1, textAlign: 'left' }}>SMS / iMessage</span>
                        <ExternalLink size={14} style={{ color: 'var(--fg-tertiary)' }} />
                    </button>

                    {/* Email */}
                    <button
                        onClick={shareViaEmail}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                            padding: 'var(--space-3) var(--space-4)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-default)',
                            background: 'var(--bg-secondary)',
                            cursor: 'pointer',
                            color: 'var(--fg-primary)',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <span style={{ fontSize: 24 }}>📧</span>
                        <span style={{ flex: 1, textAlign: 'left' }}>Email to {shareData?.contactEmail}</span>
                        <ExternalLink size={14} style={{ color: 'var(--fg-tertiary)' }} />
                    </button>

                    {/* Copy Link */}
                    <button
                        onClick={shareViaCopy}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                            padding: 'var(--space-3) var(--space-4)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-default)',
                            background: copied ? 'rgba(var(--accent-500-rgb), 0.08)' : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            color: copied ? 'var(--accent-500)' : 'var(--fg-primary)',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <span style={{ fontSize: 24 }}>{copied ? '✅' : '🔗'}</span>
                        <span style={{ flex: 1, textAlign: 'left' }}>{copied ? 'Copied!' : 'Copy Invite Link'}</span>
                    </button>

                    {/* Invite URL preview */}
                    {shareData && (
                        <div style={{
                            padding: 'var(--space-2) var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-tertiary)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--fg-tertiary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {shareData.url}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
