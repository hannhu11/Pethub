import { useEffect, useRef, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const DESKTOP_BREAKPOINT = 1024;
const INITIAL_FRAME_PRELOAD = 12;
const FRAME_LOOKBACK = 2;
const FRAME_LOOKAHEAD = 8;
const PROGRESS_EASING = 0.12;
const PROGRESS_SETTLE_THRESHOLD = 0.0006;

const INTERACTIVE_SCROLL = {
  framesDir: '/assets/home-video/interactive-scroll-frames',
  manifest: '/assets/home-video/interactive-scroll-manifest.json',
  poster: '/assets/home-video/interactive-scroll-poster.webp',
};

const DEFAULT_SCROLL_MANIFEST = {
  frameCount: 381,
  fps: 48,
  padLength: 3,
};

type ViewportMode = 'unknown' | 'desktop' | 'mobile';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildFramePath(index: number, padLength: number) {
  return `${INTERACTIVE_SCROLL.framesDir}/frame-${String(index + 1).padStart(padLength, '0')}.webp`;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  viewportWidth: number,
  viewportHeight: number,
) {
  const imageRatio = image.width / image.height;
  const viewportRatio = viewportWidth / viewportHeight;

  let drawWidth = viewportWidth;
  let drawHeight = viewportHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > viewportRatio) {
    drawHeight = viewportHeight;
    drawWidth = drawHeight * imageRatio;
    offsetX = (viewportWidth - drawWidth) / 2;
  } else {
    drawWidth = viewportWidth;
    drawHeight = drawWidth / imageRatio;
    offsetY = (viewportHeight - drawHeight) / 2;
  }

  ctx.clearRect(0, 0, viewportWidth, viewportHeight);
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function useHomepageMotionSettings() {
  const [viewportMode, setViewportMode] = useState<ViewportMode>('unknown');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const desktopQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncViewport = () => {
      setViewportMode(desktopQuery.matches ? 'desktop' : 'mobile');
      setPrefersReducedMotion(reducedMotionQuery.matches);
    };

    syncViewport();
    desktopQuery.addEventListener('change', syncViewport);
    reducedMotionQuery.addEventListener('change', syncViewport);

    return () => {
      desktopQuery.removeEventListener('change', syncViewport);
      reducedMotionQuery.removeEventListener('change', syncViewport);
    };
  }, []);

  return {
    isDesktop: viewportMode === 'desktop',
    viewportReady: viewportMode !== 'unknown',
    prefersReducedMotion,
  };
}

function HomeInteractiveScrollPoster() {
  return (
    <section className="relative isolate h-[100svh] overflow-hidden bg-[#faf8f5]">
      <ImageWithFallback
        src={INTERACTIVE_SCROLL.poster}
        alt="PetHub interactive scroll poster"
        className="absolute inset-0 h-full w-full object-cover brightness-[1.08] saturate-[1.05] contrast-[1.04]"
      />
    </section>
  );
}

function HomeInteractiveScrollDesktop() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const loadingRef = useRef<Set<number>>(new Set());
  const rafRef = useRef<number | null>(null);
  const targetProgressRef = useRef(0);
  const displayProgressRef = useRef(0);
  const isNearViewportRef = useRef(false);
  const hasPrimedFramesRef = useRef(false);
  const hasDrawnFrameRef = useRef(false);
  const canvasReadyRef = useRef(false);

  const [scrollManifest, setScrollManifest] = useState(DEFAULT_SCROLL_MANIFEST);
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadManifest = async () => {
      try {
        const response = await fetch(INTERACTIVE_SCROLL.manifest);
        if (!response.ok) return;

        const manifest = await response.json();
        if (cancelled) return;

        const nextManifest = {
          frameCount: typeof manifest.frameCount === 'number' ? manifest.frameCount : DEFAULT_SCROLL_MANIFEST.frameCount,
          fps: typeof manifest.fps === 'number' ? manifest.fps : DEFAULT_SCROLL_MANIFEST.fps,
          padLength: typeof manifest.padLength === 'number' ? manifest.padLength : DEFAULT_SCROLL_MANIFEST.padLength,
        };

        setScrollManifest((current) => (
          current.frameCount === nextManifest.frameCount
          && current.fps === nextManifest.fps
          && current.padLength === nextManifest.padLength
            ? current
            : nextManifest
        ));
      } catch {
        // Keep the baked manifest when the network request fails.
      }
    };

    loadManifest();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;

    if (!section || !canvas) return undefined;

    imagesRef.current = new Map();
    loadingRef.current = new Set();
    hasPrimedFramesRef.current = false;
    hasDrawnFrameRef.current = false;
    canvasReadyRef.current = false;
    targetProgressRef.current = 0;
    displayProgressRef.current = 0;
    setIsCanvasReady(false);

    const getContext = () => canvas.getContext('2d');

    const loadFrame = (index: number) => {
      if (index < 0 || index >= scrollManifest.frameCount) return;
      if (imagesRef.current.has(index) || loadingRef.current.has(index)) return;

      loadingRef.current.add(index);

      const image = new Image();
      image.decoding = 'async';
      image.src = buildFramePath(index, scrollManifest.padLength);

      image.onload = () => {
        loadingRef.current.delete(index);
        imagesRef.current.set(index, image);

        if (isNearViewportRef.current) {
          ensureAnimationFrame();
        }
      };

      image.onerror = () => {
        loadingRef.current.delete(index);
      };
    };

    const primeInitialFrames = () => {
      if (hasPrimedFramesRef.current) return;
      hasPrimedFramesRef.current = true;

      const initialFrameCount = Math.min(INITIAL_FRAME_PRELOAD, scrollManifest.frameCount);
      for (let index = 0; index < initialFrameCount; index += 1) {
        loadFrame(index);
      }
    };

    const preloadWindow = (centerIndex: number) => {
      const start = Math.max(centerIndex - FRAME_LOOKBACK, 0);
      const end = Math.min(centerIndex + FRAME_LOOKAHEAD, scrollManifest.frameCount - 1);

      for (let index = start; index <= end; index += 1) {
        loadFrame(index);
      }
    };

    const findClosestFrame = (preferredIndex: number) => {
      const directHit = imagesRef.current.get(preferredIndex);
      if (directHit) return directHit;

      for (let offset = 1; offset < scrollManifest.frameCount; offset += 1) {
        const backward = imagesRef.current.get(preferredIndex - offset);
        if (backward) return backward;

        const forward = imagesRef.current.get(preferredIndex + offset);
        if (forward) return forward;
      }

      return undefined;
    };

    const drawCurrentFrame = (progress: number) => {
      const ctx = getContext();
      if (!ctx) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const frameIndex = Math.round(progress * (scrollManifest.frameCount - 1));
      const image = findClosestFrame(frameIndex);

      preloadWindow(frameIndex);

      if (!image) {
        loadFrame(frameIndex);
        return;
      }

      drawCoverImage(ctx, image, viewportWidth, viewportHeight);
      hasDrawnFrameRef.current = true;

      if (!canvasReadyRef.current) {
        canvasReadyRef.current = true;
        setIsCanvasReady(true);
      }
    };

    const resizeCanvas = () => {
      const ctx = getContext();
      if (!ctx) return;

      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      canvas.width = Math.round(viewportWidth * devicePixelRatio);
      canvas.height = Math.round(viewportHeight * devicePixelRatio);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      drawCurrentFrame(displayProgressRef.current);
    };

    const updateTargetProgress = () => {
      if (!isNearViewportRef.current) return;

      const rect = section.getBoundingClientRect();
      const scrollSpan = Math.max(section.offsetHeight - window.innerHeight, 1);
      const currentOffset = clamp(-rect.top, 0, scrollSpan);
      targetProgressRef.current = currentOffset / scrollSpan;
      ensureAnimationFrame();
    };

    const tick = () => {
      rafRef.current = null;

      const nextProgress = displayProgressRef.current
        + (targetProgressRef.current - displayProgressRef.current) * PROGRESS_EASING;

      displayProgressRef.current = Math.abs(targetProgressRef.current - nextProgress) < PROGRESS_SETTLE_THRESHOLD
        ? targetProgressRef.current
        : nextProgress;

      drawCurrentFrame(displayProgressRef.current);

      if (isNearViewportRef.current || Math.abs(targetProgressRef.current - displayProgressRef.current) > PROGRESS_SETTLE_THRESHOLD) {
        ensureAnimationFrame();
      }
    };

    function ensureAnimationFrame() {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(tick);
    }

    resizeCanvas();

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isNearViewportRef.current = entry.isIntersecting;

        if (entry.isIntersecting) {
          primeInitialFrames();
          updateTargetProgress();
          ensureAnimationFrame();
        }
      },
      { rootMargin: '60% 0px' },
    );

    intersectionObserver.observe(section);
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', updateTargetProgress, { passive: true });

    return () => {
      intersectionObserver.disconnect();
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', updateTargetProgress);

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [scrollManifest]);

  return (
    <section ref={sectionRef} className="relative h-[300svh] bg-[#faf8f5]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <ImageWithFallback
          src={INTERACTIVE_SCROLL.poster}
          alt="PetHub scroll poster"
          className="absolute inset-0 h-full w-full object-cover brightness-[1.08] saturate-[1.05] contrast-[1.04]"
        />

        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full brightness-[1.08] saturate-[1.05] contrast-[1.04] transition-opacity duration-500 ${
            isCanvasReady ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </section>
  );
}

function HomeInteractiveScrollSection({
  isDesktop,
  viewportReady,
  prefersReducedMotion,
}: {
  isDesktop: boolean;
  viewportReady: boolean;
  prefersReducedMotion: boolean;
}) {
  if (!viewportReady || !isDesktop || prefersReducedMotion) {
    return <HomeInteractiveScrollPoster />;
  }

  return <HomeInteractiveScrollDesktop />;
}

export function HomeScrollHero() {
  const { isDesktop, viewportReady, prefersReducedMotion } = useHomepageMotionSettings();

  return (
    <HomeInteractiveScrollSection
      isDesktop={isDesktop}
      viewportReady={viewportReady}
      prefersReducedMotion={prefersReducedMotion}
    />
  );
}
