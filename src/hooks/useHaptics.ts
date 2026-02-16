'use client';

import { useCallback } from 'react';

/**
 * Haptic feedback hook for mobile PWA.
 * Falls back silently on unsupported devices.
 */
export function useHaptics() {
    const light = useCallback(() => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(10);
        }
    }, []);

    const medium = useCallback(() => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(25);
        }
    }, []);

    const heavy = useCallback(() => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([15, 30, 15]);
        }
    }, []);

    const success = useCallback(() => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([10, 50, 20]);
        }
    }, []);

    return { light, medium, heavy, success };
}
