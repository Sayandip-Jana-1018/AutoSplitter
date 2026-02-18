'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * template.tsx re-renders on EVERY route change in Next.js App Router.
 * Provides a premium cross-fade + slide-up + blur page transition.
 * Uses mounted state to avoid hydration mismatch with Framer Motion.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // On server & first client render: render without animation to match SSR HTML
    if (!mounted) {
        return <div>{children}</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1],
            }}
        >
            {children}
        </motion.div>
    );
}
