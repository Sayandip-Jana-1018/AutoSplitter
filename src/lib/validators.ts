import { z } from 'zod';

// ── Auth ──
export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});

// ── Group ──
export const createGroupSchema = z.object({
    name: z.string().min(1, 'Group name is required').max(50),
    emoji: z.string().default('✈️'),
});

// ── Trip ──
export const createTripSchema = z.object({
    groupId: z.string().cuid(),
    title: z.string().min(1, 'Trip title is required').max(100),
    description: z.string().max(500).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    currency: z.string().default('INR'),
});

// ── Transaction ──
export const createTransactionSchema = z.object({
    tripId: z.string().cuid(),
    payerId: z.string().cuid(),
    amount: z.number().positive('Amount must be positive'), // in rupees (will be converted to paise)
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(500).optional(),
    category: z.string().default('general'),
    method: z.string().default('cash'),
    splitType: z.enum(['equal', 'percentage', 'custom', 'items']).default('equal'),
    splits: z.array(z.object({
        userId: z.string().cuid(),
        amount: z.number().optional(),       // for custom split (in rupees)
        percentage: z.number().optional(),   // for percentage split
    })).optional(),
    date: z.string().optional(),
});

// ── Settlement ──
export const markSettlementSchema = z.object({
    settlementId: z.string().cuid(),
    method: z.string().optional(),
    note: z.string().max(200).optional(),
});

// Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
