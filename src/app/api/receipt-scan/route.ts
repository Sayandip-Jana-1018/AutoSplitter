import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * POST /api/receipt-scan — Advanced AI receipt scanning via OpenAI GPT-4o-mini vision.
 * Accepts: { image: string (base64 data URL) }
 * Returns: Structured receipt data with items, taxes, totals.
 */

interface ReceiptItem {
    name: string;
    quantity: number;
    price: number;      // in paise
}

interface ReceiptScanResult {
    merchant: string | null;
    date: string | null;
    items: ReceiptItem[];
    subtotal: number;   // paise
    taxes: Record<string, number>; // e.g. { CGST: 1702, SGST: 1702 }
    total: number;       // paise
    category: string;
    confidence: number;
}

const SYSTEM_PROMPT = `You are an expert receipt parser with perfect vision. Given a receipt image, extract ALL structured data with 99% accuracy.
Return ONLY valid JSON with this exact schema (no markdown, no explanation, no code fences):
{
  "merchant": "Store/Restaurant Name" or null,
  "date": "YYYY-MM-DD" or null,
  "items": [
    { "name": "Item name", "quantity": 1, "price": 120.00 }
  ],
  "subtotal": 500.00,
  "taxes": { "CGST": 25.00, "SGST": 25.00 },
  "total": 550.00,
  "category": "food|transport|shopping|entertainment|bills|health|education|general",
  "confidence": 0.95
}

CRITICAL RULES for 99% ACCURACY:
1. Prices MUST be in the ORIGINAL CURRENCY as exact decimals (e.g., 120.50 for ₹120.50). Do NOT convert currencies.
2. The "total" MUST EXACTLY MATCH the final charged amount on the receipt. Double-check this digit by digit!
3. Include EVERY SINGLE ITEM listed. Do not skip or summarize items.
4. "price" inside "items" must be the TOTAL price for that item row (quantity * unit price) if not explicitly split.
5. If quantity is missing, default to 1.
6. Extract all taxes (CGST, SGST, Service Charge, VAT, etc.) into the "taxes" object. If tax type is unclear, use "Tax".
7. Exclude the "Total" row from the "items" array. Only actual products/services go in "items".
8. Ignore headers, footers, phone numbers, table numbers, and wifi passwords.
9. Verify the math: subtotal + taxes + tips/fees SHOULD equal the total. If it doesn't, trust the printed "Total" at the bottom of the receipt.
10. If the image is blurry/unreadable and you cannot find a total, set confidence below 0.3.
Always return raw JSON.`;

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured. Add OPENAI_API_KEY to your .env file.' },
                { status: 503 }
            );
        }

        const body = await req.json();
        const { image } = body as { image: string };

        if (!image || !image.startsWith('data:image/')) {
            return NextResponse.json(
                { error: 'Invalid image. Send a base64 data URL (data:image/jpeg;base64,...)' },
                { status: 400 }
            );
        }

        // Call OpenAI Vision API
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'Parse this receipt and return structured JSON:' },
                            {
                                type: 'image_url',
                                image_url: { url: image, detail: 'high' },
                            },
                        ],
                    },
                ],
                max_tokens: 2000,
                temperature: 0.1,
            }),
        });

        if (!openaiRes.ok) {
            const err = await openaiRes.text();
            console.error('OpenAI API error:', openaiRes.status, err);
            if (openaiRes.status === 401) {
                return NextResponse.json({ error: 'Invalid OpenAI API key' }, { status: 503 });
            }
            if (openaiRes.status === 429) {
                return NextResponse.json({ error: 'Rate limit exceeded. Please try again in a moment.' }, { status: 429 });
            }
            return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 502 });
        }

        const openaiData = await openaiRes.json();
        const content = openaiData.choices?.[0]?.message?.content;

        if (!content) {
            return NextResponse.json({ error: 'Empty response from AI' }, { status: 502 });
        }

        // Parse JSON from response (strip any markdown fences if present)
        let parsed: Record<string, unknown>;
        try {
            const cleaned = content
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .trim();
            parsed = JSON.parse(cleaned);
        } catch {
            console.error('Failed to parse AI response:', content);
            return NextResponse.json(
                { error: 'AI returned invalid data. Please try again with a clearer image.' },
                { status: 422 }
            );
        }

        // Normalize amounts to paise (multiply by 100)
        const toPaise = (val: unknown): number => {
            const n = typeof val === 'number' ? val : parseFloat(String(val || '0'));
            return isNaN(n) ? 0 : Math.round(n * 100);
        };

        const items: ReceiptItem[] = Array.isArray(parsed.items)
            ? parsed.items.map((item: Record<string, unknown>) => ({
                name: String(item.name || 'Unknown item'),
                quantity: typeof item.quantity === 'number' ? item.quantity : 1,
                price: toPaise(item.price),
            }))
            : [];

        const taxes: Record<string, number> = {};
        if (parsed.taxes && typeof parsed.taxes === 'object') {
            for (const [key, val] of Object.entries(parsed.taxes as Record<string, unknown>)) {
                taxes[key] = toPaise(val);
            }
        }

        const result: ReceiptScanResult = {
            merchant: typeof parsed.merchant === 'string' ? parsed.merchant : null,
            date: typeof parsed.date === 'string' ? parsed.date : null,
            items,
            subtotal: toPaise(parsed.subtotal),
            taxes,
            total: toPaise(parsed.total),
            category: typeof parsed.category === 'string' ? parsed.category : 'general',
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        };

        // Sanity check: if total is 0 but items have prices, compute total
        if (result.total === 0 && items.length > 0) {
            result.total = items.reduce((s, i) => s + i.price * i.quantity, 0);
            const taxTotal = Object.values(taxes).reduce((s, v) => s + v, 0);
            result.total += taxTotal;
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Receipt scan error:', error);
        return NextResponse.json(
            { error: 'Failed to process receipt. Please try again.' },
            { status: 500 }
        );
    }
}
