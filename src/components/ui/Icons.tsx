'use client';

import { ReactNode } from 'react';
import {
    SiGooglepay,
    SiPhonepe,
    SiPaytm,
} from 'react-icons/si';
import {
    BsCashCoin,
    BsCreditCard2Back,
    BsPhone,
} from 'react-icons/bs';
import {
    MdFastfood,
    MdDirectionsCar,
    MdHotel,
    MdShoppingCart,
    MdLocalGasStation,
    MdLocalHospital,
    MdSportsEsports,
    MdConfirmationNumber,
    MdCategory,
    MdAttachFile,
} from 'react-icons/md';

// ── Payment Method Icons (colorful branded) ──

interface IconConfig {
    icon: ReactNode;
    label: string;
    color: string;
}

export const PAYMENT_ICONS: Record<string, IconConfig> = {
    cash: {
        icon: <BsCashCoin size={18} />,
        label: 'Cash',
        color: '#22c55e',
    },
    gpay: {
        icon: <SiGooglepay size={20} />,
        label: 'Google Pay',
        color: '#4285F4',
    },
    phonepe: {
        icon: <SiPhonepe size={18} />,
        label: 'PhonePe',
        color: '#5F259F',
    },
    paytm: {
        icon: <SiPaytm size={18} />,
        label: 'Paytm',
        color: '#00BAF2',
    },
    upi_other: {
        icon: <BsPhone size={18} />,
        label: 'Other UPI',
        color: '#f97316',
    },
    card: {
        icon: <BsCreditCard2Back size={18} />,
        label: 'Card',
        color: '#a855f7',
    },
};

// ── Category Icons (colorful material) ──

export const CATEGORY_ICONS: Record<string, IconConfig> = {
    general: {
        icon: <MdCategory size={20} />,
        label: 'General',
        color: '#6366f1',
    },
    food: {
        icon: <MdFastfood size={20} />,
        label: 'Food & Drinks',
        color: '#ef4444',
    },
    transport: {
        icon: <MdDirectionsCar size={20} />,
        label: 'Transport',
        color: '#3b82f6',
    },
    stay: {
        icon: <MdHotel size={20} />,
        label: 'Accommodation',
        color: '#8b5cf6',
    },
    shopping: {
        icon: <MdShoppingCart size={20} />,
        label: 'Shopping',
        color: '#ec4899',
    },
    tickets: {
        icon: <MdConfirmationNumber size={20} />,
        label: 'Tickets & Entry',
        color: '#f59e0b',
    },
    fuel: {
        icon: <MdLocalGasStation size={20} />,
        label: 'Fuel',
        color: '#f97316',
    },
    medical: {
        icon: <MdLocalHospital size={20} />,
        label: 'Medical',
        color: '#10b981',
    },
    entertainment: {
        icon: <MdSportsEsports size={20} />,
        label: 'Entertainment',
        color: '#06b6d4',
    },
    other: {
        icon: <MdAttachFile size={20} />,
        label: 'Other',
        color: '#78716c',
    },
};

// ── Icon Wrapper Component ──

export function PaymentIcon({ method, size = 18 }: { method: string; size?: number }) {
    const config = PAYMENT_ICONS[method] || PAYMENT_ICONS.cash;
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: config.color,
                width: size + 4,
                height: size + 4,
            }}
        >
            {config.icon}
        </span>
    );
}

export function CategoryIcon({ category, size = 20 }: { category: string; size?: number }) {
    const config = CATEGORY_ICONS[category] || CATEGORY_ICONS.general;
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: config.color,
                width: size + 6,
                height: size + 6,
                background: `${config.color}15`,
                borderRadius: 'var(--radius-md)',
            }}
        >
            {config.icon}
        </span>
    );
}
