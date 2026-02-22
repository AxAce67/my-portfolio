'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    return (
        <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="inline-flex w-9 h-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle theme"
            disabled={!mounted}
        >
            {mounted && resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4" strokeWidth={1.5} />
            ) : (
                <Moon className="w-4 h-4" strokeWidth={1.5} />
            )}
        </button>
    );
}
