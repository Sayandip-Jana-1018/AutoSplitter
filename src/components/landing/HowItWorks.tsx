'use client';

import { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { PlusCircle, Receipt, Send } from 'lucide-react';
import styles from '@/app/landing.module.css';

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

const steps = [
    {
        num: '01',
        icon: PlusCircle,
        title: 'Create a Trip',
        desc: 'Set up your trip, add your crew, and you\'re ready. Takes under 10 seconds.',
        gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    },
    {
        num: '02',
        icon: Receipt,
        title: 'Log Expenses',
        desc: 'Auto-capture from UPI alerts, scan receipts with AI, or add manually. Your call.',
        gradient: 'linear-gradient(135deg, #a855f7, #ec4899)',
    },
    {
        num: '03',
        icon: Send,
        title: 'Settle Up',
        desc: 'Our algorithm calculates the fewest transfers needed. One tap to pay via UPI.',
        gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    },
];

export default function HowItWorks() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-10% 0px' });

    return (
        <motion.section
            ref={ref}
            className={styles.howSection}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={stagger}
        >
            <div className={styles.sectionHeader}>
                <motion.div className={styles.heroBadge} variants={fadeInUp} style={{ margin: '0 auto 16px' }}>
                    How it works
                </motion.div>
                <motion.h2 className={styles.sectionTitle} variants={fadeInUp}>
                    Three steps. Zero friction.
                </motion.h2>
            </div>

            <div className={styles.howGrid}>
                {/* Connecting line */}
                <div className={styles.howConnector}>
                    <motion.div
                        className={styles.howConnectorFill}
                        initial={{ scaleX: 0 }}
                        animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
                        transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                </div>

                {steps.map((step, i) => (
                    <motion.div key={i} className={styles.howCard} variants={fadeInUp}>
                        <div className={styles.howNumWrapper}>
                            <span className={styles.howNum}>{step.num}</span>
                            <div className={styles.howNumGlow} />
                        </div>
                        <div className={styles.howIconBox} style={{ background: step.gradient }}>
                            <step.icon size={24} color="#fff" />
                        </div>
                        <h3 className={styles.howTitle}>{step.title}</h3>
                        <p className={styles.howDesc}>{step.desc}</p>
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
}
