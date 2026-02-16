'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Palette } from 'lucide-react';
import { useState } from 'react';
import { useThemeContext, ACCENT_COLORS } from '@/components/providers/ThemeProvider';

export default function ThemeSelector() {
    const { theme, accent, toggleTheme, setAccent } = useThemeContext();
    const [showColors, setShowColors] = useState(false);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Dark/Light toggle */}
            <motion.button
                whileTap={{ scale: 0.9, rotate: 180 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                onClick={toggleTheme}
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--fg-secondary)',
                    cursor: 'pointer',
                }}
                aria-label="Toggle theme"
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                        key={theme}
                        initial={{ opacity: 0, rotate: -90, scale: 0 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 90, scale: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: 'flex' }}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </motion.span>
                </AnimatePresence>
            </motion.button>

            {/* Accent color picker */}
            <div style={{ position: 'relative' }}>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowColors(!showColors)}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--accent-500)',
                        cursor: 'pointer',
                    }}
                    aria-label="Choose accent color"
                >
                    <Palette size={18} />
                </motion.button>

                <AnimatePresence>
                    {showColors && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -4 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: 8,
                                background: 'var(--surface-popover)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-xl)',
                                padding: 12,
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: 8,
                                boxShadow: 'var(--shadow-xl)',
                                zIndex: 'var(--z-popover)' as unknown as number,
                                minWidth: 180,
                            }}
                        >
                            {ACCENT_COLORS.map((c) => (
                                <motion.button
                                    key={c.value}
                                    whileTap={{ scale: 0.85 }}
                                    whileHover={{ scale: 1.15 }}
                                    onClick={() => { setAccent(c.value); setShowColors(false); }}
                                    title={c.label}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: c.color,
                                        border: accent === c.value ? '3px solid var(--fg-primary)' : '2px solid transparent',
                                        cursor: 'pointer',
                                        outline: accent === c.value
                                            ? `2px solid ${c.color}`
                                            : 'none',
                                        outlineOffset: 2,
                                        transition: 'border 0.15s, outline 0.15s',
                                    }}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
