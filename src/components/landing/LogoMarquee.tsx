'use client';

import { motion, Variants } from 'framer-motion';
import styles from '@/app/landing.module.css';

const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
};

const BRANDS = ['Google Pay', 'PhonePe', 'Paytm', 'CRED', 'HDFC', 'SBI', 'ICICI', 'Axis Bank', 'Razorpay', 'UPI'];

export default function LogoMarquee() {
    return (
        <motion.section
            className={styles.logoSection}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
        >
            <p className={styles.logoTitle}>
                SEAMLESSLY INTEGRATES WITH PAYMENT ALERTS FROM
            </p>
            <div className={styles.logoMarquee}>
                <div className={styles.logoTrack}>
                    {[...BRANDS, ...BRANDS].map((b, i) => (
                        <span key={i}>
                            {b}
                            <span className={styles.dot}>•</span>
                        </span>
                    ))}
                </div>
            </div>
        </motion.section>
    );
}
