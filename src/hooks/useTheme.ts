'use client';

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';
type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red' | 'teal' | 'indigo';

const THEME_KEY = 'autosplit-theme';
const ACCENT_KEY = 'autosplit-accent';

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [accent, setAccentState] = useState<AccentColor>('blue');
    const [mounted, setMounted] = useState(false);

    // Read from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
        const savedAccent = localStorage.getItem(ACCENT_KEY) as AccentColor | null;

        // Detect system preference if no saved theme
        if (savedTheme) {
            setThemeState(savedTheme);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setThemeState(prefersDark ? 'dark' : 'light');
        }

        if (savedAccent) {
            setAccentState(savedAccent);
        }

        setMounted(true);
    }, []);

    // Apply to document
    useEffect(() => {
        if (!mounted) return;
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-accent', accent);
        localStorage.setItem(THEME_KEY, theme);
        localStorage.setItem(ACCENT_KEY, accent);

        // Set cookie for SSR
        document.cookie = `theme=${theme};path=/;max-age=31536000`;
        document.cookie = `accent=${accent};path=/;max-age=31536000`;
    }, [theme, accent, mounted]);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const setAccent = useCallback((a: AccentColor) => {
        setAccentState(a);
    }, []);

    return {
        theme,
        accent,
        mounted,
        setTheme,
        toggleTheme,
        setAccent,
    };
}

export const ACCENT_COLORS: { value: AccentColor; label: string; color: string }[] = [
    { value: 'blue', label: 'Blue', color: '#3b82f6' },
    { value: 'purple', label: 'Purple', color: '#a855f7' },
    { value: 'green', label: 'Green', color: '#10b981' },
    { value: 'orange', label: 'Orange', color: '#f97316' },
    { value: 'pink', label: 'Pink', color: '#ec4899' },
    { value: 'red', label: 'Red', color: '#ef4444' },
    { value: 'teal', label: 'Teal', color: '#14b8a6' },
    { value: 'indigo', label: 'Indigo', color: '#6366f1' },
];
