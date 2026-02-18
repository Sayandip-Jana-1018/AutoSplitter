'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import { isFeatureEnabled } from '@/lib/featureFlags';

interface ChatMsg {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

const SUGGESTIONS = [
    '💰 Who owes me?',
    '📊 My spending',
    '💳 My debts',
    '👥 My groups',
];

export default function AIChatPanel() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || loading) return;

        const userMsg: ChatMsg = {
            id: Date.now().toString(),
            role: 'user',
            content: text.trim(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text.trim() }),
            });

            const data = await res.json();
            const assistantMsg: ChatMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply || data.error || 'Something went wrong.',
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Network error. Please try again.',
            }]);
        } finally {
            setLoading(false);
        }
    }, [loading]);

    if (!isFeatureEnabled('aiChat')) return null;

    if (!mounted) return <></>;

    return (
        <>
            {/* FAB */}
            <AnimatePresence>
                {!open && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        onClick={() => setOpen(true)}
                        style={{
                            position: 'fixed',
                            bottom: 88,
                            right: 20,
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600, var(--accent-500)))',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 20px rgba(var(--accent-500-rgb), 0.4)',
                            zIndex: 90,
                        }}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.08 }}
                        aria-label="AI Assistant"
                    >
                        <Sparkles size={22} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.92 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            position: 'fixed',
                            bottom: 20,
                            right: 20,
                            width: 360,
                            maxWidth: 'calc(100vw - 40px)',
                            height: 480,
                            maxHeight: 'calc(100vh - 120px)',
                            background: 'var(--surface-popover)',
                            backdropFilter: 'blur(24px) saturate(1.5)',
                            WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
                            border: '1px solid var(--border-glass)',
                            borderRadius: 'var(--radius-2xl, 20px)',
                            boxShadow: 'var(--shadow-xl, 0 24px 48px rgba(0,0,0,0.3))',
                            zIndex: 95,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '14px 16px',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(var(--accent-500-rgb), 0.15), rgba(var(--accent-500-rgb), 0.05))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--accent-400)',
                            }}>
                                <Sparkles size={16} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--fg-primary)' }}>
                                    AutoSplit AI
                                </h3>
                                <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--fg-muted)', marginTop: 1 }}>
                                    Ask about your expenses
                                </p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                style={{
                                    background: 'none', border: 'none',
                                    color: 'var(--fg-tertiary)', cursor: 'pointer',
                                    padding: 4, display: 'flex',
                                    borderRadius: 'var(--radius-sm)',
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '12px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                        }}>
                            {messages.length === 0 && (
                                <div style={{
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    flex: 1, gap: 12, textAlign: 'center',
                                    padding: 'var(--space-4)',
                                }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, rgba(var(--accent-500-rgb), 0.12), rgba(var(--accent-500-rgb), 0.04))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--accent-400)',
                                    }}>
                                        <Bot size={24} />
                                    </div>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-tertiary)', maxWidth: 220, lineHeight: 1.5 }}>
                                        Hi! I can help you understand your expenses, debts, and groups.
                                    </p>
                                    {/* Suggestion chips */}
                                    <div style={{
                                        display: 'flex', flexWrap: 'wrap',
                                        gap: 6, justifyContent: 'center', marginTop: 4,
                                    }}>
                                        {SUGGESTIONS.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => sendMessage(s.replace(/^[^\s]+ /, ''))}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: 'var(--radius-full, 99px)',
                                                    background: 'rgba(var(--accent-500-rgb), 0.08)',
                                                    border: '1px solid rgba(var(--accent-500-rgb), 0.15)',
                                                    color: 'var(--accent-400)',
                                                    fontSize: 'var(--text-2xs)',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(var(--accent-500-rgb), 0.15)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(var(--accent-500-rgb), 0.08)'; }}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        display: 'flex',
                                        gap: 8,
                                        alignItems: 'flex-start',
                                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                    }}
                                >
                                    <div style={{
                                        width: 24, height: 24, borderRadius: '50%',
                                        background: msg.role === 'user'
                                            ? 'rgba(var(--accent-500-rgb), 0.15)'
                                            : 'linear-gradient(135deg, rgba(var(--accent-500-rgb), 0.12), rgba(var(--accent-500-rgb), 0.04))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                        color: 'var(--accent-400)',
                                    }}>
                                        {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                    </div>
                                    <div style={{
                                        maxWidth: '80%',
                                        padding: '8px 12px',
                                        borderRadius: msg.role === 'user'
                                            ? 'var(--radius-lg) var(--radius-sm) var(--radius-lg) var(--radius-lg)'
                                            : 'var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg)',
                                        background: msg.role === 'user'
                                            ? 'rgba(var(--accent-500-rgb), 0.12)'
                                            : 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${msg.role === 'user' ? 'rgba(var(--accent-500-rgb), 0.18)' : 'var(--border-subtle)'}`,
                                        fontSize: 'var(--text-xs)',
                                        color: 'var(--fg-primary)',
                                        lineHeight: 1.5,
                                    }}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}

                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                                >
                                    <div style={{
                                        width: 24, height: 24, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, rgba(var(--accent-500-rgb), 0.12), rgba(var(--accent-500-rgb), 0.04))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--accent-400)',
                                    }}>
                                        <Bot size={12} />
                                    </div>
                                    <div style={{
                                        padding: '8px 12px',
                                        borderRadius: 'var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg)',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid var(--border-subtle)',
                                    }}>
                                        <Loader2 size={14} style={{ color: 'var(--accent-400)', animation: 'spin 1s linear infinite' }} />
                                    </div>
                                </motion.div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div style={{
                            padding: '10px 12px',
                            borderTop: '1px solid var(--border-subtle)',
                            display: 'flex',
                            gap: 8,
                        }}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage(input);
                                    }
                                }}
                                placeholder="Ask about your expenses..."
                                style={{
                                    flex: 1,
                                    padding: '8px 14px',
                                    borderRadius: 'var(--radius-full, 99px)',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--fg-primary)',
                                    fontSize: 'var(--text-xs)',
                                    outline: 'none',
                                    transition: 'border-color 0.15s',
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-500)'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                            />
                            <motion.button
                                onClick={() => sendMessage(input)}
                                disabled={!input.trim() || loading}
                                whileTap={{ scale: 0.9 }}
                                style={{
                                    width: 36, height: 36,
                                    borderRadius: '50%',
                                    background: input.trim()
                                        ? 'linear-gradient(135deg, var(--accent-500), var(--accent-600, var(--accent-500)))'
                                        : 'rgba(255,255,255,0.04)',
                                    border: 'none',
                                    color: input.trim() ? '#fff' : 'var(--fg-muted)',
                                    cursor: input.trim() ? 'pointer' : 'default',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 0.2s',
                                }}
                            >
                                <Send size={16} />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
