'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { MouseEvent, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    glare?: boolean;
    maxTilt?: number;
    scale?: number;
}

export default function TiltCard({
    children,
    className,
    glare = true,
    maxTilt = 8,
    scale = 1.02,
}: TiltCardProps) {
    const ref = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 40 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 40 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt]);

    // Glare position
    const glareX = useTransform(rotateY, [-maxTilt, maxTilt], [0, 100]);
    const glareY = useTransform(rotateX, [maxTilt, -maxTilt], [0, 100]);
    const glareOpacity = useTransform(mouseX, [-0.5, 0.5], [0, 0.4]); // Only visible on movement

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const mouseXRel = (e.clientX - rect.left) / width - 0.5;
        const mouseYRel = (e.clientY - rect.top) / height - 0.5;

        x.set(mouseXRel);
        y.set(mouseYRel);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            className={cn('relative', className)}
            style={{
                perspective: 1000,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ scale }}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
                className="w-full h-full relative"
            >
                {children}

                {/* Glare Effect */}
                {glare && (
                    <div
                        className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none z-10"
                        style={{ transform: 'translateZ(1px)' }} // Lift slightly above content
                    >
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-0 mix-blend-overlay"
                            style={{
                                opacity: glareOpacity,
                                background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.8) 0%, transparent 60%)`,
                            }}
                        />
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
