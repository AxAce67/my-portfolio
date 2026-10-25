import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import createGlobe, { type Arc, type Marker } from 'cobe';

// A marker with an `id` makes cobe publish its on-screen position as the CSS
// anchor `--cobe-<id>` and its visibility (1 in front, 0 behind the globe)
// as `--cobe-visible-<id>`. `label` (with one line per entry in `details`) is
// drawn next to it through that anchor. With `renderMarkerPanel`, clicking a
// label opens that panel under the marker and pauses the rotation.
export type GlobeMarker = Marker & { id: string; label?: string; details?: string[]; labelSide?: 'left' | 'right' };

type GlobeProps = {
  size?: number;
  className?: string;
  markers?: GlobeMarker[];
  arcs?: Arc[];
  initialPhi?: number;
  theta?: number;
  renderMarkerPanel?: (marker: GlobeMarker) => React.ReactNode;
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
  renderMarkerPanel,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [openMarkerId, setOpenMarkerId] = useState<string | null>(null);
  const pausedRef = useRef(false);
  pausedRef.current = openMarkerId !== null;

  useEffect(() => {
    if (!openMarkerId) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !stageRef.current?.contains(event.target as Node)) {
        setOpenMarkerId(null);
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [openMarkerId]);

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

    // Where CSS anchors work, the markers are drawn as flat dots in the DOM
    // (see .globe-dot) and cobe's own raised markers are shrunk out of view.
    const drawDotsInDom = CSS.supports('position-anchor: --globe');
    const globeMarkers = drawDotsInDom ? markers.map((marker) => ({ ...marker, size: 0.001 })) : markers;

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
      if (!isPointerDown && !prefersReducedMotion && !pausedRef.current) {
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
        markers: globeMarkers,
        markerElevation: 0,
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
    <div ref={stageRef} className="globe-stage">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={className}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      />
      {markers.map((marker) => (
        <span
          key={`${marker.id}-dot`}
          className="globe-dot"
          style={{
            positionAnchor: `--cobe-${marker.id}`,
            opacity: `var(--cobe-visible-${marker.id}, 0)`,
          } as React.CSSProperties}
        />
      ))}
      {markers.filter((marker) => marker.label).map((marker) => {
        const anchorStyle = {
          positionAnchor: `--cobe-${marker.id}`,
          opacity: `var(--cobe-visible-${marker.id}, 0)`,
        } as React.CSSProperties;
        const labelContent = (
          <>
            <span className="globe-label__title">{marker.label}</span>
            {marker.details?.map((detail) => (
              <span key={detail} className="globe-label__detail">{detail}</span>
            ))}
          </>
        );
        const labelClassName = `globe-label ${marker.labelSide === 'left' ? 'globe-label--left' : ''}`;
        const labelStyle = {
          ...anchorStyle,
          filter: `blur(calc((1 - var(--cobe-visible-${marker.id}, 0)) * 6px))`,
        } as React.CSSProperties;

        if (!renderMarkerPanel) {
          return (
            <span key={`${marker.id}-label`} className={labelClassName} style={labelStyle} aria-hidden="true">
              {labelContent}
            </span>
          );
        }

        const isOpen = openMarkerId === marker.id;
        return (
          <div key={`${marker.id}-label`}>
            <button
              type="button"
              className={`${labelClassName} globe-label--interactive`}
              style={labelStyle}
              aria-expanded={isOpen}
              aria-controls={`globe-panel-${marker.id}`}
              onClick={() => setOpenMarkerId(isOpen ? null : marker.id)}
            >
              {labelContent}
            </button>
            {isOpen && (
              <div id={`globe-panel-${marker.id}`} className="globe-panel" style={anchorStyle}>
                {renderMarkerPanel(marker)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
