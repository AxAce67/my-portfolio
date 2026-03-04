'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => setMounted(true), []);

    const toggleTheme = () => {
        const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';

        // View Transition API がサポートされていない場合はそのまま切替
        if (
            !document.startViewTransition ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            setTheme(newTheme);
            return;
        }

        // ボタンの中心座標を取得
        const button = buttonRef.current;
        if (!button) {
            setTheme(newTheme);
            return;
        }
        const rect = button.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        // 画面の最も遠い角までの距離を半径にする
        const maxRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y),
        );

        // CSS カスタムプロパティでボタン位置と半径を渡す
        document.documentElement.style.setProperty('--vt-x', `${x}px`);
        document.documentElement.style.setProperty('--vt-y', `${y}px`);
        document.documentElement.style.setProperty('--vt-r', `${maxRadius}px`);

        const transition = document.startViewTransition(() => {
            setTheme(newTheme);
        });

        transition.ready.then(() => {
            // アニメーションは CSS で制御
        });
    };

    return (
        <button
            ref={buttonRef}
            onClick={toggleTheme}
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
