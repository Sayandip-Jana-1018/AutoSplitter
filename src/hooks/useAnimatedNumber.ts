'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animate a number from 0 → target using requestAnimationFrame.
 * Returns the current animated value as a formatted string.
 */
export function useAnimatedNumber(
    target: number,
    duration: number = 1200,
    formatter?: (val: number) => string
): string {
    const [current, setCurrent] = useState(0);
    const startTime = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        startTime.current = null;

        const animate = (timestamp: number) => {
            if (!startTime.current) startTime.current = timestamp;
            const elapsed = timestamp - startTime.current;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(Math.round(eased * target));

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [target, duration]);

    if (formatter) return formatter(current);
    return current.toString();
}
