import { Sparkles } from 'lucide-react';
import { type RefObject, useEffect, useRef, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const DESKTOP_BREAKPOINT = 1024;
const INITIAL_FRAME_PRELOAD = 32;

const CINEMATIC_FILM = {
  desktop: '/assets/home-video/cinematic-film-desktop.mp4',
  mobile: '/assets/home-video/cinematic-film-mobile.mp4',
  poster: '/assets/home-video/cinematic-film-poster.webp',
};

const INTERACTIVE_SCROLL = {
  framesDir: '/assets/home-video/interactive-scroll-frames',
  manifest: '/assets/home-video/interactive-scroll-manifest.json',
  mobile: '/assets/home-video/interactive-scroll-mobile.mp4',
  poster: '/assets/home-video/interactive-scroll-poster.webp',
};

const DEFAULT_SCROLL_MANIFEST = {
  frameCount: 381,
  fps: 48,
  padLength: 3,
};

const SCROLL_PHASES = [
  {
    badge: 'PetHub Motion',
    title: 'Mượt theo từng cuộn.',
    body: 'Hình ảnh mở ra theo nhịp khám phá.',
  },
  {
    badge: 'PetHub Flow',
    title: 'Dữ liệu liền mạch.',
    body: 'Mọi lớp thông tin vận hành kết nối tự nhiên.',
  },
] as const;

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
  const [isDesktop, setIsDesktop] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const desktopQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncViewport = () => {
      setIsDesktop(desktopQuery.matches);
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

  return { isDesktop, prefersReducedMotion };
}

function useAutoplayVideoInViewport(
  sectionRef: RefObject<HTMLElement | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  disabled: boolean,
) {
  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;

    if (!section || !video || disabled) return undefined;

    let shouldResume = false;

    const playVideo = () => {
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(() => undefined);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        shouldResume = entry.isIntersecting;

        if (entry.isIntersecting && document.visibilityState === 'visible') {
          playVideo();
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        video.pause();
        return;
      }

      if (shouldResume) {
        playVideo();
      }
    };

    observer.observe(section);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      video.pause();
    };
  }, [disabled, sectionRef, videoRef]);
}

function HomeCinematicFilmSection({
  isDesktop,
  prefersReducedMotion,
}: {
  isDesktop: boolean;
  prefersReducedMotion: boolean;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  const videoSource = isDesktop ? CINEMATIC_FILM.desktop : CINEMATIC_FILM.mobile;

  useEffect(() => {
    setIsReady(false);
  }, [videoSource, prefersReducedMotion]);

  useAutoplayVideoInViewport(sectionRef, videoRef, prefersReducedMotion);

  return (
    <section ref={sectionRef} className="relative isolate h-[100svh] overflow-hidden bg-[#faf8f5]">
      <ImageWithFallback
        src={CINEMATIC_FILM.poster}
        alt="PetHub cinematic hero poster"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {!prefersReducedMotion ? (
        <video
          key={videoSource}
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={CINEMATIC_FILM.poster}
          className={`absolute inset-0 h-full w-full object-cover brightness-[1.08] saturate-[1.04] contrast-[1.03] transition-opacity duration-700 ${
            isReady ? 'opacity-100' : 'opacity-0'
          }`}
          onCanPlay={() => setIsReady(true)}
        >
          <source src={videoSource} type="video/mp4" />
        </video>
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(250,248,245,0.22)_0%,rgba(250,248,245,0.12)_18%,rgba(250,248,245,0.02)_40%,rgba(250,248,245,0.00)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#faf8f5]/76 via-[#faf8f5]/26 to-transparent" />

      <div className="absolute bottom-6 left-5 z-10 sm:bottom-8 sm:left-8 lg:bottom-10 lg:left-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/84 px-4 py-2 text-[0.72rem] uppercase tracking-[0.28em] text-[#b96152] shadow-[0_16px_38px_rgba(89,37,24,0.10)] backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5" />
          PetHub Visual
        </div>
        <p className="mt-3 max-w-[24rem] text-sm leading-7 text-[#592518] sm:text-base">
          Không gian vận hành hiện đại cho pet clinic & pet store.
        </p>
      </div>
    </section>
  );
}

function HomeInteractiveScrollMobileFallback({ allowMotion }: { allowMotion: boolean }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  useAutoplayVideoInViewport(sectionRef, videoRef, !allowMotion);

  return (
    <section ref={sectionRef} className="relative isolate h-[100svh] overflow-hidden bg-[#faf8f5]">
      <ImageWithFallback
        src={INTERACTIVE_SCROLL.poster}
        alt="PetHub interactive scroll poster"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {allowMotion ? (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={INTERACTIVE_SCROLL.poster}
          className={`absolute inset-0 h-full w-full object-cover brightness-[1.08] saturate-[1.05] contrast-[1.04] transition-opacity duration-700 ${
            isReady ? 'opacity-100' : 'opacity-0'
          }`}
          onCanPlay={() => setIsReady(true)}
        >
          <source src={INTERACTIVE_SCROLL.mobile} type="video/mp4" />
        </video>
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(250,248,245,0.00)_0%,rgba(250,248,245,0.06)_48%,rgba(250,248,245,0.54)_100%)]" />

      <div className="absolute bottom-6 left-5 z-10 sm:bottom-8 sm:left-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/84 px-4 py-2 text-[0.72rem] uppercase tracking-[0.28em] text-[#b96152] shadow-[0_16px_38px_rgba(89,37,24,0.10)] backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5" />
          PetHub Flow
        </div>
        <p className="mt-3 max-w-[20rem] text-sm leading-7 text-[#592518]">
          Dữ liệu liền mạch, hiển thị rộng và mượt trên mọi thiết bị.
        </p>
      </div>
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
  const hasWarmedAllFramesRef = useRef(false);
  const hasDrawnFrameRef = useRef(false);
  const currentPhaseRef = useRef(0);
  const canvasReadyRef = useRef(false);

  const [scrollManifest, setScrollManifest] = useState(DEFAULT_SCROLL_MANIFEST);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadManifest = async () => {
      try {
        const response = await fetch(INTERACTIVE_SCROLL.manifest, { cache: 'no-store' });
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
        // Fall back to the baked default manifest.
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
    hasWarmedAllFramesRef.current = false;
    hasDrawnFrameRef.current = false;
    canvasReadyRef.current = false;
    targetProgressRef.current = 0;
    displayProgressRef.current = 0;
    currentPhaseRef.current = 0;
    setIsCanvasReady(false);
    setPhaseIndex(0);

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

        if (!hasDrawnFrameRef.current || index <= INITIAL_FRAME_PRELOAD) {
          ensureAnimationFrame();
        }
      };

      image.onerror = () => {
        loadingRef.current.delete(index);
      };
    };

    const preloadRange = (start: number, total: number) => {
      for (let offset = 0; offset < total; offset += 1) {
        loadFrame(start + offset);
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

      preloadRange(frameIndex - 2, 6);

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

      const nextPhase = progress < 0.5 ? 0 : 1;
      if (currentPhaseRef.current !== nextPhase) {
        currentPhaseRef.current = nextPhase;
        setPhaseIndex(nextPhase);
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
      const rect = section.getBoundingClientRect();
      const scrollSpan = Math.max(section.offsetHeight - window.innerHeight, 1);
      const currentOffset = clamp(-rect.top, 0, scrollSpan);
      targetProgressRef.current = currentOffset / scrollSpan;
      ensureAnimationFrame();
    };

    const tick = () => {
      rafRef.current = null;

      const nextProgress = displayProgressRef.current
        + (targetProgressRef.current - displayProgressRef.current) * 0.12;

      displayProgressRef.current = Math.abs(targetProgressRef.current - nextProgress) < 0.0006
        ? targetProgressRef.current
        : nextProgress;

      drawCurrentFrame(displayProgressRef.current);

      if (isNearViewportRef.current || Math.abs(targetProgressRef.current - displayProgressRef.current) > 0.0006) {
        ensureAnimationFrame();
      }
    };

    function ensureAnimationFrame() {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(tick);
    }

    const warmRemainingFrames = async () => {
      if (hasWarmedAllFramesRef.current) return;
      hasWarmedAllFramesRef.current = true;

      for (let index = INITIAL_FRAME_PRELOAD; index < scrollManifest.frameCount; index += 12) {
        preloadRange(index, 12);
        // Spread frame loading to keep the main thread responsive.
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => window.setTimeout(resolve, 28));
      }
    };

    preloadRange(0, INITIAL_FRAME_PRELOAD);
    resizeCanvas();
    updateTargetProgress();

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isNearViewportRef.current = entry.isIntersecting;

        if (entry.isIntersecting) {
          warmRemainingFrames();
          updateTargetProgress();
        }
      },
      { rootMargin: '160% 0px' },
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

  const phase = SCROLL_PHASES[phaseIndex];

  return (
    <section ref={sectionRef} className="relative h-[300svh] bg-[#faf8f5]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <ImageWithFallback
          src={INTERACTIVE_SCROLL.poster}
          alt="PetHub scroll poster"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full brightness-[1.08] saturate-[1.05] contrast-[1.04] transition-opacity duration-500 ${
            isCanvasReady ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(250,248,245,0.00)_0%,rgba(250,248,245,0.00)_54%,rgba(250,248,245,0.28)_100%)]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[36vw] min-w-[16rem] bg-[linear-gradient(90deg,rgba(250,248,245,0.26)_0%,rgba(250,248,245,0.10)_42%,rgba(250,248,245,0.00)_100%)]" />

        <div className="absolute bottom-7 left-5 z-10 sm:bottom-9 sm:left-8 lg:bottom-10 lg:left-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/78 bg-white/82 px-4 py-2 text-[0.72rem] uppercase tracking-[0.28em] text-[#b96152] shadow-[0_16px_38px_rgba(89,37,24,0.10)] backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            {phase.badge}
          </div>
          <div className="mt-3 max-w-[22rem] text-[#592518] transition-all duration-500">
            <p className="text-base leading-6 sm:text-lg">{phase.title}</p>
            <p className="mt-2 text-sm leading-7 text-[#7c584d] sm:text-[0.95rem]">{phase.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeInteractiveScrollSection({
  isDesktop,
  prefersReducedMotion,
}: {
  isDesktop: boolean;
  prefersReducedMotion: boolean;
}) {
  if (!isDesktop || prefersReducedMotion) {
    return <HomeInteractiveScrollMobileFallback allowMotion={!prefersReducedMotion} />;
  }

  return <HomeInteractiveScrollDesktop />;
}

export function HomeScrollHero() {
  const { isDesktop, prefersReducedMotion } = useHomepageMotionSettings();

  return (
    <>
      <HomeCinematicFilmSection
        isDesktop={isDesktop}
        prefersReducedMotion={prefersReducedMotion}
      />
      <HomeInteractiveScrollSection
        isDesktop={isDesktop}
        prefersReducedMotion={prefersReducedMotion}
      />
    </>
  );
}
