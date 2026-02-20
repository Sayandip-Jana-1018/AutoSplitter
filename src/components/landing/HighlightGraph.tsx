'use client';

import { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { RefreshCw, Wallet } from 'lucide-react';
import styles from '@/app/landing.module.css';

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const drawLine: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1, transition: { duration: 1.5, ease: 'easeInOut' } },
};

/* 5 colorful nodes positioned clearly */
const NODES = [
    { id: 'S', label: 'Sayan', x: 50, y: 12, color: '#10b981', bg: '#ecfdf5' },
    { id: 'P', label: 'Priya', x: 10, y: 45, color: '#a855f7', bg: '#faf5ff' },
    { id: 'A', label: 'Aman', x: 90, y: 45, color: '#3b82f6', bg: '#eff6ff' },
    { id: 'R', label: 'Rahul', x: 20, y: 85, color: '#f59e0b', bg: '#fffbeb' },
    { id: 'N', label: 'Neha', x: 80, y: 85, color: '#ec4899', bg: '#fdf2f8' },
];

/* Old messy debts — dashed gray */
const OLD_EDGES = [
    'M 50 20 Q 30 32 15 43',
    'M 15 50 Q 50 50 85 43',
    'M 85 50 Q 55 65 25 82',
    'M 25 85 Q 50 90 75 85',
    'M 50 20 Q 70 32 85 43',
];

/* New simplified transfers — bold colored curves */
const OPT_EDGES = [
    { d: 'M 50 20 C 65 28 78 36 85 43', color: '#10b981', markerColor: 'green' },
    { d: 'M 25 82 C 45 80 60 82 75 82', color: '#f59e0b', markerColor: 'amber' },
];

export default function HighlightGraph() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-10% 0px' });

    return (
        <motion.section
            ref={ref}
            className={`${styles.highlightSection} ${styles.highlightSectionReverse}`}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={stagger}
        >
            <div className={styles.highlightGrid}>
                <motion.div className={styles.highlightText} variants={fadeInUp}>
                    <div className={styles.highlightTag}><RefreshCw size={16} /> Smart Math</div>
                    <h2 className={styles.sectionTitle}>
                        Settle debts in one tap, not fifty.
                    </h2>
                    <p className={styles.sectionSubtitle}>
                        5 friends. 12 transactions. Our graph algorithm reduces it all to just 2 transfers.
                        Minimum hassle, maximum clarity.
                    </p>
                    <div className={styles.smartBadge}>
                        <Wallet size={20} />
                        <div>
                            <span style={{ display: 'block', fontWeight: 700, fontSize: 13 }}>Deep-Link UPI</span>
                            <span style={{ display: 'block', fontSize: 12, color: 'var(--fg-tertiary)' }}>Launch GPay/PhonePe automatically</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div className={styles.highlightVisualOuter} variants={fadeInUp}>
                    <div className={styles.highlightVisual} style={{
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.04), rgba(168,85,247,0.04), rgba(236,72,153,0.04))',
                    }}>
                        <div className={styles.graphMockup}>

                            <svg className={styles.graphSvg} viewBox="0 0 100 100">
                                <defs>
                                    <marker id="arrGreen" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                                    </marker>
                                    <marker id="arrAmber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                                    </marker>
                                    <linearGradient id="gradGreen" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#3b82f6" />
                                    </linearGradient>
                                    <linearGradient id="gradAmber" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#f59e0b" />
                                        <stop offset="100%" stopColor="#ec4899" />
                                    </linearGradient>
                                </defs>

                                {/* Old debts — faded dashed */}
                                {OLD_EDGES.map((d, i) => (
                                    <motion.path
                                        key={`old-${i}`}
                                        d={d}
                                        stroke="var(--fg-muted)"
                                        strokeWidth="0.8"
                                        strokeDasharray="2 2"
                                        fill="transparent"
                                        opacity={0.2}
                                        variants={drawLine}
                                    />
                                ))}

                                {/* Optimized bold curved arrows */}
                                <motion.path
                                    d={OPT_EDGES[0].d}
                                    stroke="url(#gradGreen)"
                                    strokeWidth="3"
                                    fill="transparent"
                                    strokeLinecap="round"
                                    markerEnd="url(#arrGreen)"
                                    variants={drawLine}
                                />
                                <motion.path
                                    d={OPT_EDGES[1].d}
                                    stroke="url(#gradAmber)"
                                    strokeWidth="3"
                                    fill="transparent"
                                    strokeLinecap="round"
                                    markerEnd="url(#arrAmber)"
                                    variants={drawLine}
                                />
                            </svg>

                            {/* Colorful nodes with glow rings */}
                            {NODES.map((n, idx) => (
                                <motion.div
                                    key={n.id}
                                    className={styles.graphNode}
                                    style={{
                                        top: `${n.y}%`, left: `${n.x}%`,
                                        transform: 'translate(-50%, -50%)',
                                        borderColor: n.color,
                                        background: n.bg,
                                        color: n.color,
                                    }}
                                    animate={{
                                        boxShadow: [
                                            `0 0 0 0px ${n.color}40`,
                                            `0 0 0 10px ${n.color}00`,
                                            `0 0 0 0px ${n.color}40`,
                                        ],
                                    }}
                                    transition={{ duration: 2.5, repeat: Infinity, delay: idx * 0.4 }}
                                >
                                    {n.id}
                                </motion.div>
                            ))}

                            {/* Tooltip 1 */}
                            <motion.div
                                className={styles.graphTooltip}
                                style={{ top: '25%', left: '60%' }}
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
                                transition={{ duration: 0.5, delay: 1.5, type: 'spring', stiffness: 200 }}
                            >
                                <span style={{ fontWeight: 700, color: '#10b981', fontSize: 11 }}>Sayan → Aman</span>
                                <span style={{ fontWeight: 800, fontSize: 17 }}>₹400</span>
                            </motion.div>

                            {/* Tooltip 2 */}
                            <motion.div
                                className={styles.graphTooltip}
                                style={{ bottom: '3%', left: '32%', top: 'auto' }}
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
                                transition={{ duration: 0.5, delay: 2, type: 'spring', stiffness: 200 }}
                            >
                                <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: 11 }}>Rahul → Neha</span>
                                <span style={{ fontWeight: 800, fontSize: 17 }}>₹250</span>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.section>
    );
}
