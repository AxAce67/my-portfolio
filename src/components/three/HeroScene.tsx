'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import { useRef, useMemo, Suspense, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import * as THREE from 'three';

type SceneTone = {
    wireA: string;
    wireAOpacity: number;
    wireB: string;
    wireBOpacity: number;
    sphere: string;
    sphereOpacity: number;
    particles: string;
    particlesOpacity: number;
    particlesSize: number;
    ambient: number;
};

/* ---------- Wireframe Icosahedron ---------- */

function WireIcosahedron({ tone }: { tone: SceneTone }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((_state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.08;
            meshRef.current.rotation.y += delta * 0.12;
        }
    });

    return (
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
            <mesh ref={meshRef} position={[2.5, 0.5, -1]}>
                <icosahedronGeometry args={[1.8, 1]} />
                <meshBasicMaterial
                    wireframe
                    color={tone.wireA}
                    transparent
                    opacity={tone.wireAOpacity}
                />
            </mesh>
        </Float>
    );
}

/* ---------- Wireframe Torus ---------- */

function WireTorus({ tone }: { tone: SceneTone }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((_state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.05;
            meshRef.current.rotation.z += delta * 0.1;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            <mesh ref={meshRef} position={[-2.8, -0.5, -2]}>
                <torusGeometry args={[1.2, 0.3, 16, 32]} />
                <meshBasicMaterial
                    wireframe
                    color={tone.wireB}
                    transparent
                    opacity={tone.wireBOpacity}
                />
            </mesh>
        </Float>
    );
}

/* ---------- Distorted Sphere ---------- */

function DistortedSphere({ tone }: { tone: SceneTone }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((_state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.15;
        }
    });

    return (
        <Float speed={1.2} rotationIntensity={0.4} floatIntensity={1}>
            <mesh ref={meshRef} position={[0, 0, -3]} scale={2.2}>
                <icosahedronGeometry args={[1, 4]} />
                <MeshDistortMaterial
                    wireframe
                    color={tone.sphere}
                    transparent
                    opacity={tone.sphereOpacity}
                    distort={0.3}
                    speed={2}
                />
            </mesh>
        </Float>
    );
}

function SimpleSphere({ tone }: { tone: SceneTone }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((_state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.08;
        }
    });

    return (
        <Float speed={0.9} rotationIntensity={0.15} floatIntensity={0.4}>
            <mesh ref={meshRef} position={[0, 0, -3]} scale={1.75}>
                <icosahedronGeometry args={[1, 1]} />
                <meshBasicMaterial
                    wireframe
                    color={tone.sphere}
                    transparent
                    opacity={tone.sphereOpacity}
                />
            </mesh>
        </Float>
    );
}

/* ---------- Floating Particles ---------- */

function Particles({ count = 80, tone }: { count?: number; tone: SceneTone }) {
    const meshRef = useRef<THREE.Points>(null);

    const positions = useMemo(() => {
        const arr = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            arr[i * 3] = (Math.random() - 0.5) * 14;
            arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
            arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return arr;
    }, [count]);

    useFrame((_state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.02;
        }
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={tone.particlesSize}
                color={tone.particles}
                transparent
                opacity={tone.particlesOpacity}
                sizeAttenuation
            />
        </points>
    );
}

/* ---------- Mouse Parallax ---------- */

function MouseTracker() {
    const { camera } = useThree();

    useFrame(({ pointer }) => {
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.5, 0.05);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.3, 0.05);
        camera.lookAt(0, 0, 0);
    });

    return null;
}

/* ---------- Main Scene ---------- */

export default function HeroScene({ quality = 'full' }: { quality?: 'full' | 'lite' }) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const [isVisible, setIsVisible] = useState(false);
    const isLite = quality === 'lite';

    useEffect(() => {
        const id = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const tone: SceneTone = isDark
        ? {
            wireA: '#c7c7c7',
            wireAOpacity: 0.45,
            wireB: '#a8a8a8',
            wireBOpacity: 0.4,
            sphere: '#d6d6d6',
            sphereOpacity: 0.22,
            particles: '#d9d9d9',
            particlesOpacity: 0.72,
            particlesSize: 0.024,
            ambient: 0.7,
        }
        : {
            wireA: '#555555',
            wireAOpacity: 0.3,
            wireB: '#444444',
            wireBOpacity: 0.25,
            sphere: '#666666',
            sphereOpacity: 0.15,
            particles: '#888888',
            particlesOpacity: 0.6,
            particlesSize: 0.02,
            ambient: 0.5,
        };

    return (
        <div
            className={`absolute inset-0 -z-10 transition-opacity ease-out ${isVisible ? 'opacity-100' : 'opacity-0'
                }`}
            style={{ transitionDuration: '1800ms' }}
        >
            <Canvas
                camera={{ position: [0, 0, 6], fov: 50 }}
                dpr={isLite ? [1, 1.1] : [1, 1.5]}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={isLite ? Math.max(0.45, tone.ambient - 0.12) : tone.ambient} />
                    {!isLite && <WireIcosahedron tone={tone} />}
                    {!isLite && <WireTorus tone={tone} />}
                    {isLite ? <SimpleSphere tone={tone} /> : <DistortedSphere tone={tone} />}
                    <Particles count={isLite ? 28 : 80} tone={tone} />
                    {!isLite && <MouseTracker />}
                </Suspense>
            </Canvas>
        </div>
    );
}
