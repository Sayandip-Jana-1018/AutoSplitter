import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Uploads a file to the 'receipts' bucket and returns its public URL
 */
export async function uploadReceipt(file: File, path: string): Promise<string | null> {
    try {
        const { error } = await supabase.storage
            .from('receipts')
            .upload(path, file, { upsert: true });

        if (error) {
            console.error('Supabase upload error:', error);
            return null;
        }

        const { data } = supabase.storage.from('receipts').getPublicUrl(path);
        return data.publicUrl;
    } catch (err) {
        console.error('Failed to upload receipt:', err);
        return null;
    }
}
