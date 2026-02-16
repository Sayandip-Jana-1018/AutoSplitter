'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Check, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import { CATEGORIES, PAYMENT_METHODS, formatCurrency, toPaise, cn } from '@/lib/utils';
import styles from './quickadd.module.css';

const MOCK_MEMBERS = [
    { id: '1', name: 'Sayan Das (You)' },
    { id: '2', name: 'Aman Singh' },
    { id: '3', name: 'Priya Gupta' },
    { id: '4', name: 'Rahul Verma' },
];

export default function QuickAddPage() {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('general');
    const [method, setMethod] = useState('cash');
    const [payerId, setPayerId] = useState('1');
    const [showCategories, setShowCategories] = useState(false);
    const [showPayers, setShowPayers] = useState(false);
    const [showMethods, setShowMethods] = useState(false);
    const [saving, setSaving] = useState(false);

    const numericAmount = parseFloat(amount) || 0;
    const splitPerPerson = MOCK_MEMBERS.length > 0
        ? formatCurrency(toPaise(numericAmount / MOCK_MEMBERS.length))
        : '₹0';

    const handleNumPad = useCallback((key: string) => {
        if (key === 'del') {
            setAmount((prev) => prev.slice(0, -1));
        } else if (key === '.') {
            if (!amount.includes('.')) {
                setAmount((prev) => (prev || '0') + '.');
            }
        } else {
            // Limit: max 7 digits before decimal, 2 after
            const parts = amount.split('.');
            if (parts[1] && parts[1].length >= 2) return;
            if (!parts[1] && parts[0] && parts[0].length >= 7) return;
            setAmount((prev) => {
                if (prev === '0' && key !== '.') return key;
                return prev + key;
            });
        }
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(10);
    }, [amount]);

    const handleSave = async () => {
        if (!numericAmount || !title.trim()) return;
        setSaving(true);

        // TODO: API call
        await new Promise((r) => setTimeout(r, 500));

        setSaving(false);
        router.push('/transactions');
    };

    const payerName = MOCK_MEMBERS.find((m) => m.id === payerId)?.name || 'Select';
    const catData = CATEGORIES[category];
    const methodData = PAYMENT_METHODS[method];

    return (
        <div className={styles.quickAdd}>
            {/* ── Amount Display ── */}
            <div className={styles.amountDisplay}>
                <span className={styles.currencySign}>₹</span>
                <motion.div
                    className={cn(styles.amountValue, !amount && styles.placeholder)}
                    key={amount || 'placeholder'}
                    initial={{ scale: 0.95, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                    {amount || '0'}
                </motion.div>
            </div>

            {/* ── Title ── */}
            <input
                className={styles.titleInput}
                placeholder="What was this for?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
            />

            {/* ── Meta Row: Category / Payer / Method chips ── */}
            <div className={styles.metaRow}>
                <button
                    className={cn(styles.chip)}
                    onClick={() => setShowCategories(true)}
                >
                    <span>{catData.emoji}</span>
                    {catData.label}
                    <ChevronDown size={14} />
                </button>

                <button
                    className={cn(styles.chip)}
                    onClick={() => setShowPayers(true)}
                >
                    👤 {payerName.split(' ')[0]}
                    <ChevronDown size={14} />
                </button>

                <button
                    className={cn(styles.chip)}
                    onClick={() => setShowMethods(true)}
                >
                    {methodData.emoji} {methodData.label}
                    <ChevronDown size={14} />
                </button>
            </div>

            {/* ── Split Info ── */}
            {numericAmount > 0 && (
                <motion.div
                    className={styles.splitInfo}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    Split equally: <span className={styles.splitAmount}>{splitPerPerson}</span> / person
                    ({MOCK_MEMBERS.length} people)
                </motion.div>
            )}

            {/* ── Numpad ── */}
            <div className={styles.numpad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'].map((key) => (
                    <motion.button
                        key={key}
                        className={cn(
                            styles.numKey,
                            key === 'del' && styles.numKeyDelete,
                        )}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleNumPad(key)}
                    >
                        {key === 'del' ? <Delete size={22} /> : key}
                    </motion.button>
                ))}
            </div>

            {/* ── Submit ── */}
            <div className={styles.submitBtn}>
                <Button
                    fullWidth
                    size="lg"
                    disabled={!numericAmount || !title.trim()}
                    loading={saving}
                    leftIcon={<Check size={18} />}
                    onClick={handleSave}
                >
                    Add Expense · {numericAmount > 0 ? formatCurrency(toPaise(numericAmount)) : '₹0'}
                </Button>
            </div>

            {/* ── Category Picker Modal ── */}
            <Modal
                isOpen={showCategories}
                onClose={() => setShowCategories(false)}
                title="Category"
                size="small"
            >
                <div className={styles.categoryGrid}>
                    {Object.entries(CATEGORIES).map(([key, val]) => (
                        <motion.button
                            key={key}
                            className={cn(
                                styles.categoryItem,
                                category === key && styles.categoryItemActive,
                            )}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => { setCategory(key); setShowCategories(false); }}
                        >
                            <span className={styles.categoryEmoji}>{val.emoji}</span>
                            <span className={styles.categoryLabel}>{val.label}</span>
                        </motion.button>
                    ))}
                </div>
            </Modal>

            {/* ── Payer Picker Modal ── */}
            <Modal
                isOpen={showPayers}
                onClose={() => setShowPayers(false)}
                title="Who paid?"
                size="small"
            >
                <div className={styles.payerGrid}>
                    {MOCK_MEMBERS.map((member) => (
                        <motion.button
                            key={member.id}
                            className={cn(
                                styles.payerItem,
                                payerId === member.id && styles.payerItemActive,
                            )}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { setPayerId(member.id); setShowPayers(false); }}
                        >
                            <Avatar name={member.name} size="sm" />
                            <span className={styles.payerName}>{member.name}</span>
                            {payerId === member.id && (
                                <Check size={16} style={{ marginLeft: 'auto', color: 'var(--accent-500)' }} />
                            )}
                        </motion.button>
                    ))}
                </div>
            </Modal>

            {/* ── Method Picker Modal ── */}
            <Modal
                isOpen={showMethods}
                onClose={() => setShowMethods(false)}
                title="Payment Method"
                size="small"
            >
                <div className={styles.payerGrid}>
                    {Object.entries(PAYMENT_METHODS).map(([key, val]) => (
                        <motion.button
                            key={key}
                            className={cn(
                                styles.payerItem,
                                method === key && styles.payerItemActive,
                            )}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { setMethod(key); setShowMethods(false); }}
                        >
                            <span style={{ fontSize: 24 }}>{val.emoji}</span>
                            <span className={styles.payerName}>{val.label}</span>
                            {method === key && (
                                <Check size={16} style={{ marginLeft: 'auto', color: 'var(--accent-500)' }} />
                            )}
                        </motion.button>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
