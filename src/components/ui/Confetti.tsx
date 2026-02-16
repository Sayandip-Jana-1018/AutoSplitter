'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ConfettiProps {
    active: boolean;
    duration?: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
}

const COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
    '#f43f5e', '#10b981', '#06b6d4', '#f59e0b',
    '#3b82f6', '#22c55e',
];

export default function Confetti({ active, duration = 3000 }: ConfettiProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);

    const createParticles = useCallback(() => {
        const particles: Particle[] = [];
        for (let i = 0; i < 120; i++) {
            particles.push({
                x: Math.random() * window.innerWidth,
                y: -20 - Math.random() * 100,
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * 4 + 2,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                size: Math.random() * 8 + 4,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                opacity: 1,
            });
        }
        return particles;
    }, []);

    useEffect(() => {
        if (!active || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        particlesRef.current = createParticles();
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > duration) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // gravity
                p.rotation += p.rotationSpeed;
                p.opacity = Math.max(0, 1 - elapsed / duration);

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            });

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [active, duration, createParticles]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                pointerEvents: 'none',
            }}
        />
    );
}
