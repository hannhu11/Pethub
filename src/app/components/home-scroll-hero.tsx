import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, BrainCircuit, Layers3, PawPrint, QrCode } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const FRAME_COUNT = 300;
const INITIAL_PRELOAD_COUNT = 24;
const DESKTOP_BREAKPOINT = 1024;
const HERO_FRAME_PATH = '/assets/scroll-frames/dog-3d';

const heroMetrics = [
  { num: '12M+', label: 'Thú cưng VN' },
  { num: '3,100+', label: 'Cửa hàng' },
  { num: '95M$', label: 'Quy mô TT' },
];

const storyPhases = [
  {
    heading: 'Mỗi thú cưng, một danh tính số riêng',
    desc: 'PetHub biến hồ sơ thú cưng thành một thẻ định danh hiện đại, gọn gàng và dễ truy xuất ngay từ lần chạm đầu tiên.',
    icon: PawPrint,
    range: [0, 0.3] as const,
  },
  {
    heading: 'Dữ liệu được tổ chức thành nhiều lớp rõ ràng',
    desc: 'Từ thông tin cơ bản, lịch sử chăm sóc đến các mốc theo dõi quan trọng, mọi dữ liệu được sắp xếp mạch lạc để đội ngũ vận hành nhanh và chính xác hơn.',
    icon: Layers3,
    range: [0.3, 0.7] as const,
  },
  {
    heading: 'Một lần quét, toàn bộ hành trình chăm sóc hiện ra',
    desc: 'PetHub kết nối định danh, hồ sơ và trải nghiệm theo dõi thành một hệ thống thống nhất, hiện đại và đáng tin cậy cho pet shop và phòng khám.',
    icon: QrCode,
    range: [0.7, 1] as const,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPhaseIndex(progress: number) {
  if (progress < storyPhases[0].range[1]) return 0;
  if (progress < storyPhases[1].range[1]) return 1;
  return 2;
}

function useHeroFrameSources() {
  return useMemo(
    () => Array.from({ length: FRAME_COUNT }, (_, index) => {
      const fileNumber = String(index + 1).padStart(3, '0');
      return `${HERO_FRAME_PATH}/ezgif-frame-${fileNumber}.jpg`;
    }),
    [],
  );
}

export function HomeScrollHero() {
  const frameSources = useHeroFrameSources();
  const mobilePoster = frameSources[0];
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<Array<HTMLImageElement | null>>(Array.from({ length: FRAME_COUNT }, () => null));
  const phaseRef = useRef(0);
  const frameRef = useRef(-1);
  const rafRef = useRef<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

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
    phaseRef.current = 0;
    frameRef.current = -1;
    setPhaseIndex(0);
  }, [isDesktop, prefersReducedMotion]);

  const drawFrame = (requestedIndex: number) => {
    const canvas = canvasRef.current;
    const wrap = canvasWrapRef.current;
    if (!canvas || !wrap || !frameSources.length) return false;

    let drawIndex = requestedIndex;
    let image = imagesRef.current[requestedIndex];

    if (!image) {
      for (let offset = 1; offset < FRAME_COUNT; offset += 1) {
        const forward = requestedIndex + offset;
        const backward = requestedIndex - offset;
        if (forward < FRAME_COUNT && imagesRef.current[forward]) {
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
    if (!isDesktop || prefersReducedMotion) {
      setIsReady(false);
      return undefined;
    }

    let cancelled = false;
    let delayedHandle: number | null = null;
    imagesRef.current = Array.from({ length: FRAME_COUNT }, () => null);
    setIsReady(false);

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
            // Fallback to loaded bitmap if decode is unsupported or interrupted.
          }
        }
        resolve();
      };
      image.onerror = () => resolve();
      image.src = frameSources[index];
    });

    const initialIndexes = Array.from({ length: INITIAL_PRELOAD_COUNT }, (_, index) => index);

    loadSingleFrame(0).then(() => {
      if (cancelled) return;
      setIsReady(true);
      drawFrame(0);
    });

    Promise.all(initialIndexes.slice(1).map((index) => loadSingleFrame(index))).then(() => {
      if (cancelled) return;
      drawFrame(0);
    });

    delayedHandle = window.setTimeout(() => {
      frameSources.forEach((_, index) => {
        if (index >= INITIAL_PRELOAD_COUNT) {
          void loadSingleFrame(index);
        }
      });
    }, 120);

    return () => {
      cancelled = true;
      if (delayedHandle !== null) {
        window.clearTimeout(delayedHandle);
      }
    };
  }, [frameSources, isDesktop, prefersReducedMotion]);

  useEffect(() => {
    if (!isDesktop || prefersReducedMotion || !isReady) return undefined;

    const updateFromScroll = () => {
      rafRef.current = null;

      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const rect = wrapper.getBoundingClientRect();
      const maxScroll = Math.max(wrapper.offsetHeight - window.innerHeight, 1);
      const progress = clamp((-rect.top) / maxScroll, 0, 1);
      const targetFrame = Math.round(progress * (FRAME_COUNT - 1));
      const nextPhase = getPhaseIndex(progress);

      if (nextPhase !== phaseRef.current) {
        phaseRef.current = nextPhase;
        setPhaseIndex(nextPhase);
      }

      if (targetFrame !== frameRef.current) {
        drawFrame(targetFrame);
      } else if (targetFrame === 0) {
        drawFrame(0);
      }
    };

    const requestUpdate = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(updateFromScroll);
    };

    requestUpdate();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isDesktop, prefersReducedMotion, isReady]);

  const phase = storyPhases[phaseIndex];
  const PhaseIcon = phase.icon;

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(213,103,86,0.11),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(89,37,24,0.08),_transparent_30%),linear-gradient(180deg,_#fffdfa_0%,_#fdfbf8_100%)]">
      <div className="hidden lg:block">
        <div ref={wrapperRef} className="relative h-[340vh]">
          <div className="sticky top-16 h-[calc(100vh-4rem)]">
            <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
              <div className="grid h-full w-full grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] items-center gap-12 py-10">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="relative z-10 max-w-xl"
                >
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d56756]/35 bg-white/75 px-4 py-2 text-sm text-[#d56756] backdrop-blur-sm">
                    <BrainCircuit className="h-4 w-4" />
                    Digital Pet Identity Platform
                  </div>
                  <h1 className="max-w-[12ch] text-5xl leading-[1.08] text-[#592518]" style={{ fontWeight: 700 }}>
                    Nền tảng định danh số cho hệ sinh thái thú cưng hiện đại
                  </h1>
                  <p className="mt-6 max-w-lg text-lg leading-8 text-[#7f594f]">
                    Thiết kế để vừa đẹp về trải nghiệm, vừa mạnh về vận hành, giúp phòng khám và pet shop quản lý hồ sơ theo cách trực quan, đồng bộ và chuẩn mực hơn.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#592518] bg-[#d56756] px-6 py-3 text-white shadow-[0_18px_40px_rgba(213,103,86,0.18)] transition-all hover:-translate-y-1"
                    >
                      Khám phá nền tảng
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#592518]/80 bg-white/95 px-6 py-3 text-[#592518] shadow-[0_16px_30px_rgba(89,37,24,0.08)] transition-all hover:-translate-y-1"
                    >
                      Nhận tư vấn miễn phí
                    </Link>
                  </div>
                  <div className="mt-10 grid grid-cols-3 gap-6">
                    {heroMetrics.map((metric) => (
                      <div key={metric.label}>
                        <p className="text-2xl text-[#d56756]" style={{ fontWeight: 700 }}>{metric.num}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#8b6a61]">{metric.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <div className="relative flex h-full items-center justify-center">
                  <div className="pointer-events-none absolute inset-y-10 left-0 w-28 rounded-full bg-[radial-gradient(circle,_rgba(213,103,86,0.22)_0%,_transparent_72%)] blur-3xl" />
                  <div className="pointer-events-none absolute inset-y-16 right-0 w-36 rounded-full bg-[radial-gradient(circle,_rgba(89,37,24,0.18)_0%,_transparent_74%)] blur-3xl" />

                  <div className="relative w-full max-w-[52rem]">
                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.12 }}
                      className="relative overflow-hidden rounded-[2.35rem] border border-[#d9b8aa] bg-white/82 shadow-[0_32px_80px_rgba(89,37,24,0.14)] backdrop-blur-sm"
                    >
                      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/70 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#fff9f4]/72 via-[#fff9f4]/22 to-transparent" />
                      <div ref={canvasWrapRef} className="relative aspect-[16/11] w-full overflow-hidden bg-[#f7f1eb]">
                        {!isReady && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-14 w-14 rounded-full border-2 border-[#d56756]/15 border-t-[#d56756] animate-spin" />
                          </div>
                        )}
                        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
                        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-6 pt-6">
                          <div className="rounded-full border border-white/55 bg-white/82 px-4 py-2 text-sm text-[#592518] shadow-[0_12px_28px_rgba(89,37,24,0.12)] backdrop-blur-md">
                            Cuộn để khám phá lõi định danh số
                          </div>
                          <div className="rounded-full border border-white/55 bg-white/82 px-4 py-2 text-sm text-[#d56756] shadow-[0_12px_28px_rgba(89,37,24,0.12)] backdrop-blur-md">
                            300 khung hình 3D đồng bộ
                          </div>
                        </div>

                        <div className="pointer-events-none absolute bottom-6 left-6 max-w-[24rem] rounded-[1.75rem] border border-white/55 bg-white/70 p-5 text-[#592518] shadow-[0_24px_44px_rgba(89,37,24,0.16)] backdrop-blur-xl">
                          <motion.div
                            key={phase.heading}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                          >
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d56756]/18 bg-[#fff9f7] px-3 py-1.5 text-sm text-[#d56756]">
                              <PhaseIcon className="h-4 w-4" />
                              Câu chuyện định danh số
                            </div>
                            <h2 className="text-2xl leading-tight" style={{ fontWeight: 700 }}>
                              {phase.heading}
                            </h2>
                            <p className="mt-3 text-sm leading-7 text-[#7f594f]">
                              {phase.desc}
                            </p>
                          </motion.div>
                          <div className="mt-5 flex gap-2">
                            {storyPhases.map((item, index) => (
                              <div
                                key={item.heading}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  index === phaseIndex ? 'w-16 bg-[#d56756]' : 'w-7 bg-[#d9b8aa]'
                                }`}
                              />
                            ))}
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
      </div>

      <div className="lg:hidden">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6">
          <div className="grid gap-10">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="max-w-xl"
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d56756]/35 bg-white/80 px-4 py-2 text-sm text-[#d56756] backdrop-blur-sm">
                <BrainCircuit className="h-4 w-4" />
                Digital Pet Identity Platform
              </div>
              <h1 className="max-w-[12ch] text-4xl leading-[1.1] text-[#592518]" style={{ fontWeight: 700 }}>
                Nền tảng định danh số cho hệ sinh thái thú cưng hiện đại
              </h1>
              <p className="mt-5 text-base leading-7 text-[#7f594f]">
                Thiết kế để vừa đẹp về trải nghiệm, vừa mạnh về vận hành, giúp phòng khám và pet shop quản lý hồ sơ theo cách trực quan, đồng bộ và chuẩn mực hơn.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative overflow-hidden rounded-[2rem] border border-[#d9b8aa] bg-white shadow-[0_28px_70px_rgba(89,37,24,0.12)]"
            >
              <div className="relative aspect-[16/11] overflow-hidden bg-[#f7f1eb]">
                <ImageWithFallback
                  src={mobilePoster}
                  alt="PetHub digital pet identity hero"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#fff9f4]/88 via-transparent to-white/16" />
                <div className="absolute bottom-4 left-4 right-4 rounded-[1.5rem] border border-white/55 bg-white/74 p-4 text-[#592518] shadow-[0_20px_42px_rgba(89,37,24,0.14)] backdrop-blur-xl">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d56756]/18 bg-[#fff9f7] px-3 py-1.5 text-sm text-[#d56756]">
                    <PawPrint className="h-4 w-4" />
                    Câu chuyện định danh số
                  </div>
                  <h2 className="text-xl leading-tight" style={{ fontWeight: 700 }}>
                    Mỗi thú cưng, một danh tính số riêng
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#7f594f]">
                    PetHub biến hồ sơ thú cưng thành một thẻ định danh hiện đại, gọn gàng và dễ truy xuất ngay từ lần chạm đầu tiên.
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#592518] bg-[#d56756] px-6 py-3 text-white shadow-[0_18px_40px_rgba(213,103,86,0.18)] transition-all hover:-translate-y-1"
              >
                Khám phá nền tảng
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#592518]/80 bg-white/95 px-6 py-3 text-[#592518] shadow-[0_16px_30px_rgba(89,37,24,0.08)] transition-all hover:-translate-y-1"
              >
                Nhận tư vấn miễn phí
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {heroMetrics.map((metric) => (
                <div key={metric.label}>
                  <p className="text-2xl text-[#d56756]" style={{ fontWeight: 700 }}>{metric.num}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8b6a61]">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
