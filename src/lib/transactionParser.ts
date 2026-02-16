/**
 * Transaction Parser — extracts amount, merchant, date, UPI ref from raw OCR / notification text.
 * Works with GPay, PhonePe, Paytm screenshots and Indian bank SMS formats.
 */

export interface ParsedTransaction {
    amount: number | null;        // in paise
    merchant: string | null;
    method: string | null;        // gpay | phonepe | paytm | upi_other | card | cash
    upiRef: string | null;
    date: Date | null;
    confidence: number;           // 0-1
    rawText: string;
}

// ── Amount Patterns ──
const AMOUNT_PATTERNS = [
    /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /(?:amount|amt|paid|debited|credited)[:\s]*(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)\s*(?:paid|debited|sent|received)/gi,
];

// ── UPI Ref Patterns ──
const UPI_REF_PATTERNS = [
    /(?:UPI\s*(?:Ref|ref\.?|ID|Transaction\s*ID))[:\s#]*(\d{8,12})/gi,
    /(?:Ref\s*(?:No|Number|#))[:\s]*(\d{8,12})/gi,
    /(?:UTR)[:\s]*(\d{8,12})/gi,
];

// ── Method Detection ──
const METHOD_KEYWORDS: Record<string, string[]> = {
    gpay: ['google pay', 'gpay', 'g pay', 'tez'],
    phonepe: ['phonepe', 'phone pe'],
    paytm: ['paytm', 'pay tm'],
    card: ['credit card', 'debit card', 'card ending', 'visa', 'mastercard', 'rupay'],
};

// ── Merchant Patterns ──
const MERCHANT_PATTERNS = [
    /(?:paid to|sent to|transferred to|payment to|to)\s+([A-Za-z][\w\s&'.,-]{2,30})/gi,
    /(?:from)\s+([A-Za-z][\w\s&'.,-]{2,30})\s+(?:via|through)/gi,
    /(?:at)\s+([A-Za-z][\w\s&'.,-]{2,30})/gi,
];

function extractAmount(text: string): number | null {
    for (const pattern of AMOUNT_PATTERNS) {
        pattern.lastIndex = 0;
        const match = pattern.exec(text);
        if (match) {
            const cleaned = match[1].replace(/,/g, '');
            const num = parseFloat(cleaned);
            if (num > 0 && num < 10_000_000) {
                return Math.round(num * 100); // to paise
            }
        }
    }
    return null;
}

function extractUpiRef(text: string): string | null {
    for (const pattern of UPI_REF_PATTERNS) {
        pattern.lastIndex = 0;
        const match = pattern.exec(text);
        if (match) return match[1];
    }
    return null;
}

function detectMethod(text: string): string | null {
    const lower = text.toLowerCase();
    for (const [method, keywords] of Object.entries(METHOD_KEYWORDS)) {
        if (keywords.some((kw) => lower.includes(kw))) return method;
    }
    if (lower.includes('upi')) return 'upi_other';
    return null;
}

function extractMerchant(text: string): string | null {
    for (const pattern of MERCHANT_PATTERNS) {
        pattern.lastIndex = 0;
        const match = pattern.exec(text);
        if (match) {
            return match[1].trim().replace(/\s+/g, ' ').slice(0, 40);
        }
    }
    return null;
}

export function parseTransactionText(rawText: string): ParsedTransaction {
    const amount = extractAmount(rawText);
    const upiRef = extractUpiRef(rawText);
    const method = detectMethod(rawText);
    const merchant = extractMerchant(rawText);

    // Confidence scoring
    let confidence = 0;
    if (amount) confidence += 0.4;
    if (merchant) confidence += 0.25;
    if (method) confidence += 0.2;
    if (upiRef) confidence += 0.15;

    return {
        amount,
        merchant,
        method,
        upiRef,
        date: new Date(),
        confidence,
        rawText,
    };
}
