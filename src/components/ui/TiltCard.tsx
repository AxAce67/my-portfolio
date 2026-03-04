'use client';

import { useRef, useState, useCallback } from 'react';
import type { ReactNode, MouseEvent } from 'react';

type TiltCardProps = {
    children: ReactNode;
    className?: string;
    maxTilt?: number;
    scale?: number;
    perspective?: number;
};

export function TiltCard({
    children,
    className = '',
    maxTilt = 6,
    scale = 1.01,
    perspective = 800,
}: TiltCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState({
        transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)',
        transition: 'transform 0.4s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
    });

    const handleMouseMove = useCallback(
        (e: MouseEvent<HTMLDivElement>) => {
            const card = cardRef.current;
            if (!card) return;

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -maxTilt;
            const rotateY = ((x - centerX) / centerX) * maxTilt;

            setStyle({
                transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale},${scale},${scale})`,
                transition: 'transform 0.1s ease-out',
            });
        },
        [maxTilt, scale, perspective]
    );

    const handleMouseLeave = useCallback(() => {
        setStyle({
            transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`,
            transition: 'transform 0.4s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
        });
    }, [perspective]);

    return (
        <div
            ref={cardRef}
            className={className}
            style={{ ...style, willChange: 'transform' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </div>
    );
}
