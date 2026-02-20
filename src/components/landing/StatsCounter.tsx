'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { Users, Receipt, Wallet } from 'lucide-react';
import styles from '@/app/landing.module.css';

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

function useCounter(end: number, inView: boolean, duration = 2000) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [end, inView, duration]);
    return count;
}

const stats = [
    { icon: Users, value: 10000, suffix: '+', label: 'Happy Users', prefix: '' },
    { icon: Receipt, value: 50000, suffix: '+', label: 'Expenses Tracked', prefix: '' },
    { icon: Wallet, value: 200, suffix: 'Cr+', label: 'Amount Settled', prefix: '₹' },
];

function StatCard({ stat, inView }: { stat: typeof stats[number]; inView: boolean }) {
    const count = useCounter(stat.value, inView);
    return (
        <motion.div className={styles.statCard} variants={fadeInUp}>
            <div className={styles.statCardGlow} />
            <div className={styles.statCardIcon}>
                <stat.icon size={28} />
            </div>
            <div className={styles.statCardValue}>
                {stat.prefix}{count >= 1000 ? `${(count / 1000).toFixed(count >= stat.value ? 0 : 1)}K` : count}{stat.suffix}
            </div>
            <div className={styles.statCardLabel}>{stat.label}</div>
        </motion.div>
    );
}

export default function StatsCounter() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-10% 0px' });

    return (
        <motion.section
            ref={ref}
            className={styles.statsSection}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={stagger}
        >
            <div className={styles.statsGrid}>
                {stats.map((stat, i) => (
                    <StatCard key={i} stat={stat} inView={inView} />
                ))}
            </div>
        </motion.section>
    );
}
