import { Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const DESKTOP_BREAKPOINT = 1024;

const CINEMATIC_VIDEO = {
  desktop: '/assets/home-video/homepage-cinematic-desktop.mp4',
  mobile: '/assets/home-video/homepage-cinematic-mobile.mp4',
  poster: '/assets/home-video/homepage-cinematic-poster.webp',
};

export function HomeScrollHero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isDesktop, setIsDesktop] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const videoSource = isDesktop ? CINEMATIC_VIDEO.desktop : CINEMATIC_VIDEO.mobile;

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

  useEffect(() => {
    setIsReady(false);
  }, [videoSource, prefersReducedMotion]);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;

    if (!section || !video || prefersReducedMotion) return undefined;

    let shouldResume = false;

    const attemptPlay = () => {
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(() => undefined);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        shouldResume = entry.isIntersecting;

        if (entry.isIntersecting && document.visibilityState === 'visible') {
          attemptPlay();
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        video.pause();
        return;
      }

      if (shouldResume) {
        attemptPlay();
      }
    };

    video.playbackRate = 0.96;
    observer.observe(section);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      video.pause();
    };
  }, [prefersReducedMotion, videoSource]);

  return (
    <section className="bg-[#faf8f5] py-6 md:py-10">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div
          ref={sectionRef}
          className="relative overflow-hidden rounded-[2.5rem] border border-[#e7d4cc] bg-[#fdf9f5] shadow-[0_28px_80px_rgba(89,37,24,0.10)]"
        >
          <div className="relative h-[60vh] min-h-[28rem] sm:h-[68vh] lg:h-[88vh] lg:min-h-[44rem]">
            <ImageWithFallback
              src={CINEMATIC_VIDEO.poster}
              alt="PetHub cinematic homepage poster"
              className="absolute inset-0 h-full w-full object-cover object-[72%_center]"
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
                poster={CINEMATIC_VIDEO.poster}
                className={`absolute inset-0 h-full w-full object-cover object-[72%_center] brightness-[1.03] saturate-[1.06] transition-opacity duration-700 ${
                  isReady ? 'opacity-100' : 'opacity-0'
                }`}
                onCanPlay={() => setIsReady(true)}
              >
                <source src={videoSource} type="video/mp4" />
              </video>
            ) : null}

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(250,248,245,0.96)_0%,rgba(250,248,245,0.82)_28%,rgba(250,248,245,0.36)_56%,rgba(250,248,245,0.06)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#fffdfa]/72 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#faf6f1] via-[#faf7f3]/72 to-transparent" />

            <div className="absolute inset-y-0 left-0 flex items-center">
              <div className="max-w-[34rem] px-6 py-8 sm:px-10 lg:px-14">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/82 px-4 py-2 text-sm text-[#d56756] shadow-[0_16px_36px_rgba(89,37,24,0.08)] backdrop-blur-md">
                  <Sparkles className="h-4 w-4" />
                  PetHub Cinematic Story
                </div>
                <h2 className="mt-5 text-[clamp(2.5rem,5vw,5.4rem)] leading-[0.94] text-[#592518]" style={{ fontWeight: 800 }}>
                  Không gian chăm sóc thú cưng hiện đại, sáng và giàu chiều sâu
                </h2>
                <p className="mt-5 max-w-[29rem] text-base leading-8 text-[#7a5248] sm:text-lg">
                  Video 4K tự chạy giúp trải nghiệm mượt ngay cả khi người dùng dừng cuộn.
                  Chúng tôi giữ bố cục rộng, ánh sáng ấm và chiều sâu vừa đủ để phần mở đầu của PetHub nhìn cao cấp hơn mà không còn cảm giác giật hay bị ép phải scroll liên tục.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
