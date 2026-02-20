'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from '@/app/landing.module.css';

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.85, y: 30 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

/* Deterministic particle positions — avoids hydration mismatch from Math.random() */
const PARTICLES = [
    { left: 5, top: 12, delay: 0.0, dur: 4.2, size: 3 },
    { left: 15, top: 78, delay: 2.1, dur: 5.1, size: 2 },
    { left: 25, top: 35, delay: 0.8, dur: 3.8, size: 4 },
    { left: 35, top: 90, delay: 3.5, dur: 6.0, size: 3 },
    { left: 45, top: 22, delay: 1.2, dur: 4.5, size: 5 },
    { left: 55, top: 65, delay: 4.0, dur: 3.2, size: 2 },
    { left: 65, top: 8, delay: 0.5, dur: 5.5, size: 4 },
    { left: 75, top: 52, delay: 2.8, dur: 4.0, size: 3 },
    { left: 85, top: 40, delay: 1.6, dur: 6.2, size: 2 },
    { left: 92, top: 72, delay: 3.2, dur: 3.5, size: 5 },
    { left: 10, top: 55, delay: 4.5, dur: 4.8, size: 3 },
    { left: 30, top: 18, delay: 0.3, dur: 5.3, size: 4 },
    { left: 50, top: 85, delay: 2.5, dur: 3.6, size: 2 },
    { left: 70, top: 30, delay: 1.8, dur: 6.5, size: 3 },
    { left: 88, top: 15, delay: 3.8, dur: 4.1, size: 5 },
    { left: 20, top: 62, delay: 0.9, dur: 5.8, size: 2 },
    { left: 40, top: 5, delay: 4.2, dur: 3.4, size: 4 },
    { left: 60, top: 48, delay: 1.4, dur: 4.6, size: 3 },
    { left: 78, top: 88, delay: 2.3, dur: 5.0, size: 2 },
    { left: 95, top: 25, delay: 3.0, dur: 6.8, size: 4 },
];

export default function HeroSection() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
    const phoneRotateX = useTransform(scrollYProgress, [0, 0.5], [8, 0]);
    const phoneRotateY = useTransform(scrollYProgress, [0, 0.5], [-4, 0]);
    const phoneScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

    return (
        <section ref={ref} className={styles.heroSection} style={{ position: 'relative' }}>
            {/* Floating particles */}
            <div className={styles.heroParticles}>
                {PARTICLES.map((p, i) => (
                    <div key={i} className={styles.particle} style={{
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.dur}s`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                    }} />
                ))}
            </div>

            <motion.div
                className={styles.heroContent}
                style={{ y: heroY, opacity: heroOpacity }}
                initial="hidden"
                animate="visible"
                variants={stagger}
            >
                <motion.div className={styles.heroBadge} variants={fadeInUp}>
                    <span className={styles.heroBadgePulse} />
                    <Sparkles size={14} className={styles.heroBadgeIcon} />
                    <span>V-1.0 is here — Experience next-gen tracking</span>
                </motion.div>

                <motion.h1 className={styles.heroTitle} variants={fadeInUp}>
                    Split expenses{' '}
                    <span className={styles.heroGradient}>without the drama.</span>
                </motion.h1>

                <motion.p className={styles.heroSubtitle} variants={fadeInUp}>
                    The smartest way to track group expenses on trips. Auto-capture from UPI,
                    scan receipts instantly with AI, and settle up with one tap.
                </motion.p>

                <motion.div className={styles.heroCTAs} variants={fadeInUp}>
                    <Link href="/register">
                        <Button size="lg" className={styles.primaryCtaBtn}>
                            <span className={styles.ctaBtnShine} />
                            Start Splitting — Free
                            <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                        </Button>
                    </Link>
                    <Link href="#features">
                        <Button size="lg" variant="outline" className={styles.secondaryCtaBtn}>
                            See Features
                        </Button>
                    </Link>
                </motion.div>

                {/* 3D Floating Phone Mockup */}
                <motion.div
                    className={styles.phoneMockupWrapper}
                    variants={scaleIn}
                    style={{
                        rotateX: phoneRotateX,
                        rotateY: phoneRotateY,
                        scale: phoneScale,
                    }}
                >
                    <div className={styles.phoneMockup}>
                        <div className={styles.phoneNotch} />
                        <div className={styles.phoneScreen}>
                            {/* Transaction Cards inside phone */}
                            <motion.div
                                className={styles.phoneCard}
                                animate={{ y: [-3, 3, -3] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <div className={styles.phoneCardIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>🍕</div>
                                <div className={styles.phoneCardInfo}>
                                    <span className={styles.phoneCardTitle}>Dinner at BBQ Nation</span>
                                    <span className={styles.phoneCardMeta}>Sayan paid · ₹4,500</span>
                                </div>
                                <div className={`${styles.phoneCardBadge} ${styles.badgeGPay}`}>GPay</div>
                            </motion.div>

                            <motion.div
                                className={styles.phoneCard}
                                animate={{ y: [3, -3, 3] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                            >
                                <div className={styles.phoneCardIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>🚗</div>
                                <div className={styles.phoneCardInfo}>
                                    <span className={styles.phoneCardTitle}>Cab to Airport</span>
                                    <span className={styles.phoneCardMeta}>Aman paid · ₹1,200</span>
                                </div>
                                <div className={`${styles.phoneCardBadge} ${styles.badgeCash}`}>CASH</div>
                            </motion.div>

                            <motion.div
                                className={styles.phoneCard}
                                animate={{ y: [-2, 4, -2] }}
                                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
                            >
                                <div className={styles.phoneCardIcon} style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>🏨</div>
                                <div className={styles.phoneCardInfo}>
                                    <span className={styles.phoneCardTitle}>Hotel — 2 nights</span>
                                    <span className={styles.phoneCardMeta}>Priya paid · ₹8,900</span>
                                </div>
                                <div className={`${styles.phoneCardBadge} ${styles.badgePhonePe}`}>PhonePe</div>
                            </motion.div>

                            {/* Summary bar inside phone */}
                            <div className={styles.phoneSummary}>
                                <div className={styles.phoneSummaryItem}>
                                    <span className={styles.phoneSummaryLabel}>Total</span>
                                    <span className={styles.phoneSummaryValue}>₹14,600</span>
                                </div>
                                <div className={styles.phoneSummaryDivider} />
                                <div className={styles.phoneSummaryItem}>
                                    <span className={styles.phoneSummaryLabel}>Your share</span>
                                    <span className={styles.phoneSummaryValue} style={{ color: 'var(--accent-500)' }}>₹4,867</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Glow ring behind phone */}
                    <div className={styles.phoneGlow} />
                </motion.div>
            </motion.div>
        </section>
    );
}
