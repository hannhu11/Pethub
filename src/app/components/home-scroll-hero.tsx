import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowRight, BrainCircuit, Layers3, PawPrint, QrCode, Shield, Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

type FrameManifest = {
  desktop: {
    dir: string;
    count: number;
  };
  mobile: {
    dir: string;
    count: number;
  };
  poster: string;
};

const DESKTOP_BREAKPOINT = 1280;
const INITIAL_PRELOAD_COUNT = 14;
const MANIFEST_URL = '/assets/scroll-frames/firefly-manifest.json';
const POSTER_FALLBACK = '/assets/scroll-frames/firefly-poster.webp';
const HERO_SCROLL_HEIGHT = 'h-[352vh]';
const SMOOTHING_FACTOR = 0.14;
const SETTLE_THRESHOLD = 0.0008;

const FALLBACK_MANIFEST: FrameManifest = {
  desktop: {
    dir: '/assets/scroll-frames/firefly-desktop',
    count: 121,
  },
  mobile: {
    dir: '/assets/scroll-frames/firefly-mobile',
    count: 91,
  },
  poster: POSTER_FALLBACK,
};

const heroMetrics = [
  { num: '12M+', label: 'Thú cưng VN' },
  { num: '3,100+', label: 'Cửa hàng' },
  { num: '95M$', label: 'Quy mô TT' },
];

const heroHighlights = [
  'Chuỗi khung hình 4K dựng bằng canvas',
  'Không scrub video trực tiếp để tránh lag',
  'Không gian hiển thị rộng và sắc nét hơn',
];

const storyPhases = [
  {
    heading: 'Một chuẩn nhận diện mới cho từng thú cưng',
    desc: 'Digital Pet ID đưa hồ sơ, lịch sử chăm sóc và trải nghiệm khách hàng vào một giao diện gọn gàng, cao cấp và đáng nhớ.',
    icon: PawPrint,
    range: [0, 0.28] as const,
  },
  {
    heading: 'Dữ liệu mở lớp mượt như một sản phẩm công nghệ cao',
    desc: 'Thông tin cơ bản, hồ sơ y tế, lịch tiêm và các điểm chạm chăm sóc được tách lớp rõ ràng để đội ngũ vận hành nhanh và chính xác hơn.',
    icon: Layers3,
    range: [0.28, 0.68] as const,
  },
  {
    heading: 'Một lần quét, cả hành trình chăm sóc hiện ra',
    desc: 'PetHub kết nối phòng khám, pet shop và chủ nuôi bằng một trải nghiệm số hiện đại, minh bạch và đáng tin cậy.',
    icon: BrainCircuit,
    range: [0.68, 1] as const,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildFrameSources(directory: string, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const fileNumber = String(index + 1).padStart(3, '0');
    return `${directory}/frame-${fileNumber}.webp`;
  });
}

function getPhaseIndex(progress: number) {
  if (progress < storyPhases[0].range[1]) return 0;
  if (progress < storyPhases[1].range[1]) return 1;
  return 2;
}

export function HomeScrollHero() {
  const [manifest, setManifest] = useState<FrameManifest | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<Array<HTMLImageElement | null>>([]);
  const frameRef = useRef(-1);
  const phaseRef = useRef(0);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const resolvedManifest = manifest ?? FALLBACK_MANIFEST;
  const desktopSources = useMemo(
    () => buildFrameSources(resolvedManifest.desktop.dir, resolvedManifest.desktop.count),
    [resolvedManifest.desktop.count, resolvedManifest.desktop.dir],
  );
  const posterSource = manifest?.poster ?? POSTER_FALLBACK;

  useEffect(() => {
    let ignore = false;

    fetch(MANIFEST_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load frame manifest: ${response.status}`);
        }
        return response.json() as Promise<FrameManifest>;
      })
      .then((data) => {
        if (!ignore) {
          setManifest(data);
        }
      })
      .catch(() => {
        if (!ignore) {
          setManifest(FALLBACK_MANIFEST);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

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
  }, [desktopSources.length, isDesktop, prefersReducedMotion]);

  const drawFrame = (requestedIndex: number) => {
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

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ede2d5';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;
    if (!imageWidth || !imageHeight) return false;

    const scale = Math.max(width / imageWidth, height / imageHeight);
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;

    ctx.drawImage(image, x, y, drawWidth, drawHeight);
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
    posterImage.src = posterSource;

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
            // Browser may interrupt image decoding when switching tabs.
          }
        }
        resolve();
      };
      image.onerror = () => resolve();
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
        drawFrame(0);
      });

    Promise.all(initialIndexes.slice(1).map((index) => loadSingleFrame(index)))
      .then(() => {
        if (!cancelled) {
          drawFrame(0);
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
  }, [desktopSources, isDesktop, posterSource, prefersReducedMotion]);

  useEffect(() => {
    if (!isDesktop || prefersReducedMotion || !isReady || !desktopSources.length) return undefined;

    const renderProgress = (progress: number) => {
      const nextPhase = getPhaseIndex(progress);
      if (nextPhase !== phaseRef.current) {
        phaseRef.current = nextPhase;
        setPhaseIndex(nextPhase);
      }

      const frameIndex = Math.round(progress * (desktopSources.length - 1));
      if (frameIndex !== frameRef.current) {
        drawFrame(frameIndex);
      } else {
        drawFrame(frameIndex);
      }
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
  const mobilePhase = storyPhases[0];

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(213,103,86,0.18),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(89,37,24,0.10),_transparent_24%),linear-gradient(180deg,_#fffdfb_0%,_#faf8f5_42%,_#f7f1ea_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/75 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#faf6f1] via-[#faf6f1]/92 to-transparent" />

      <div className="hidden xl:block">
        <div ref={wrapperRef} className={`relative ${HERO_SCROLL_HEIGHT}`}>
          <div className="sticky top-16 h-[calc(100vh-4rem)]">
            <div className="mx-auto flex h-full max-w-[96rem] items-center px-4 sm:px-6 xl:px-10">
              <div className="grid h-full w-full grid-cols-[minmax(19rem,0.76fr)_minmax(32rem,1.24fr)] items-center gap-10 py-10 xl:gap-14">
                <motion.div
                  initial={{ opacity: 0, x: -28 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.65 }}
                  className="relative z-10 max-w-[35rem]"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#d56756]/30 bg-white/82 px-4 py-2 text-sm text-[#d56756] backdrop-blur-sm shadow-[0_16px_28px_rgba(213,103,86,0.10)]">
                    <Sparkles className="h-4 w-4" />
                    Hero chuyển động 4K cho Digital Pet ID
                  </div>

                  <h1 className="mt-6 max-w-[10.5ch] text-[clamp(3.35rem,5vw,5.5rem)] leading-[0.96] text-[#592518]" style={{ fontWeight: 800 }}>
                    Nâng chuẩn Digital Pet ID cho pet clinic và pet store hiện đại
                  </h1>

                  <p className="mt-6 max-w-[34rem] text-lg leading-8 text-[#7f594f] xl:text-[1.15rem] xl:leading-9">
                    PetHub đưa định danh số, hồ sơ chăm sóc và trải nghiệm khách hàng vào một phần mở đầu rộng, điện ảnh và sắc nét, để chất lượng vận hành được cảm nhận ngay từ lần cuộn đầu tiên.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    {heroHighlights.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center rounded-full border border-[#d9b8aa] bg-white/84 px-4 py-2 text-sm text-[#592518] shadow-[0_12px_24px_rgba(89,37,24,0.06)] backdrop-blur-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-wrap gap-4">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#592518] bg-[#d56756] px-6 py-3 text-white shadow-[0_22px_42px_rgba(213,103,86,0.22)] transition-all hover:-translate-y-1"
                    >
                      Khám phá nền tảng
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#592518]/75 bg-white/92 px-6 py-3 text-[#592518] shadow-[0_18px_34px_rgba(89,37,24,0.08)] transition-all hover:-translate-y-1"
                    >
                      Nhận tư vấn miễn phí
                    </Link>
                  </div>

                  <div className="mt-10 grid grid-cols-3 gap-6">
                    {heroMetrics.map((metric) => (
                      <div key={metric.label}>
                        <p className="text-3xl text-[#d56756]" style={{ fontWeight: 800 }}>
                          {metric.num}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.24em] text-[#8b6a61]">
                          {metric.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <div className="relative flex h-full items-center justify-end">
                  <div className="pointer-events-none absolute -left-8 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(213,103,86,0.26)_0%,_transparent_74%)] blur-3xl" />
                  <div className="pointer-events-none absolute right-4 top-12 h-52 w-52 rounded-full bg-[radial-gradient(circle,_rgba(89,37,24,0.18)_0%,_transparent_76%)] blur-3xl" />

                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.75, delay: 0.08 }}
                    className="relative w-full max-w-[72rem]"
                  >
                    <div className="absolute -inset-x-6 inset-y-10 rounded-[3rem] bg-[radial-gradient(circle_at_center,_rgba(213,103,86,0.18)_0%,_rgba(255,255,255,0)_68%)] blur-3xl" />
                    <div className="relative overflow-hidden rounded-[2.9rem] border border-[#dcc3b8] bg-white/78 shadow-[0_34px_90px_rgba(89,37,24,0.16)] backdrop-blur-md">
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/75 to-transparent" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#faf6f1]/85 via-[#faf6f1]/25 to-transparent" />

                      <div ref={canvasWrapRef} className="relative aspect-[19/12] w-full overflow-hidden bg-[#ece1d6]">
                        {!isReady ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex items-center gap-4 rounded-full border border-white/55 bg-white/80 px-5 py-3 text-sm text-[#592518] backdrop-blur-sm shadow-[0_14px_28px_rgba(89,37,24,0.10)]">
                              <span className="h-8 w-8 rounded-full border-2 border-[#d56756]/18 border-t-[#d56756] animate-spin" />
                              Đang nạp chuỗi khung hình Firefly 4K
                            </div>
                          </div>
                        ) : null}

                        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

                        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-7 pt-7">
                          <div className="rounded-full border border-white/60 bg-white/84 px-4 py-2 text-sm text-[#592518] backdrop-blur-md shadow-[0_16px_30px_rgba(89,37,24,0.10)]">
                            Cuộn để mở lớp câu chuyện Digital Pet ID
                          </div>
                          <div className="rounded-full border border-white/60 bg-white/84 px-4 py-2 text-sm text-[#d56756] backdrop-blur-md shadow-[0_16px_30px_rgba(89,37,24,0.10)]">
                            {resolvedManifest.desktop.count}
                            {' '}
                            frame WebP
                          </div>
                        </div>

                        <div className="pointer-events-none absolute bottom-7 left-7 max-w-[27rem] rounded-[2rem] border border-white/60 bg-white/72 p-6 text-[#592518] shadow-[0_28px_52px_rgba(89,37,24,0.16)] backdrop-blur-xl">
                          <motion.div
                            key={phase.heading}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.34 }}
                          >
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d56756]/18 bg-[#fff9f7] px-3 py-1.5 text-sm text-[#d56756]">
                              <PhaseIcon className="h-4 w-4" />
                              PetHub Scroll Story
                            </div>
                            <h2 className="text-[1.8rem] leading-tight text-[#592518]" style={{ fontWeight: 800 }}>
                              {phase.heading}
                            </h2>
                            <p className="mt-3 text-sm leading-7 text-[#7f594f] xl:text-[0.98rem]">
                              {phase.desc}
                            </p>
                          </motion.div>

                          <div className="mt-5 flex gap-2.5">
                            {storyPhases.map((item, index) => (
                              <div
                                key={item.heading}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  index === phaseIndex ? 'w-18 bg-[#d56756]' : 'w-8 bg-[#d9b8aa]'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="pointer-events-none absolute bottom-7 right-7 hidden rounded-[1.75rem] border border-white/55 bg-[#592518]/78 px-5 py-4 text-white shadow-[0_24px_48px_rgba(89,37,24,0.22)] backdrop-blur-xl 2xl:block">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14">
                              <Shield className="h-5 w-5" />
                            </div>
                            <div className="max-w-[15rem]">
                              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Trải nghiệm đầu trang</p>
                              <p className="mt-2 text-sm leading-6 text-white/92">
                                Canvas bám theo cuộn để giữ cảm giác mượt, sắc nét và kiểm soát tốt hơn trên màn hình lớn.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="xl:hidden">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 lg:px-8">
          <div className="grid gap-9 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d56756]/30 bg-white/84 px-4 py-2 text-sm text-[#d56756] shadow-[0_14px_28px_rgba(213,103,86,0.08)]">
                <Sparkles className="h-4 w-4" />
                Digital Pet ID premium showcase
              </div>

              <h1 className="mt-6 max-w-[11ch] text-[clamp(2.8rem,8vw,4.3rem)] leading-[0.98] text-[#592518]" style={{ fontWeight: 800 }}>
                Nâng chuẩn Digital Pet ID cho vận hành thú cưng hiện đại
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-[#7f594f] sm:text-lg">
                Trên mobile và tablet, PetHub giữ lại tinh thần điện ảnh bằng bố cục premium, poster nhẹ và phần nội dung tập trung để tốc độ tải luôn ổn định.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {heroHighlights.slice(0, 2).map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center rounded-full border border-[#d9b8aa] bg-white/84 px-4 py-2 text-sm text-[#592518] shadow-[0_12px_24px_rgba(89,37,24,0.06)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.62, delay: 0.08 }}
              className="relative overflow-hidden rounded-[2.4rem] border border-[#dcc3b8] bg-white/82 shadow-[0_30px_74px_rgba(89,37,24,0.14)] backdrop-blur-md"
            >
              <div className="relative aspect-[16/11] overflow-hidden bg-[#ece1d6]">
                <ImageWithFallback
                  src={posterSource}
                  alt="Firefly Digital Pet ID hero poster"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#f8f1ea]/88 via-[#f8f1ea]/12 to-white/14" />
                <div className="absolute left-5 top-5 rounded-full border border-white/60 bg-white/84 px-4 py-2 text-sm text-[#592518] shadow-[0_14px_28px_rgba(89,37,24,0.10)] backdrop-blur-sm">
                  Poster nhẹ cho mobile
                </div>
                <div className="absolute bottom-5 left-5 right-5 rounded-[1.8rem] border border-white/60 bg-white/72 p-5 text-[#592518] shadow-[0_22px_44px_rgba(89,37,24,0.14)] backdrop-blur-xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d56756]/18 bg-[#fff9f7] px-3 py-1.5 text-sm text-[#d56756]">
                    <mobilePhase.icon className="h-4 w-4" />
                    PetHub Story
                  </div>
                  <h2 className="text-[1.45rem] leading-tight" style={{ fontWeight: 800 }}>
                    {mobilePhase.heading}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#7f594f]">
                    {mobilePhase.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#592518] bg-[#d56756] px-6 py-3 text-white shadow-[0_20px_40px_rgba(213,103,86,0.20)] transition-all hover:-translate-y-1"
            >
              Khám phá nền tảng
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#592518]/75 bg-white/92 px-6 py-3 text-[#592518] shadow-[0_16px_30px_rgba(89,37,24,0.08)] transition-all hover:-translate-y-1"
            >
              Nhận tư vấn miễn phí
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-6">
            {heroMetrics.map((metric) => (
              <div key={metric.label}>
                <p className="text-2xl text-[#d56756] sm:text-3xl" style={{ fontWeight: 800 }}>
                  {metric.num}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#8b6a61]">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
