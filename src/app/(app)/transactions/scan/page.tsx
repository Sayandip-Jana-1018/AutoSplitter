'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera,
    Upload,
    ScanLine,
    Check,
    X,
    Loader2,
    FileText,
    Sparkles,
    ShieldCheck,
    RotateCcw,
    Smartphone,
    ImageIcon,
    Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { PaymentIcon, CategoryIcon, PAYMENT_ICONS } from '@/components/ui/Icons';
import { formatCurrency, cn } from '@/lib/utils';
import { parseTransactionText, type ParsedTransaction } from '@/lib/transactionParser';

type ScanState = 'idle' | 'loading' | 'result' | 'error';

/* ── Premium glass styles ── */
const glass = {
    background: 'var(--bg-glass)',
    backdropFilter: 'blur(20px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
    border: '1px solid var(--border-glass)',
};

/* ── Animation variants ── */
const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
};

const scaleIn = {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
};

const stagger = {
    animate: { transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
};

export default function ScanReceiptPage() {
    const router = useRouter();
    const cameraRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [progress, setProgress] = useState(0);
    const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [saving, setSaving] = useState(false);
    const [showCamera, setShowCamera] = useState(false);

    /* ── Live Camera via getUserMedia ── */
    const openLiveCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
            });
            streamRef.current = stream;
            setShowCamera(true);
            // Wait for video element to mount, then attach stream
            requestAnimationFrame(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(() => { });
                }
            });
        } catch {
            // getUserMedia not available — fall back to file input
            cameraRef.current?.click();
        }
    }, []);

    const captureFrame = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
                closeCamera();
                handleFile(file);
            }
        }, 'image/jpeg', 0.92);
    }, []);

    const closeCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
    }, []);

    const handleFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setErrorMsg('Please select an image file (JPG, PNG, etc.)');
            setScanState('error');
            return;
        }

        // File size check (max 15MB)
        if (file.size > 15 * 1024 * 1024) {
            setErrorMsg('Image too large. Please use an image under 15MB.');
            setScanState('error');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        setScanState('loading');
        setProgress(0);

        try {
            // Dynamic import to avoid SSR issues
            const Tesseract = await import('tesseract.js');
            const result = await Tesseract.recognize(file, 'eng', {
                logger: (m: { status: string; progress: number }) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                },
            });

            const text = result.data.text;
            if (!text.trim()) {
                setErrorMsg('Could not extract any text from this image. Try a clearer screenshot with better lighting.');
                setScanState('error');
                return;
            }

            const parsedResult = parseTransactionText(text);
            setParsed(parsedResult);
            setScanState('result');
        } catch (err) {
            console.error('OCR Error:', err);
            setErrorMsg('OCR processing failed. Check your connection and try again.');
            setScanState('error');
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const reset = () => {
        setScanState('idle');
        setProgress(0);
        setParsed(null);
        setPreview(null);
        setErrorMsg('');
        // Reset file inputs too
        if (cameraRef.current) cameraRef.current.value = '';
        if (galleryRef.current) galleryRef.current.value = '';
    };

    const handleSaveToExpense = async () => {
        if (!parsed) return;
        setSaving(true);
        const params = new URLSearchParams();
        if (parsed.amount) params.set('amount', String(parsed.amount / 100));
        if (parsed.merchant) params.set('title', parsed.merchant);
        if (parsed.method) params.set('method', parsed.method);
        router.push(`/transactions/new?${params.toString()}`);
    };

    const confidenceLabel = (c: number) =>
        c >= 0.7 ? 'High' : c >= 0.4 ? 'Medium' : 'Low';
    const confidenceVariant = (c: number): 'success' | 'warning' | 'error' =>
        c >= 0.7 ? 'success' : c >= 0.4 ? 'warning' : 'error';

    const STEPS = [
        { icon: '📸', text: 'Take photo or pick from gallery' },
        { icon: '🔍', text: 'AI extracts amount, merchant & method' },
        { icon: '✅', text: 'Review & save as expense' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 500, width: '100%', margin: '0 auto' }}>
            {/* ── Hidden file inputs: separate for Camera (with capture) and Gallery (without capture) ── */}
            <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                }}
            />
            <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                }}
            />

            <AnimatePresence mode="wait">
                {/* ═══════════════════════════════════════════ */}
                {/* ═══ IDLE STATE — Premium Upload Zone ═══ */}
                {/* ═══════════════════════════════════════════ */}
                {scanState === 'idle' && (
                    <motion.div
                        key="idle"
                        {...fadeUp}
                        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
                    >
                        {/* ── Hero Upload Zone ── */}
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={openLiveCamera}
                            onDragOver={(e: React.DragEvent) => e.preventDefault()}
                            onDrop={handleDrop}
                            style={{
                                ...glass,
                                borderRadius: 'var(--radius-2xl)',
                                border: '2px dashed rgba(var(--accent-500-rgb), 0.25)',
                                padding: 'var(--space-8) var(--space-4)',
                                textAlign: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                minHeight: 220,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 'var(--space-3)',
                            }}
                        >
                            {/* Gradient mesh overlay */}
                            <div style={{
                                position: 'absolute', inset: 0, borderRadius: 'inherit',
                                background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(var(--accent-500-rgb), 0.06) 0%, transparent 70%)',
                                pointerEvents: 'none',
                            }} />
                            {/* Top shimmer */}
                            <div style={{
                                position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
                                background: 'linear-gradient(90deg, transparent, rgba(var(--accent-500-rgb), 0.2), transparent)',
                                pointerEvents: 'none',
                            }} />

                            <motion.div
                                animate={{ y: [0, -8, 0] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                                style={{
                                    width: 72, height: 72, borderRadius: 'var(--radius-xl)',
                                    background: 'linear-gradient(135deg, rgba(var(--accent-500-rgb), 0.15), rgba(var(--accent-500-rgb), 0.05))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid rgba(var(--accent-500-rgb), 0.15)',
                                }}
                            >
                                <ScanLine size={32} style={{ color: 'var(--accent-400)' }} />
                            </motion.div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <p style={{
                                    fontWeight: 700, fontSize: 'var(--text-base)',
                                    marginBottom: 4, color: 'var(--fg-primary)',
                                }}>
                                    Drop or tap to scan
                                </p>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', lineHeight: 1.5 }}>
                                    GPay · PhonePe · Paytm · Bank SMS · UPI receipts
                                </p>
                            </div>
                        </motion.div>

                        {/* ── Camera & Gallery Buttons ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={openLiveCamera}
                                style={{
                                    ...glass,
                                    borderRadius: 'var(--radius-xl)',
                                    padding: 'var(--space-4)',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', gap: 'var(--space-2)',
                                    cursor: 'pointer', border: '1px solid rgba(var(--accent-500-rgb), 0.12)',
                                    background: 'linear-gradient(135deg, rgba(var(--accent-500-rgb), 0.06), var(--bg-glass))',
                                }}
                            >
                                <div style={{
                                    width: 44, height: 44, borderRadius: 'var(--radius-lg)',
                                    background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 14px rgba(var(--accent-500-rgb), 0.3)',
                                }}>
                                    <Camera size={20} style={{ color: 'white' }} />
                                </div>
                                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--fg-primary)' }}>Camera</span>
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>Take a photo</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => galleryRef.current?.click()}
                                style={{
                                    ...glass,
                                    borderRadius: 'var(--radius-xl)',
                                    padding: 'var(--space-4)',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', gap: 'var(--space-2)',
                                    cursor: 'pointer', border: '1px solid rgba(var(--accent-500-rgb), 0.12)',
                                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.06), var(--bg-glass))',
                                }}
                            >
                                <div style={{
                                    width: 44, height: 44, borderRadius: 'var(--radius-lg)',
                                    background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)',
                                }}>
                                    <ImageIcon size={20} style={{ color: 'white' }} />
                                </div>
                                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--fg-primary)' }}>Gallery</span>
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>Pick a screenshot</span>
                            </motion.button>
                        </div>

                        {/* ── How it works ── */}
                        <motion.div variants={stagger} initial="initial" animate="animate">
                            <div style={{
                                ...glass,
                                borderRadius: 'var(--radius-xl)',
                                padding: 'var(--space-4)',
                            }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 'var(--space-3)',
                                }}>
                                    <Zap size={14} style={{ color: 'var(--accent-400)' }} />
                                    <span style={{
                                        fontSize: 'var(--text-xs)', fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: '0.05em',
                                        color: 'var(--accent-400)',
                                    }}>How it works</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                    {STEPS.map((step, i) => (
                                        <motion.div
                                            key={i}
                                            variants={staggerItem}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)',
                                            }}
                                        >
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 'var(--radius-lg)',
                                                background: 'rgba(var(--accent-500-rgb), 0.08)',
                                                border: '1px solid rgba(var(--accent-500-rgb), 0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '14px', flexShrink: 0,
                                            }}>
                                                {step.icon}
                                            </div>
                                            <span style={{
                                                fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)',
                                                fontWeight: 500,
                                            }}>
                                                {step.text}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* ── Supported Formats as pills ── */}
                        <div style={{
                            ...glass,
                            borderRadius: 'var(--radius-xl)',
                            padding: 'var(--space-4)',
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 'var(--space-3)',
                            }}>
                                <ShieldCheck size={14} style={{ color: 'var(--color-success)' }} />
                                <span style={{
                                    fontSize: 'var(--text-xs)', fontWeight: 700,
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                    color: 'var(--fg-tertiary)',
                                }}>Supported Formats</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                                {Object.entries(PAYMENT_ICONS).map(([key, val]) => (
                                    <span
                                        key={key}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            fontSize: 'var(--text-xs)', fontWeight: 600,
                                            color: val.color,
                                            background: `${val.color}10`,
                                            padding: '6px 12px',
                                            borderRadius: 'var(--radius-full)',
                                            border: `1px solid ${val.color}20`,
                                        }}
                                    >
                                        <PaymentIcon method={key} size={14} />
                                        {val.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* ── Privacy Note ── */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 6, padding: 'var(--space-2)',
                        }}>
                            <ShieldCheck size={12} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-muted)' }}>
                                All processing happens on your device — nothing leaves your phone
                            </span>
                        </div>
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════════ */}
                {/* ═══ LOADING STATE — Premium Scanner ═══ */}
                {/* ═══════════════════════════════════════════ */}
                {scanState === 'loading' && (
                    <motion.div key="loading" {...scaleIn}>
                        <div style={{
                            ...glass,
                            borderRadius: 'var(--radius-2xl)',
                            padding: 'var(--space-5)',
                            textAlign: 'center',
                            overflow: 'hidden',
                            position: 'relative',
                        }}>
                            {/* Image preview with scan line overlay */}
                            {preview && (
                                <div style={{
                                    position: 'relative',
                                    width: '100%', maxHeight: 200,
                                    overflow: 'hidden',
                                    borderRadius: 'var(--radius-xl)',
                                    marginBottom: 'var(--space-4)',
                                }}>
                                    <img
                                        src={preview}
                                        alt="Receipt preview"
                                        style={{
                                            width: '100%', objectFit: 'cover',
                                            filter: 'brightness(0.7)',
                                        }}
                                    />
                                    {/* Animated scan line */}
                                    <motion.div
                                        animate={{ top: ['0%', '90%', '0%'] }}
                                        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                                        style={{
                                            position: 'absolute', left: '5%', right: '5%',
                                            height: 3,
                                            background: 'linear-gradient(90deg, transparent, var(--accent-400), var(--accent-500), var(--accent-400), transparent)',
                                            borderRadius: 2,
                                            boxShadow: '0 0 20px var(--accent-500), 0 0 60px rgba(var(--accent-500-rgb), 0.3)',
                                        }}
                                    />
                                    {/* Corner brackets */}
                                    <div style={{
                                        position: 'absolute', inset: 12,
                                        border: '2px solid rgba(var(--accent-500-rgb), 0.4)',
                                        borderRadius: 'var(--radius-lg)',
                                        pointerEvents: 'none',
                                    }} />
                                </div>
                            )}

                            {/* Spinner */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                                style={{ display: 'inline-block', marginBottom: 'var(--space-3)' }}
                            >
                                <Loader2 size={28} style={{ color: 'var(--accent-400)' }} />
                            </motion.div>
                            <p style={{
                                fontWeight: 700, fontSize: 'var(--text-base)',
                                marginBottom: 4, color: 'var(--fg-primary)',
                            }}>
                                Scanning your receipt...
                            </p>
                            <p style={{
                                fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)',
                                marginBottom: 'var(--space-4)',
                            }}>
                                AI is reading text from your image
                            </p>

                            {/* Premium progress bar */}
                            <div style={{
                                width: '100%', height: 8,
                                background: 'rgba(var(--accent-500-rgb), 0.08)',
                                borderRadius: 'var(--radius-full)',
                                overflow: 'hidden',
                                position: 'relative',
                            }}>
                                <motion.div
                                    style={{
                                        height: '100%',
                                        background: 'linear-gradient(90deg, var(--accent-600), var(--accent-400), var(--accent-500))',
                                        borderRadius: 'var(--radius-full)',
                                        boxShadow: '0 0 12px rgba(var(--accent-500-rgb), 0.4)',
                                    }}
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                />
                            </div>
                            <p style={{
                                fontSize: 'var(--text-xs)', color: 'var(--accent-400)',
                                marginTop: 8, fontWeight: 600,
                            }}>
                                {progress}% complete
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════════ */}
                {/* ═══ RESULT STATE — Premium Data Card ═══ */}
                {/* ═══════════════════════════════════════════ */}
                {scanState === 'result' && parsed && (
                    <motion.div
                        key="result"
                        {...fadeUp}
                        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
                    >
                        {/* ── Confidence Banner ── */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                ...glass,
                                borderRadius: 'var(--radius-xl)',
                                padding: 'var(--space-3) var(--space-4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Sparkles size={16} style={{ color: 'var(--accent-400)' }} />
                                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--fg-primary)' }}>
                                    Extracted Data
                                </span>
                            </div>
                            <Badge variant={confidenceVariant(parsed.confidence)} size="sm">
                                {confidenceLabel(parsed.confidence)} · {Math.round(parsed.confidence * 100)}%
                            </Badge>
                        </motion.div>

                        {/* ── Main Data Card ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div style={{
                                ...glass,
                                borderRadius: 'var(--radius-2xl)',
                                overflow: 'hidden',
                                boxShadow: parsed.confidence >= 0.7
                                    ? '0 0 30px rgba(var(--accent-500-rgb), 0.1), var(--shadow-card)'
                                    : 'var(--shadow-card)',
                                position: 'relative',
                            }}>
                                {/* Top glow edge */}
                                <div style={{
                                    position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
                                    background: 'linear-gradient(90deg, transparent, rgba(var(--accent-500-rgb), 0.3), transparent)',
                                    pointerEvents: 'none',
                                }} />

                                {/* Amount hero */}
                                <div style={{
                                    padding: 'var(--space-5) var(--space-4) var(--space-3)',
                                    background: 'linear-gradient(135deg, rgba(var(--accent-500-rgb), 0.06), transparent)',
                                    textAlign: 'center',
                                }}>
                                    <p style={{
                                        fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)',
                                        fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                                        marginBottom: 4,
                                    }}>Amount Detected</p>
                                    <p style={{
                                        fontSize: 'clamp(1.8rem, 8vw, 2.5rem)',
                                        fontWeight: 800,
                                        background: parsed.amount
                                            ? 'linear-gradient(135deg, var(--fg-primary), var(--accent-400))'
                                            : 'linear-gradient(135deg, var(--color-error), #f87171)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}>
                                        {parsed.amount ? formatCurrency(parsed.amount) : '—'}
                                    </p>
                                </div>

                                {/* Detail rows */}
                                <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-4)' }}>
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                                        gap: 'var(--space-3)',
                                    }}>
                                        {/* Merchant */}
                                        <div style={{
                                            background: 'rgba(var(--accent-500-rgb), 0.04)',
                                            borderRadius: 'var(--radius-lg)',
                                            padding: 'var(--space-3)',
                                        }}>
                                            <p style={{
                                                fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)',
                                                fontWeight: 600, marginBottom: 4,
                                            }}>Merchant</p>
                                            <p style={{
                                                fontSize: 'var(--text-sm)', fontWeight: 600,
                                                color: 'var(--fg-primary)',
                                                wordBreak: 'break-word',
                                            }}>
                                                {parsed.merchant || '—'}
                                            </p>
                                        </div>

                                        {/* Payment Method */}
                                        <div style={{
                                            background: 'rgba(var(--accent-500-rgb), 0.04)',
                                            borderRadius: 'var(--radius-lg)',
                                            padding: 'var(--space-3)',
                                        }}>
                                            <p style={{
                                                fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)',
                                                fontWeight: 600, marginBottom: 4,
                                            }}>Method</p>
                                            {parsed.method ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                    <PaymentIcon method={parsed.method} size={18} />
                                                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--fg-primary)' }}>
                                                        {PAYMENT_ICONS[parsed.method]?.label || parsed.method}
                                                    </span>
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--fg-muted)', fontSize: 'var(--text-sm)' }}>—</span>
                                            )}
                                        </div>

                                        {/* UPI Ref */}
                                        {parsed.upiRef && (
                                            <div style={{
                                                gridColumn: '1 / -1',
                                                background: 'rgba(var(--accent-500-rgb), 0.04)',
                                                borderRadius: 'var(--radius-lg)',
                                                padding: 'var(--space-3)',
                                            }}>
                                                <p style={{
                                                    fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)',
                                                    fontWeight: 600, marginBottom: 4,
                                                }}>UPI Reference</p>
                                                <p style={{
                                                    fontSize: 'var(--text-sm)', fontWeight: 600,
                                                    fontFamily: 'var(--font-mono)',
                                                    color: 'var(--fg-primary)',
                                                    letterSpacing: '0.05em',
                                                }}>
                                                    {parsed.upiRef}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* ── Raw Text (collapsible) ── */}
                        <details style={{ cursor: 'pointer' }}>
                            <summary style={{
                                fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)',
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: 'var(--space-2) 0',
                                fontWeight: 600,
                            }}>
                                <FileText size={12} />
                                View raw OCR text
                            </summary>
                            <div style={{
                                ...glass,
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--space-3)',
                                marginTop: 4,
                            }}>
                                <pre style={{
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--fg-secondary)',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    fontFamily: 'var(--font-mono)',
                                    maxHeight: 150, overflow: 'auto',
                                    margin: 0,
                                }}>
                                    {parsed.rawText}
                                </pre>
                            </div>
                        </details>

                        {/* ── Actions ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleSaveToExpense}
                                disabled={saving}
                                style={{
                                    width: '100%',
                                    padding: 'var(--space-4)',
                                    borderRadius: 'var(--radius-xl)',
                                    background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: 'var(--text-sm)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    boxShadow: '0 4px 20px rgba(var(--accent-500-rgb), 0.3)',
                                    opacity: saving ? 0.7 : 1,
                                }}
                            >
                                {saving ? (
                                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                ) : (
                                    <Check size={18} />
                                )}
                                {saving ? 'Opening...' : 'Add as Expense'}
                            </motion.button>

                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={reset}
                                    style={{
                                        flex: 1,
                                        padding: 'var(--space-3)',
                                        borderRadius: 'var(--radius-lg)',
                                        ...glass,
                                        color: 'var(--fg-secondary)',
                                        fontWeight: 600,
                                        fontSize: 'var(--text-sm)',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    }}
                                >
                                    <RotateCcw size={14} />
                                    Scan Another
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={reset}
                                    style={{
                                        width: 44, height: 44,
                                        borderRadius: 'var(--radius-lg)',
                                        ...glass,
                                        color: 'var(--color-error)',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <X size={18} />
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════════ */}
                {/* ═══ ERROR STATE — Friendly Retry ═══ */}
                {/* ═══════════════════════════════════════════ */}
                {scanState === 'error' && (
                    <motion.div key="error" {...scaleIn}>
                        <div style={{
                            ...glass,
                            borderRadius: 'var(--radius-2xl)',
                            padding: 'var(--space-6) var(--space-4)',
                            textAlign: 'center',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: 'var(--space-3)',
                        }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: 'var(--radius-xl)',
                                background: 'rgba(239, 68, 68, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid rgba(239, 68, 68, 0.15)',
                            }}>
                                <X size={28} style={{ color: 'var(--color-error)' }} />
                            </div>
                            <div>
                                <p style={{
                                    fontWeight: 700, fontSize: 'var(--text-base)',
                                    color: 'var(--fg-primary)', marginBottom: 4,
                                }}>
                                    Scan Failed
                                </p>
                                <p style={{
                                    fontSize: 'var(--text-sm)', color: 'var(--fg-tertiary)',
                                    maxWidth: 280, lineHeight: 1.5,
                                }}>
                                    {errorMsg}
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={reset}
                                style={{
                                    padding: 'var(--space-3) var(--space-6)',
                                    borderRadius: 'var(--radius-xl)',
                                    background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: 'var(--text-sm)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    boxShadow: '0 4px 16px rgba(var(--accent-500-rgb), 0.3)',
                                    marginTop: 4,
                                }}
                            >
                                <RotateCcw size={14} />
                                Try Again
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ LIVE CAMERA VIEWFINDER OVERLAY ═══ */}
            <AnimatePresence>
                {showCamera && (
                    <motion.div
                        key="camera-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            background: 'rgba(0,0,0,0.95)',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        {/* Close button */}
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={closeCamera}
                            style={{
                                position: 'absolute', top: 16, right: 16, zIndex: 10,
                                width: 44, height: 44, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', cursor: 'pointer',
                            }}
                        >
                            <X size={20} />
                        </motion.button>

                        {/* Title */}
                        <div style={{
                            position: 'absolute', top: 20, left: 0, right: 0,
                            textAlign: 'center', color: 'white', fontWeight: 700,
                            fontSize: 'var(--text-base)', zIndex: 5,
                        }}>
                            📸 Scan Receipt
                        </div>

                        {/* Video + Scan guide wrapper */}
                        <div style={{
                            position: 'relative',
                            width: '100%', maxWidth: 500,
                            margin: '0 auto',
                        }}>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: '100%', height: 'auto',
                                    borderRadius: 'var(--radius-2xl)',
                                    objectFit: 'cover',
                                    display: 'block',
                                    border: '2px solid rgba(var(--accent-500-rgb), 0.3)',
                                    boxShadow: '0 0 40px rgba(var(--accent-500-rgb), 0.15)',
                                }}
                            />
                            {/* Scan guide — positioned INSIDE the video wrapper */}
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '75%', maxWidth: 280,
                                aspectRatio: '4/3',
                                border: '2px dashed rgba(var(--accent-500-rgb), 0.5)',
                                borderRadius: 'var(--radius-xl)',
                                pointerEvents: 'none',
                                boxShadow: '0 0 0 4000px rgba(0,0,0,0.25)',
                            }} />
                        </div>

                        {/* Capture button */}
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={captureFrame}
                            style={{
                                marginTop: 'var(--space-6)',
                                width: 72, height: 72, borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
                                border: '4px solid rgba(255,255,255,0.3)',
                                cursor: 'pointer',
                                boxShadow: '0 4px 24px rgba(var(--accent-500-rgb), 0.5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <Camera size={28} style={{ color: 'white' }} />
                        </motion.button>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--text-xs)', marginTop: 8 }}>
                            Tap to capture
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}
