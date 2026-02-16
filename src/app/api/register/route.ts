import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/validators';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = registerSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, email, password } = result.data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        return NextResponse.json(
            { message: 'Account created successfully', user },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}
