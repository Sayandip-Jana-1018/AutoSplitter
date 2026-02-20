'use client';

import { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
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

export default function BottomCTA() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-10% 0px' });

    return (
        <motion.section
            ref={ref}
            className={styles.ctaSection}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={stagger}
        >
            <motion.div className={styles.ctaBox} variants={fadeInUp}>
                <div className={styles.ctaGlow} />

                <motion.div variants={fadeInUp} style={{ position: 'relative', zIndex: 1, marginBottom: 12 }}>
                    <Sparkles size={36} style={{ color: 'var(--accent-400)', margin: '0 auto', display: 'block' }} />
                </motion.div>

                <motion.h2 className={styles.ctaTitle} variants={fadeInUp}>
                    Ready to split smarter?
                </motion.h2>
                <motion.p className={styles.ctaSubtitle} variants={fadeInUp}>
                    Join thousands who have permanently eliminated the awkward &ldquo;you owe me&rdquo; conversations.
                </motion.p>

                <motion.div variants={fadeInUp} style={{ position: 'relative', zIndex: 1 }}>
                    <Link href="/register">
                        <Button size="lg" className={styles.primaryCtaBtnOuter}>
                            Get Started Free
                            <ArrowRight size={18} style={{ marginLeft: 8 }} />
                        </Button>
                    </Link>
                </motion.div>

                <motion.div className={styles.ctaFeatures} variants={fadeInUp}>
                    <span><CheckCircle size={14} className={styles.checkIcon} /> Free forever</span>
                    <span><CheckCircle size={14} className={styles.checkIcon} /> Works offline</span>
                    <span><CheckCircle size={14} className={styles.checkIcon} /> Install as PWA</span>
                </motion.div>
            </motion.div>
        </motion.section>
    );
}
