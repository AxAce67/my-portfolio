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

function useLightweightMotion() {
    const [isLightweight, setIsLightweight] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
        const update = () => setIsLightweight(mediaQuery.matches);
        update();
        mediaQuery.addEventListener?.('change', update);
        return () => mediaQuery.removeEventListener?.('change', update);
    }, []);

    return isLightweight;
}

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
    const useCompactMotion = useLightweightMotion();
    const ref = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || prefersReducedMotion) return;

        let cleanup = () => { };
        const rafId = window.requestAnimationFrame(() => {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        if (once) observer.disconnect();
                    }
                },
                { rootMargin: useCompactMotion ? '-24px 0px' : '-60px 0px' },
            );
            observer.observe(el);
            cleanup = () => observer.disconnect();
        });

        return () => {
            window.cancelAnimationFrame(rafId);
            cleanup();
        };
    }, [once, prefersReducedMotion, useCompactMotion]);

    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>;
    }

    const motionOffset = useCompactMotion
        ? { y: offset.y * 0.45, x: offset.x * 0.45, scale: direction === 'scale' ? 0.985 : offset.scale }
        : offset;
    const motionDuration = useCompactMotion ? Math.min(duration, 0.38) : duration;

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: motionOffset.y, x: motionOffset.x, scale: motionOffset.scale }}
            animate={isInView
                ? { opacity: 1, y: 0, x: 0, scale: 1 }
                : { opacity: 0, y: motionOffset.y, x: motionOffset.x, scale: motionOffset.scale }
            }
            transition={{
                duration: motionDuration,
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
    const prefersReducedMotion = useReducedMotion();
    const useCompactMotion = useLightweightMotion();

    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>;
    }

    if (forceVisible) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: useCompactMotion ? '-24px' : '-80px' }}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: useCompactMotion ? Math.min(staggerDelay, 0.05) : staggerDelay,
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
    const prefersReducedMotion = useReducedMotion();
    const useCompactMotion = useLightweightMotion();

    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>;
    }

    if (forceVisible) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: useCompactMotion ? 12 : 30 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: useCompactMotion ? 0.32 : 0.5, ease: [0.25, 0.1, 0.25, 1] },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
