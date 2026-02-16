'use client';

import { motion } from 'framer-motion';

/**
 * template.tsx re-renders on EVERY route change in Next.js App Router.
 * This gives us AnimatePresence-like page transitions without extra wiring.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
                duration: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
        >
            {children}
        </motion.div>
    );
}
