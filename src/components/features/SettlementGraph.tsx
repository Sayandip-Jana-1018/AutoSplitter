'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { formatCurrency, getAvatarColor } from '@/lib/utils';

interface Settlement {
    from: string;
    to: string;
    amount: number;
}

interface SettlementGraphProps {
    members: string[];
    settlements: Settlement[];
    memberImages?: Record<string, string | null>;
    compact?: boolean;
    instanceId?: string;
}

function getNodePositions(count: number, cx: number, cy: number, radius: number) {
    return Array.from({ length: count }, (_, i) => {
        const angle = (2 * Math.PI * i) / count - Math.PI / 2;
        return {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
        };
    });
}

export default function SettlementGraph({ members, settlements, memberImages = {}, compact = false, instanceId = 'default' }: SettlementGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ w: 320, h: compact ? 240 : 320 });

    useEffect(() => {
        function updateSize() {
            if (containerRef.current) {
                const w = containerRef.current.offsetWidth;
                setSize({ w, h: compact ? Math.min(w, 260) : Math.min(w, 400) });
            }
        }
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [compact]);

    const cx = size.w / 2;
    const cy = size.h / 2;
    const nodeOffset = compact ? 38 : 50;
    const radius = Math.min(cx, cy) - nodeOffset;
    const positions = getNodePositions(members.length, cx, cy, radius);
    const markerId = `arrowHead-${instanceId}`;

    return (
        <div ref={containerRef} style={{ width: '100%' }}>
            <svg
                width={size.w}
                height={size.h}
                viewBox={`0 0 ${size.w} ${size.h}`}
                style={{ overflow: 'visible' }}
            >
                <defs>
                    <marker
                        id={markerId}
                        markerWidth="8"
                        markerHeight="6"
                        refX="8"
                        refY="3"
                        orient="auto"
                    >
                        <path d="M0,0 L8,3 L0,6 Z" fill="var(--accent-500)" opacity="0.7" />
                    </marker>
                </defs>

                {/* Edges (animated transfers) */}
                {settlements.map((s, i) => {
                    const fromIdx = members.indexOf(s.from);
                    const toIdx = members.indexOf(s.to);
                    if (fromIdx === -1 || toIdx === -1) return null;

                    const from = positions[fromIdx];
                    const to = positions[toIdx];

                    // Offset to not overlap with node circle
                    const dx = to.x - from.x;
                    const dy = to.y - from.y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const nodeRadius = 22;
                    const fromX = from.x + (dx / len) * nodeRadius;
                    const fromY = from.y + (dy / len) * nodeRadius;
                    const toX = to.x - (dx / len) * (nodeRadius + 10);
                    const toY = to.y - (dy / len) * (nodeRadius + 10);

                    const midX = (fromX + toX) / 2;
                    const midY = (fromY + toY) / 2;

                    return (
                        <motion.g
                            key={`edge-${i}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
                        >
                            <motion.line
                                x1={fromX}
                                y1={fromY}
                                x2={toX}
                                y2={toY}
                                stroke="var(--accent-500)"
                                strokeWidth={2}
                                strokeDasharray="6 3"
                                opacity={0.4}
                                markerEnd={`url(#${markerId})`}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 0.4 + i * 0.15, duration: 0.6 }}
                            />
                            <rect
                                x={midX - 32}
                                y={midY - 10}
                                width={64}
                                height={20}
                                rx={6}
                                fill="var(--bg-primary)"
                                stroke="var(--border-default)"
                                strokeWidth={1}
                            />
                            <text
                                x={midX}
                                y={midY + 4}
                                textAnchor="middle"
                                fontSize={10}
                                fontWeight={600}
                                fill="var(--accent-500)"
                            >
                                {formatCurrency(s.amount)}
                            </text>
                        </motion.g>
                    );
                })}

                {/* Nodes (members) */}
                {members.map((name, i) => {
                    const pos = positions[i];
                    const color = getAvatarColor(name);
                    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    const image = memberImages[name] || null;

                    return (
                        <motion.g
                            key={`node-${i}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            {/* Clip path for circular image */}
                            <defs>
                                <clipPath id={`avatar-clip-${i}`}>
                                    <circle cx={pos.x} cy={pos.y} r={22} />
                                </clipPath>
                            </defs>
                            {/* Glow */}
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={28}
                                fill={color}
                                opacity={0.15}
                            />
                            {image ? (
                                /* Profile photo */
                                <>
                                    <image
                                        href={image}
                                        x={pos.x - 22}
                                        y={pos.y - 22}
                                        width={44}
                                        height={44}
                                        clipPath={`url(#avatar-clip-${i})`}
                                        preserveAspectRatio="xMidYMid slice"
                                    />
                                    <circle
                                        cx={pos.x}
                                        cy={pos.y}
                                        r={22}
                                        fill="none"
                                        stroke="var(--bg-primary)"
                                        strokeWidth={3}
                                    />
                                </>
                            ) : (
                                /* Initials fallback */
                                <>
                                    <circle
                                        cx={pos.x}
                                        cy={pos.y}
                                        r={22}
                                        fill={color}
                                        stroke="var(--bg-primary)"
                                        strokeWidth={3}
                                    />
                                    <text
                                        x={pos.x}
                                        y={pos.y + 5}
                                        textAnchor="middle"
                                        fontSize={12}
                                        fontWeight={700}
                                        fill="white"
                                    >
                                        {initials}
                                    </text>
                                </>
                            )}
                            {/* Name label */}
                            <text
                                x={pos.x}
                                y={pos.y + 40}
                                textAnchor="middle"
                                fontSize={10}
                                fontWeight={500}
                                fill="var(--fg-secondary)"
                            >
                                {name.split(' ')[0]}
                            </text>
                        </motion.g>
                    );
                })}
            </svg>
        </div>
    );
}
