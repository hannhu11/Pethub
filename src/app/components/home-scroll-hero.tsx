import { motion } from 'motion/react';
import {
  BrainCircuit, Layers3, PawPrint, QrCode, Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const DESKTOP_BREAKPOINT = 1280;
const INITIAL_PRELOAD_COUNT = 14;
const SMOOTHING_FACTOR = 0.12;
const SETTLE_THRESHOLD = 0.0008;

const FIREFLY_SOURCE = {
  desktopDir: '/assets/scroll-frames/firefly-desktop',
  desktopCount: 121,
  poster: '/assets/scroll-frames/firefly-poster.webp',
  focalPoint: { x: 0.56, y: 0.47 },
  baseZoom: 1.24,
  zoomTravel: 0.14,
  brightnessLift: 1.08,
};

const storyPhases = [
  {
    heading: 'Nâng chuẩn Digital Pet ID',
    desc: 'Trải nghiệm hình ảnh 4K toàn cảnh, mượt mà chuẩn công nghệ.',
    icon: PawPrint,
    align: 'left' as const,
  },
  {
    heading: 'Dữ liệu mở lớp mượt mà',
    desc: 'Tách lớp rõ ràng thông tin cơ bản, hồ sơ y tế, lịch tiêm.',
    icon: Layers3,
    align: 'right' as const,
  },
  {
    heading: 'Minh bạch đến từng vi mạch',
    desc: 'Một lần quét, toàn bộ hành trình chăm sóc hiện ra.',
    icon: QrCode,
    align: 'left' as const,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPhaseIndex(progress: number) {
  if (progress < 0.35) return 0;
  if (progress < 0.7) return 1;
  return 2;
}

function buildFrameSources(directory: string, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const fileNumber = String(index + 1).padStart(3, '0');
    return `${directory}/frame-${fileNumber}.webp`;
  });
}

export function HomeScrollHero() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef<Array<HTMLImageElement | null>>([]);
  const frameRef = useRef(-1);
  const phaseRef = useRef(0);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const desktopSources = useMemo(
    () => buildFrameSources(FIREFLY_SOURCE.desktopDir, FIREFLY_SOURCE.desktopCount),
    [],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const desktopQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncViewportState = () => {
      setIsDesktop(desktopQuery.matches);
      setPrefersReducedMotion(motionQuery.matches);
    };

    syncViewportState();

    desktopQuery.addEventListener('change', syncViewportState);
    motionQuery.addEventListener('change', syncViewportState);

    return () => {
      desktopQuery.removeEventListener('change', syncViewportState);
      motionQuery.removeEventListener('change', syncViewportState);
    };
  }, []);

  useEffect(() => {
    frameRef.current = -1;
    phaseRef.current = 0;
    targetProgressRef.current = 0;
    currentProgressRef.current = 0;
    setPhaseIndex(0);
  }, [isDesktop, prefersReducedMotion]);

  const drawFrame = (requestedIndex: number, progress: number) => {
    const canvas = canvasRef.current;
    const wrap = canvasWrapRef.current;
    if (!canvas || !wrap || !desktopSources.length) return false;

    let drawIndex = requestedIndex;
    let image = imagesRef.current[requestedIndex];

    if (!image) {
      for (let offset = 1; offset < desktopSources.length; offset += 1) {
        const forward = requestedIndex + offset;
        const backward = requestedIndex - offset;

        if (forward < desktopSources.length && imagesRef.current[forward]) {
          drawIndex = forward;
          image = imagesRef.current[forward];
          break;
        }

        if (backward >= 0 && imagesRef.current[backward]) {
          drawIndex = backward;
          image = imagesRef.current[backward];
          break;
        }
      }
    }

    if (!image) return false;

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const width = wrap.clientWidth;
    const height = wrap.clientHeight;
    if (!width || !height) return false;

    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;
    if (!imageWidth || !imageHeight) return false;

    const coverScale = Math.max(width / imageWidth, height / imageHeight);
    const zoom = FIREFLY_SOURCE.baseZoom + (FIREFLY_SOURCE.zoomTravel * progress);
    const drawWidth = imageWidth * coverScale * zoom;
    const drawHeight = imageHeight * coverScale * zoom;

    const focalX = FIREFLY_SOURCE.focalPoint.x * drawWidth;
    const focalY = FIREFLY_SOURCE.focalPoint.y * drawHeight;
    const minX = Math.min(width - drawWidth, 0);
    const minY = Math.min(height - drawHeight, 0);

    const x = clamp((width * 0.5) - focalX, minX, 0);
    const y = clamp((height * 0.5) - focalY, minY, 0);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f4eadf';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.save();
    ctx.filter = `brightness(${FIREFLY_SOURCE.brightnessLift}) saturate(1.04)`;
    ctx.drawImage(image, x, y, drawWidth, drawHeight);
    ctx.restore();

    const glow = ctx.createRadialGradient(width * 0.24, height * 0.18, 0, width * 0.24, height * 0.18, width * 0.55);
    glow.addColorStop(0, 'rgba(255,255,255,0.28)');
    glow.addColorStop(0.45, 'rgba(255,255,255,0.08)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    frameRef.current = drawIndex;
    return true;
  };

  useEffect(() => {
    if (!isDesktop || prefersReducedMotion || !desktopSources.length) {
      setIsReady(false);
      return undefined;
    }

    let cancelled = false;
    let delayedHandle: number | null = null;

    imagesRef.current = Array.from({ length: desktopSources.length }, () => null);
    setIsReady(false);

    const posterImage = new Image();
    posterImage.decoding = 'async';
    posterImage.src = FIREFLY_SOURCE.poster;

    const loadSingleFrame = (index: number) => new Promise<void>((resolve) => {
      if (imagesRef.current[index]) {
        resolve();
        return;
      }

      const image = new Image();
      image.decoding = 'async';
      image.onload = async () => {
        imagesRef.current[index] = image;
        if (typeof image.decode === 'function') {
          try {
            await image.decode();
          } catch {
            // Browser may interrupt image decoding on tab switches.
          }
        }
        resolve();
      };
      image.onerror = () => {
        console.warn(`Failed to load Firefly frame: ${desktopSources[index]}`);
        resolve();
      };
      image.src = desktopSources[index];
    });

    const initialIndexes = Array.from(
      { length: Math.min(INITIAL_PRELOAD_COUNT, desktopSources.length) },
      (_, index) => index,
    );

    Promise.all([posterImage.decode?.().catch(() => undefined), loadSingleFrame(0)])
      .then(() => {
        if (cancelled) return;
        setIsReady(true);
        drawFrame(0, 0);
      });

    Promise.all(initialIndexes.slice(1).map((index) => loadSingleFrame(index)))
      .then(() => {
        if (!cancelled) {
          drawFrame(0, 0);
        }
      });

    delayedHandle = window.setTimeout(() => {
      desktopSources.forEach((_, index) => {
        if (index >= INITIAL_PRELOAD_COUNT) {
          void loadSingleFrame(index);
        }
      });
    }, 140);

    return () => {
      cancelled = true;
      if (delayedHandle !== null) {
        window.clearTimeout(delayedHandle);
      }
    };
  }, [desktopSources, isDesktop, prefersReducedMotion]);

  useEffect(() => {
    if (!isDesktop || prefersReducedMotion || !isReady || !desktopSources.length) return undefined;

    const renderProgress = (progress: number) => {
      const nextPhase = getPhaseIndex(progress);
      if (nextPhase !== phaseRef.current) {
        phaseRef.current = nextPhase;
        setPhaseIndex(nextPhase);
      }

      const frameIndex = Math.round(progress * (desktopSources.length - 1));
      drawFrame(frameIndex, progress);
    };

    const measureProgress = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return 0;

      const rect = wrapper.getBoundingClientRect();
      const maxScroll = Math.max(wrapper.offsetHeight - window.innerHeight, 1);
      return clamp((-rect.top) / maxScroll, 0, 1);
    };

    const stepAnimation = () => {
      const diff = targetProgressRef.current - currentProgressRef.current;

      if (Math.abs(diff) < SETTLE_THRESHOLD) {
        currentProgressRef.current = targetProgressRef.current;
      } else {
        currentProgressRef.current += diff * SMOOTHING_FACTOR;
      }

      renderProgress(currentProgressRef.current);

      if (Math.abs(targetProgressRef.current - currentProgressRef.current) >= SETTLE_THRESHOLD) {
        rafRef.current = window.requestAnimationFrame(stepAnimation);
      } else {
        rafRef.current = null;
      }
    };

    const requestSync = () => {
      targetProgressRef.current = measureProgress();
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(stepAnimation);
      }
    };

    currentProgressRef.current = measureProgress();
    targetProgressRef.current = currentProgressRef.current;
    renderProgress(currentProgressRef.current);

    window.addEventListener('scroll', requestSync, { passive: true });
    window.addEventListener('resize', requestSync);
    requestSync();

    return () => {
      window.removeEventListener('scroll', requestSync);
      window.removeEventListener('resize', requestSync);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [desktopSources, isDesktop, isReady, prefersReducedMotion]);

  const phase = storyPhases[phaseIndex];
  const PhaseIcon = phase.icon;

  return (
    <section className="relative bg-[#faf8f5]">
      <div className="hidden xl:block">
        <div ref={wrapperRef} className="relative h-[340vh] bg-[#faf8f5]">
          <div className="sticky top-0 h-screen w-full overflow-hidden">
            <div
              ref={canvasWrapRef}
              className="absolute inset-0 h-full w-full bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.82),transparent_30%),radial-gradient(circle_at_78%_14%,rgba(255,255,255,0.24),transparent_24%),linear-gradient(180deg,#fdfbf8_0%,#faf8f5_100%)]"
            >
              <img
                src={FIREFLY_SOURCE.poster}
                alt="Firefly Digital Pet ID poster"
                className="absolute inset-0 h-full w-full scale-[1.04] object-cover opacity-70"
              />
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(255,255,255,0.28),transparent_33%),linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.04)_34%,rgba(250,246,241,0.10)_100%)]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#fffdfa]/86 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#faf6f1] via-[#faf7f2]/68 to-transparent" />
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-10 pt-8 2xl:px-14">
              <div className="rounded-full border border-white/65 bg-white/84 px-5 py-2.5 text-sm text-[#592518] shadow-[0_18px_36px_rgba(89,37,24,0.08)] backdrop-blur-md">
                Cuộn để mở lớp câu chuyện Digital Pet ID
              </div>
              <div className="rounded-full border border-white/65 bg-white/82 px-5 py-2.5 text-sm text-[#d56756] shadow-[0_18px_36px_rgba(89,37,24,0.08)] backdrop-blur-md">
                {FIREFLY_SOURCE.desktopCount}
                {' '}
                frame WebP
              </div>
            </div>

            {!isReady ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-4 rounded-full border border-white/60 bg-white/80 px-6 py-3 text-sm text-[#592518] shadow-[0_18px_40px_rgba(89,37,24,0.10)] backdrop-blur-md">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#d56756]/18 border-t-[#d56756]" />
                  Đang nạp chuỗi Firefly 4K
                </div>
              </div>
            ) : null}

            <motion.div
              key={phase.heading}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34 }}
              className={`pointer-events-none absolute bottom-12 z-10 max-w-[34rem] ${
                phase.align === 'left'
                  ? 'left-8 text-left 2xl:left-14'
                  : 'right-8 text-right 2xl:right-14'
              }`}
            >
              <div className={`inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/78 px-4 py-2 text-sm text-[#d56756] shadow-[0_16px_34px_rgba(89,37,24,0.08)] backdrop-blur-md ${phase.align === 'right' ? 'ml-auto' : ''}`}>
                <PhaseIcon className="h-4 w-4" />
                PetHub Scroll Story
              </div>
              <h2 className="mt-5 text-[clamp(3rem,5vw,5.2rem)] leading-[0.92] text-[#592518] drop-shadow-[0_6px_28px_rgba(255,255,255,0.35)]" style={{ fontWeight: 800 }}>
                {phase.heading}
              </h2>
              <p className={`mt-4 max-w-[28rem] text-lg leading-8 text-[#7a5248] drop-shadow-[0_4px_18px_rgba(255,255,255,0.42)] ${phase.align === 'right' ? 'ml-auto' : ''}`}>
                {phase.desc}
              </p>
            </motion.div>

            <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center">
              <div className="flex items-center gap-3 rounded-full border border-white/52 bg-white/60 px-4 py-3 shadow-[0_16px_32px_rgba(89,37,24,0.07)] backdrop-blur-md">
                {storyPhases.map((item, index) => (
                  <div
                    key={item.heading}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === phaseIndex ? 'w-16 bg-[#d56756]' : 'w-8 bg-[#d9b8aa]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="xl:hidden bg-[#faf8f5] pb-12 pt-4">
        <div className="px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[2.3rem] border border-[#e3cdc3] bg-white/82 shadow-[0_26px_60px_rgba(89,37,24,0.10)]">
            <div className="relative aspect-[14/16] overflow-hidden bg-[linear-gradient(180deg,#fffdfa_0%,#f7efe7_100%)] sm:aspect-[16/12]">
              <ImageWithFallback
                src={FIREFLY_SOURCE.poster}
                alt="Firefly Digital Pet ID poster"
                className="h-full w-full scale-[1.08] object-cover brightness-[1.06]"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.34),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.06)_35%,rgba(250,248,245,0.72)_100%)]" />
              <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/82 px-4 py-2 text-sm text-[#d56756] shadow-[0_16px_30px_rgba(89,37,24,0.08)] backdrop-blur-md">
                <Sparkles className="h-4 w-4" />
                Scroll story phiên bản nhẹ
              </div>
              <div className="absolute inset-x-5 bottom-6 text-left">
                <div className="max-w-[20rem] rounded-[1.9rem] border border-white/65 bg-white/58 p-5 shadow-[0_18px_34px_rgba(89,37,24,0.10)] backdrop-blur-xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm text-[#d56756] shadow-[0_16px_28px_rgba(89,37,24,0.08)]">
                    <BrainCircuit className="h-4 w-4" />
                    PetHub Full-Screen Story
                  </div>
                  <h2 className="mt-4 text-[clamp(2.1rem,8vw,3.3rem)] leading-[0.98] text-[#592518]" style={{ fontWeight: 800 }}>
                    Nâng chuẩn Digital Pet ID
                  </h2>
                  <p className="mt-3 max-w-[28rem] text-base leading-7 text-[#7a5248]">
                    Trải nghiệm toàn cảnh sáng hơn, rộng hơn và giữ được độ mượt cần thiết trên mobile hoặc tablet mà không phải kéo một canvas nặng.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
