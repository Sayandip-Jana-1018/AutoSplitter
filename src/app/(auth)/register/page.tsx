'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ThemeSelector from '@/components/features/ThemeSelector';
import styles from '../auth.module.css';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Register
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Registration failed');
                return;
            }

            // Auto sign-in after registration
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Account created! Please sign in.');
                router.push('/login');
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

                <h1 className={styles.title}>Create account</h1>
                <p className={styles.subtitle}>Start splitting expenses with your friends</p>

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
                        label="Full Name"
                        type="text"
                        placeholder="Sayan Das"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        leftIcon={<User size={18} />}
                        required
                    />

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
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftIcon={<Lock size={18} />}
                        minLength={6}
                        required
                    />

                    <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        loading={loading}
                        leftIcon={<UserPlus size={18} />}
                    >
                        Create Account
                    </Button>
                </form>

                <p className={styles.footerText}>
                    Already have an account?{' '}
                    <a href="/login" className={styles.link}>
                        Sign in
                    </a>
                </p>
            </motion.div>
        </div>
    );
}
