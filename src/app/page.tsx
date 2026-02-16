'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Zap, Users, Receipt, PieChart, Shield, Smartphone } from 'lucide-react';
import Button from '@/components/ui/Button';
import ThemeSelector from '@/components/features/ThemeSelector';
import styles from './landing.module.css';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const FEATURES = [
  {
    icon: <Zap size={24} />,
    title: 'Ultra-Fast Entry',
    desc: 'Add expenses in under 3 seconds. Big numpad, one-tap payer, instant split calculation.',
  },
  {
    icon: <Users size={24} />,
    title: 'Smart Groups',
    desc: 'Create groups, invite via link or QR. Everyone stays synced in real-time.',
  },
  {
    icon: <Receipt size={24} />,
    title: 'Receipt OCR',
    desc: 'Snap a photo of any receipt. AI extracts amount, date, and merchant automatically.',
  },
  {
    icon: <PieChart size={24} />,
    title: 'Min Transfers',
    desc: 'Our algorithm calculates the minimum number of payments needed to settle all debts.',
  },
  {
    icon: <Shield size={24} />,
    title: 'Privacy First',
    desc: 'Your data stays yours. On-device processing, encrypted storage, transparent controls.',
  },
  {
    icon: <Smartphone size={24} />,
    title: 'Works Everywhere',
    desc: 'Installable PWA. Works on Android, iOS, and desktop. Even works offline.',
  },
];

const STEPS = [
  { num: 1, title: 'Create a Group', desc: 'Add your friends, share the invite link. Everyone joins in one tap.' },
  { num: 2, title: 'Log Expenses', desc: 'Paid for dinner? Add it in 3 seconds. Cash, GPay, PhonePe — all tracked.' },
  { num: 3, title: 'Auto Settle', desc: 'See exactly who owes whom. Minimal transfers. One-tap UPI request links.' },
];

const DEMO_TRANSACTIONS = [
  { emoji: '🍕', label: 'Pizza Night', amount: '₹860', method: 'GPay' },
  { emoji: '⛽', label: 'Fuel Stop', amount: '₹1,200', method: 'Cash' },
  { emoji: '🏨', label: 'Hotel Room', amount: '₹3,500', method: 'PhonePe' },
];

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* ── Navigation ── */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>⚡</div>
          AutoSplit
        </div>
        <div className={styles.navRight}>
          <ThemeSelector />
          <span className={styles.navLoginBtn}>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/login'}>
              Log In
            </Button>
          </span>
          <Button size="sm" onClick={() => window.location.href = '/register'}>
            Get Started
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.bgOrbs}>
          <motion.div
            className={`${styles.orb} ${styles.orb1}`}
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className={`${styles.orb} ${styles.orb2}`}
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className={`${styles.orb} ${styles.orb3}`}
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.1, 0.15] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <motion.div
          className={styles.heroContent}
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          <motion.div className={styles.heroTag} variants={fadeUp} transition={{ duration: 0.5 }}>
            ✨ Never argue about money again
          </motion.div>

          <motion.h1 className={styles.heroTitle} variants={fadeUp} transition={{ duration: 0.5 }}>
            Split expenses.{' '}
            <span className="text-gradient">Not friendships.</span>
          </motion.h1>

          <motion.p className={styles.heroSubtitle} variants={fadeUp} transition={{ duration: 0.5 }}>
            Keep track of every expense cash or UPI with your group.
            AutoSplit figures out who owes whom, instantly and accurately.
            Spend less time calculating, and more time enjoying the trip.
          </motion.p>




          <motion.div className={styles.heroCta} variants={fadeUp} transition={{ duration: 0.5 }}>
            <Button size="lg" rightIcon={<ArrowRight size={18} />} onClick={() => window.location.href = '/register'}>
              Start Splitting Free
            </Button>
            <Button variant="secondary" size="lg" onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              See How It Works
            </Button>
          </motion.div>

          {/* Demo floating cards */}
          <motion.div
            className={styles.demoCards}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {DEMO_TRANSACTIONS.map((txn, i) => (
              <motion.div
                key={i}
                className={styles.demoCard}
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 3,
                  delay: i * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <span style={{ fontSize: 28 }}>{txn.emoji}</span>
                <div>
                  <div className={styles.demoAmount}>{txn.amount}</div>
                  <div className={styles.demoLabel}>{txn.label}</div>
                  <div className={styles.demoMethod}>{txn.method}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className={styles.features} id="features">
        <motion.h2
          className={styles.sectionTitle}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Everything you need to split smart
        </motion.h2>
        <motion.p
          className={styles.sectionSub}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          From quick entries to intelligent settlements, AutoSplit handles it all.
        </motion.p>

        <div className={styles.featureGrid}>
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              className={styles.featureCard}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className={styles.howItWorks} id="how-it-works">
        <motion.h2
          className={styles.sectionTitle}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Three steps. Zero hassle.
        </motion.h2>
        <motion.p
          className={styles.sectionSub}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Going on a trip? Here&apos;s your new workflow.
        </motion.p>

        <div className={styles.stepsGrid}>
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              className={styles.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
            >
              <motion.div
                className={styles.stepNum}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {step.num}
              </motion.div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <p className={styles.footerText}>
          © 2026 AutoSplit. Built with ❤️ by Sayan. Split expenses, not friendships.
        </p>
      </footer>
    </div>
  );
}
