'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode, useEffect, useRef, useState } from 'react';

type Props = {
    children: ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none' | 'scale';
    duration?: number;
    once?: boolean;
};

const directionOffset = {
    up: { y: 32, x: 0, scale: 1 },
    down: { y: -32, x: 0, scale: 1 },
    left: { y: 0, x: -32, scale: 1 },
    right: { y: 0, x: 32, scale: 1 },
    none: { y: 0, x: 0, scale: 1 },
    scale: { y: 0, x: 0, scale: 0.95 },
};

export function ScrollReveal({
    children,
    className = '',
    delay = 0,
    direction = 'up',
    duration = 0.6,
    once = true,
}: Props) {
    const offset = directionOffset[direction];
    const prefersReducedMotion = useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || prefersReducedMotion) return;

        // レイアウト安定を待ってから Observer を設定
        const timerId = window.setTimeout(() => {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        if (once) observer.disconnect();
                    }
                },
                { rootMargin: '-60px 0px' },
            );
            observer.observe(el);
            cleanup = () => observer.disconnect();
        }, 100);

        let cleanup = () => { };
        return () => {
            window.clearTimeout(timerId);
            cleanup();
        };
    }, [once, prefersReducedMotion]);

    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: offset.y, x: offset.x, scale: offset.scale }}
            animate={isInView
                ? { opacity: 1, y: 0, x: 0, scale: 1 }
                : { opacity: 0, y: offset.y, x: offset.x, scale: offset.scale }
            }
            transition={{
                duration,
                delay,
                ease: [0.25, 0.1, 0.25, 1],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function StaggerContainer({
    children,
    className = '',
    staggerDelay = 0.1,
    forceVisible = false,
}: {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
    forceVisible?: boolean;
}) {
    if (forceVisible) {
        return <div className={className}>{children}</div>;
    }
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({
    children,
    className = '',
    forceVisible = false,
}: {
    children: ReactNode;
    className?: string;
    forceVisible?: boolean;
}) {
    if (forceVisible) {
        return <div className={className}>{children}</div>;
    }
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
