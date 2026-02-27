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
        // Offset by -PI/2 to start at the top (12 o'clock)
        const angle = (2 * Math.PI * i) / count - Math.PI / 2;
        return {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
            angle, // Store angle for label positioning
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
                setSize({ w, h: compact ? Math.min(w, 280) : Math.min(w, 420) });
            }
        }
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [compact]);

    const cx = size.w / 2;
    const cy = size.h / 2;
    // Give slightly more breathing room
    const nodeOffset = compact ? 45 : 60;
    const radius = Math.min(cx, cy) - nodeOffset;
    const positions = getNodePositions(members.length, cx, cy, radius);
    const markerId = `arrowHead-${instanceId}`;

    return (
        <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
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
                        refX="7"
                        refY="3"
                        orient="auto"
                    >
                        <path d="M0,0 L8,3 L0,6 Z" fill="var(--accent-500)" opacity="0.8" />
                    </marker>
                    {/* Filter for amount bubble shadow to make it pop over lines */}
                    <filter id={`shadow-${instanceId}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(var(--accent-500-rgb), 0.15)" />
                    </filter>
                </defs>

                {/* Edges (animated curved transfers) */}
                {settlements.map((s, i) => {
                    const fromIdx = members.indexOf(s.from);
                    const toIdx = members.indexOf(s.to);
                    if (fromIdx === -1 || toIdx === -1) return null;

                    const from = positions[fromIdx];
                    const to = positions[toIdx];

                    // Calculate linear distance between nodes
                    const dx = to.x - from.x;
                    const dy = to.y - from.y;
                    const len = Math.sqrt(dx * dx + dy * dy);

                    // Radius of the avatar circle so line doesn't start inside the image
                    const nodeRadius = 26;
                    
                    // Start & end points on the edge of the avatar circle
                    const startX = from.x + (dx / len) * nodeRadius;
                    const startY = from.y + (dy / len) * nodeRadius;
                    const endX = to.x - (dx / len) * (nodeRadius + 6); // Extra offset for arrow head
                    const endY = to.y - (dy / len) * (nodeRadius + 6);

                    // Calculate a control point for a quadratic bezier curve
                    // We want to bow outward slightly relative to the center of the graph
                    const midX = (startX + endX) / 2;
                    const midY = (startY + endY) / 2;

                    // Vector from graph center to midpoint
                    const vecCx = midX - cx;
                    const vecCy = midY - cy;
                    const vecCLen = Math.sqrt(vecCx * vecCx + vecCy * vecCy) || 1;

                    // Push the curve outward. The closer to center, the harder we push it out.
                    // Also use edge index `i` to stagger lines if there are multiple crossing the exact same path
                    const curveIntensity = Math.max(30, radius * 0.4); 
                    const staggerDir = i % 2 === 0 ? 1 : -1;
                    
                    // Control point (cp)
                    const cpX = midX + (vecCx / vecCLen) * curveIntensity * staggerDir;
                    const cpY = midY + (vecCy / vecCLen) * curveIntensity * staggerDir;

                    const pathData = `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`;
                    
                    // Curve midpoint for placing the text bubble
                    // Quadratic bezier midpoint: B(0.5) = 0.25*P0 + 0.5*P1 + 0.25*P2
                    const textX = 0.25 * startX + 0.5 * cpX + 0.25 * endX;
                    const textY = 0.25 * startY + 0.5 * cpY + 0.25 * endY;

                    return (
                        <motion.g
                            key={`edge-${i}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                        >
                            {/* The curved trajectory line */}
                            <motion.path
                                d={pathData}
                                fill="none"
                                stroke="var(--accent-400)"
                                strokeWidth={2}
                                strokeDasharray="5 4"
                                opacity={0.5}
                                markerEnd={`url(#${markerId})`}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 0.3 + i * 0.15, duration: 0.7, ease: "easeOut" }}
                            />
                            
                            {/* Amount Bubble */}
                            <motion.g
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.6 + i * 0.15, type: 'spring', stiffness: 400, damping: 25 }}
                            >
                                <rect
                                    x={textX - 32}
                                    y={textY - 12}
                                    width={64}
                                    height={24}
                                    rx={12}
                                    fill="var(--bg-glass)"
                                    stroke="rgba(var(--accent-500-rgb), 0.2)"
                                    strokeWidth={1.5}
                                    filter={`url(#shadow-${instanceId})`}
                                />
                                <text
                                    x={textX}
                                    y={textY + 4}
                                    textAnchor="middle"
                                    fontSize={11}
                                    fontWeight={700}
                                    fill="var(--accent-600)"
                                >
                                    {formatCurrency(s.amount)}
                                </text>
                            </motion.g>
                        </motion.g>
                    );
                })}

                {/* Nodes (members) */}
                {members.map((name, i) => {
                    const pos = positions[i];
                    const color = getAvatarColor(name);
                    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    const image = memberImages[name] || null;

                    // Push labels outward away from the center of the graph
                    const labelRadius = 40;
                    const labelX = pos.x + Math.cos(pos.angle) * labelRadius;
                    const labelY = pos.y + Math.sin(pos.angle) * labelRadius;

                    return (
                        <motion.g
                            key={`node-${i}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            <defs>
                                <clipPath id={`avatar-clip-${instanceId}-${i}`}>
                                    <circle cx={pos.x} cy={pos.y} r={24} />
                                </clipPath>
                            </defs>
                            
                            {/* Dynamic Glow */}
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={32}
                                fill={color}
                                opacity={0.12}
                            />
                            
                            <g filter={`drop-shadow(0px 4px 12px rgba(0,0,0,0.08))`}>
                                {image ? (
                                    <>
                                        <image
                                            href={image}
                                            x={pos.x - 24}
                                            y={pos.y - 24}
                                            width={48}
                                            height={48}
                                            clipPath={`url(#avatar-clip-${instanceId}-${i})`}
                                            preserveAspectRatio="xMidYMid slice"
                                        />
                                        <circle
                                            cx={pos.x}
                                            cy={pos.y}
                                            r={24}
                                            fill="none"
                                            stroke="var(--bg-primary)"
                                            strokeWidth={3}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <circle
                                            cx={pos.x}
                                            cy={pos.y}
                                            r={24}
                                            fill={color}
                                            stroke="var(--bg-primary)"
                                            strokeWidth={3}
                                        />
                                        <text
                                            x={pos.x}
                                            y={pos.y + 5}
                                            textAnchor="middle"
                                            fontSize={14}
                                            fontWeight={700}
                                            fill="white"
                                        >
                                            {initials}
                                        </text>
                                    </>
                                )}
                            </g>
                            
                            {/* Member Name outward label */}
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                            >
                                <rect 
                                    x={labelX - 30} 
                                    y={labelY - 10} 
                                    width={60} 
                                    height={20} 
                                    rx={10} 
                                    fill="var(--bg-glass)"
                                    opacity={0.8}
                                />
                                <text
                                    x={labelX}
                                    y={labelY + 4}
                                    textAnchor="middle"
                                    fontSize={11}
                                    fontWeight={600}
                                    fill="var(--fg-secondary)"
                                >
                                    {name.split(' ')[0]}
                                </text>
                            </motion.g>
                        </motion.g>
                    );
                })}
            </svg>
        </div>
    );
}
