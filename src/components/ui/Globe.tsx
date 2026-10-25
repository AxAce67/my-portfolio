import { useEffect, useRef } from 'react';
import type React from 'react';
import createGlobe, { type Arc, type Marker } from 'cobe';

// A marker with an `id` makes cobe publish its on-screen position as the CSS
// anchor `--cobe-<id>` and its visibility (1 in front, 0 behind the globe)
// as `--cobe-visible-<id>`. `label` is drawn next to it through that anchor.
export type GlobeMarker = Marker & { id: string; label?: string; labelSide?: 'left' | 'right' };

type GlobeProps = {
  size?: number;
  className?: string;
  markers?: GlobeMarker[];
  arcs?: Arc[];
  initialPhi?: number;
  theta?: number;
};

const NO_MARKERS: GlobeMarker[] = [];
const NO_ARCS: Arc[] = [];

export function Globe({
  size = 64,
  className = '',
  markers = NO_MARKERS,
  arcs = NO_ARCS,
  initialPhi = 4.9, // roughly centered on Japan
  theta = 0.3,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let destroyed = false;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let rafId = 0;
    let isInView = true;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let phi = initialPhi;
    let isPointerDown = false;
    let pointerX = 0;
    let dragPhi = 0;

    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      pointerX = e.clientX;
      canvas.style.cursor = 'grabbing';
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      const delta = e.clientX - pointerX;
      pointerX = e.clientX;
      dragPhi += delta * 0.005;
    };
    const onPointerUp = () => {
      isPointerDown = false;
      canvas.style.cursor = 'grab';
    };

    // Stop spending GPU time on frames nobody can see (e.g. scrolled past
    // the hero) — this is what made the page feel janky when scrolling
    // back up to the hero, since the globe kept rendering the whole time.
    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasInView = isInView;
        isInView = entry.isIntersecting;
        if (isInView && !wasInView) {
          rafId = requestAnimationFrame(animate);
        }
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    const animate = () => {
      if (destroyed || !globe || !isInView) return;
      if (!isPointerDown && !prefersReducedMotion) {
        phi += 0.001;
      }
      globe.update({ phi: phi + dragPhi });
      rafId = requestAnimationFrame(animate);
    };

    // Defer creation to the next animation frame. React 18 StrictMode runs
    // this effect's mount -> cleanup -> mount synchronously in dev, and
    // cobe's canvas/WebGL setup doesn't tolerate being created twice on the
    // same <canvas> back-to-back. The cleanup below cancels the pending
    // frame, so the "phantom" first mount never actually calls createGlobe.
    const setupFrame = requestAnimationFrame(() => {
      if (destroyed) return;

      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: size * dpr,
        height: size * dpr,
        phi,
        theta,
        dark: 1,
        diffuse: 1.1,
        scale: 1.05,
        mapSamples: 20000,
        mapBrightness: 4.5,
        baseColor: [0.32, 0.36, 0.42],
        markerColor: [0.4, 0.87, 0.76],
        glowColor: [0.48, 0.74, 1],
        opacity: 0.92,
        markers,
        markerElevation: 0.01,
        arcs,
        arcColor: [0.48, 0.74, 1],
        arcWidth: 0.35,
        arcHeight: 0.18,
      });

      canvas.style.cursor = 'grab';
      canvas.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);

      // cobe v2 has no built-in render loop / onRender hook — animate by
      // calling update() ourselves every frame.
      rafId = requestAnimationFrame(animate);
    });

    return () => {
      destroyed = true;
      observer.disconnect();
      cancelAnimationFrame(setupFrame);
      cancelAnimationFrame(rafId);
      globe?.destroy();
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [size, markers, arcs, initialPhi, theta]);

  // cobe appends its anchor elements to the canvas's parent, so the canvas,
  // anchors and labels share this positioned wrapper.
  return (
    <div className="globe-stage" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className={className}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      />
      {markers.map((marker) => (
        <span
          key={marker.id}
          className="globe-pulse"
          style={{ positionAnchor: `--cobe-${marker.id}`, opacity: `var(--cobe-visible-${marker.id}, 0)` } as React.CSSProperties}
        />
      ))}
      {markers.filter((marker) => marker.label).map((marker) => (
        <span
          key={`${marker.id}-label`}
          className={`globe-label ${marker.labelSide === 'left' ? 'globe-label--left' : ''}`}
          style={{
            positionAnchor: `--cobe-${marker.id}`,
            opacity: `var(--cobe-visible-${marker.id}, 0)`,
            filter: `blur(calc((1 - var(--cobe-visible-${marker.id}, 0)) * 6px))`,
          } as React.CSSProperties}
        >
          {marker.label}
        </span>
      ))}
    </div>
  );
}
