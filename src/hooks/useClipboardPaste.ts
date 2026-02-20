'use client';

import { useState, useEffect, useCallback } from 'react';
import { parseTransactionText, type ParsedTransaction } from '@/lib/transactionParser';

/**
 * Hook that detects UPI transaction text on the clipboard when the app gains focus.
 * Shows a preview card the user can accept or dismiss.
 */
export function useClipboardPaste() {
    const [detected, setDetected] = useState<ParsedTransaction | null>(null);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const checkClipboard = useCallback(async () => {
        try {
            // Clipboard API requires user gesture or focus event
            if (!navigator.clipboard?.readText) return;

            const text = await navigator.clipboard.readText();
            if (!text || text.length < 10 || text.length > 500) return;

            // Skip if we already dismissed this exact text
            if (dismissed.has(text)) return;

            // Check if it looks like a payment notification
            const hasAmount = /(?:₹|Rs\.?|INR)\s*[\d,]+/.test(text);
            const hasPaymentKeyword = /(?:paid|debited|credited|sent|received|transferred|payment)/i.test(text);

            if (!hasAmount && !hasPaymentKeyword) return;

            const parsed = parseTransactionText(text);
            if (parsed.amount && parsed.confidence >= 0.3) {
                setDetected(parsed);
            }
        } catch {
            // Clipboard read failed (permission denied, etc.) — silent fail
        }
    }, [dismissed]);

    useEffect(() => {
        // Check on window focus (user switches back to app)
        const handleFocus = () => {
            setTimeout(checkClipboard, 300); // small delay for clipboard to be ready
        };

        window.addEventListener('focus', handleFocus);

        // Also check on initial mount
        const t = setTimeout(() => checkClipboard(), 0);

        return () => {
            clearTimeout(t);
            window.removeEventListener('focus', handleFocus);
        };
    }, [checkClipboard]);

    const dismiss = useCallback(() => {
        if (detected) {
            setDismissed((prev) => new Set(prev).add(detected.rawText));
        }
        setDetected(null);
    }, [detected]);

    const accept = useCallback(() => {
        const result = detected;
        if (detected) {
            setDismissed((prev) => new Set(prev).add(detected.rawText));
        }
        setDetected(null);
        return result;
    }, [detected]);

    return { detected, dismiss, accept };
}
