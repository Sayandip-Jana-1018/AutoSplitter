'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';


type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType, options?: { duration?: number; action?: Toast['action'] }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

const ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={18} />,
    error: <AlertCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
};

const COLORS: Record<ToastType, string> = {
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    warning: 'var(--color-warning)',
    info: 'var(--color-info)',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback(
        (message: string, type: ToastType = 'info', options?: { duration?: number; action?: Toast['action'] }) => {
            const id = Math.random().toString(36).slice(2);
            setToasts((prev) => [...prev, { id, message, type, duration: options?.duration ?? 4000, action: options?.action }]);
        },
        []
    );

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            <div style={{
                position: 'fixed',
                top: 16,
                right: 16,
                zIndex: 'var(--z-toast)' as unknown as number,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                pointerEvents: 'none',
                maxWidth: 400,
            }}>
                <AnimatePresence mode="popLayout">
                    {toasts.map((t) => (
                        <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    useEffect(() => {
        if (toast.duration && toast.duration > 0) {
            const timer = setTimeout(onDismiss, toast.duration);
            return () => clearTimeout(timer);
        }
    }, [toast.duration, onDismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{
                pointerEvents: 'auto',
                background: 'var(--surface-popover)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xl)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: 'var(--shadow-lg)',
                minWidth: 280,
            }}
        >
            <span style={{ color: COLORS[toast.type], flexShrink: 0 }}>
                {ICONS[toast.type]}
            </span>
            <span style={{
                flex: 1,
                fontSize: 'var(--text-sm)',
                color: 'var(--fg-primary)',
                fontWeight: 500,
            }}>
                {toast.message}
            </span>
            {toast.action && (
                <button
                    onClick={() => { toast.action!.onClick(); onDismiss(); }}
                    style={{
                        color: 'var(--accent-500)',
                        fontWeight: 600,
                        fontSize: 'var(--text-sm)',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {toast.action.label}
                </button>
            )}
            <button
                onClick={onDismiss}
                style={{
                    color: 'var(--fg-tertiary)',
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    padding: 2,
                    display: 'flex',
                    flexShrink: 0,
                }}
            >
                <X size={14} />
            </button>
        </motion.div>
    );
}
