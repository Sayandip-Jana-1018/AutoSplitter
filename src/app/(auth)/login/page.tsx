'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ThemeSelector from '@/components/features/ThemeSelector';
import styles from '../auth.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.bgOrbs}>
                <motion.div
                    className={`${styles.orb} ${styles.orb1}`}
                    animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className={`${styles.orb} ${styles.orb2}`}
                    animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            <div className={styles.themeToggle}>
                <ThemeSelector />
            </div>

            <motion.div
                className={styles.authCard}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>⚡</div>
                    AutoSplit
                </div>

                <h1 className={styles.title}>Welcome back</h1>
                <p className={styles.subtitle}>Sign in to your account to continue</p>

                {error && (
                    <motion.div
                        className={styles.error}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {error}
                    </motion.div>
                )}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <Input
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        leftIcon={<Mail size={18} />}
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftIcon={<Lock size={18} />}
                        required
                    />

                    <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        loading={loading}
                        leftIcon={<LogIn size={18} />}
                    >
                        Sign In
                    </Button>
                </form>

                <p className={styles.footerText}>
                    Don&apos;t have an account?{' '}
                    <a href="/register" className={styles.link}>
                        Create one
                    </a>
                </p>
            </motion.div>
        </div>
    );
}
