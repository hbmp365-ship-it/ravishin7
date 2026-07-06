import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AppPage, HubSection } from '../types/appPage';
import { SNS_CHANNELS } from '../constants/snsChannels';
import { BTN_DEFAULT, BTN_OUTLINE } from '../theme/brandColors';
import { useTheme } from '../theme/ThemeProvider';
import { ParticleTextCanvas } from './ParticleTextCanvas';

type DesignHubPageProps = {
  scrollToSection?: HubSection | null;
  onNavigate: (page: AppPage, section?: HubSection) => void;
};

type HubSectionCard = {
  id: Exclude<HubSection, 'version-info'>;
  title: string;
  subtitle: string;
  description: string;
  accentClass: string;
  borderClass: string;
};

const HUB_SECTIONS: HubSectionCard[] = [
  {
    id: 'design-system',
    title: '디자인 시스템',
    subtitle: '브랜드 아이덴티티',
    description:
      '티샷의 로고, 컬러, 타이포그래피, UI 컴포넌트 가이드를 한곳에서 확인합니다. 채널별 콘텐츠와 제품 화면에 일관된 브랜드 경험을 적용할 수 있습니다.',
    accentClass: 'text-[#006B68] dark:text-[#2dd4bf]',
    borderClass: 'border-[#006B68]/25 dark:border-[#2dd4bf]/30',
  },
  {
    id: 'content-generator',
    title: '컨텐츠 생성기',
    subtitle: 'AI 기반 콘텐츠 제작',
    description:
      '인스타 카드, 블로그, 유튜브 숏폼, 배너, AI 인물 프로필까지 포맷별로 콘텐츠를 생성합니다. 골프 도메인에 맞춘 프롬프트와 이미지 생성 워크플로를 지원합니다.',
    accentClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-500/25 dark:border-blue-400/30',
  },
  {
    id: 'sns-channels',
    title: 'SNS 채널',
    subtitle: '공식 소셜 미디어',
    description:
      '티샷의 공식 SNS 채널에서 골프 조인·친구·예약·이벤트 소식을 만나보세요. 채널별 특성에 맞는 콘텐츠를 기획·운영할 때 참고하세요.',
    accentClass: 'text-[#E4405F] dark:text-pink-400',
    borderClass: 'border-pink-500/25 dark:border-pink-400/30',
  },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const DesignHubPage: React.FC<DesignHubPageProps> = ({ scrollToSection, onNavigate }) => {
  const { theme } = useTheme();
  const sectionRefs = useRef<Partial<Record<HubSection, HTMLElement | null>>>({});
  const cardsRef = useRef<HTMLDivElement>(null);
  const [cardsReveal, setCardsReveal] = useState(0);
  const particleColor = useMemo<[number, number, number, number]>(
    () => (theme === 'dark' ? [255, 255, 255, 255] : [0, 0, 0, 255]),
    [theme]
  );

  useEffect(() => {
    if (!scrollToSection || scrollToSection === 'version-info') return;
    const target = sectionRefs.current[scrollToSection];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [scrollToSection]);

  useEffect(() => {
    const updateReveal = () => {
      const cardsEl = cardsRef.current;
      if (!cardsEl) return;

      const rect = cardsEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const fadeStart = viewportHeight * 0.92;
      const fadeEnd = viewportHeight * 0.48;
      const progress = 1 - (rect.top - fadeEnd) / (fadeStart - fadeEnd);
      setCardsReveal(clamp(progress, 0, 1));
    };

    updateReveal();
    window.addEventListener('scroll', updateReveal, { passive: true });
    window.addEventListener('resize', updateReveal);
    return () => {
      window.removeEventListener('scroll', updateReveal);
      window.removeEventListener('resize', updateReveal);
    };
  }, []);

  return (
    <div className="w-full">
      <section className="relative min-h-[200vh] w-full">
        <div className="sticky top-0 h-screen w-full bg-white dark:bg-black">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-20 sm:pt-24 lg:pt-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-3 text-sm font-medium tracking-widest text-gray-500 uppercase dark:text-white/75">
                Teeshot Design HUB
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                <span className="text-gray-500 dark:text-white/50">디자인과 콘텐츠를 잇는</span>
                <br />
                <span className="text-gray-900 dark:text-white">티샷 디자인 워크스페이스 V0.1</span>
              </h1>
              <p className="mt-5 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-white/80">
                브랜드 가이드, AI 컨텐츠 생성, SNS 채널 정보 등 티샷의 디자인 가이드를 이용해보세요.
                <br />
                필요한 영역으로 이동해 바로 작업을 시작할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="relative h-[min(680px,72vh)] w-full max-w-6xl">
              <ParticleTextCanvas
                lines={['TEESHOT', 'DESIGN']}
                sizeScale={1.38}
                particleColor={particleColor}
                edgePaddingRatio={0.16}
                autoAnimate
                idleOrbitScale={0.12}
                className="absolute inset-0"
              />
            </div>
          </div>
        </div>
      </section>

      <div
        ref={cardsRef}
        className="container mx-auto bg-gray-50 px-4 pb-8 pt-6 dark:bg-black"
        style={{
          opacity: cardsReveal,
          transform: `translateY(${(1 - cardsReveal) * 40}px)`,
          filter: `blur(${(1 - cardsReveal) * 6}px)`,
          pointerEvents: cardsReveal > 0.2 ? 'auto' : 'none',
        }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
          {HUB_SECTIONS.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              ref={(el) => {
                sectionRefs.current[section.id] = el;
              }}
              className={`scroll-mt-28 flex flex-col rounded-xl border bg-white p-6 shadow-sm dark:bg-black dark:shadow-black/20 ${section.borderClass}`}
              style={{
                opacity: clamp(cardsReveal * 1.4 - index * 0.12, 0, 1),
                transform: `translateY(${Math.max(0, (1 - cardsReveal) * (24 + index * 8))}px)`,
              }}
            >
              <div className="flex flex-1 flex-col">
                <p className={`text-xs font-semibold uppercase tracking-wider ${section.accentClass}`}>
                  {section.subtitle}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{section.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {section.description}
                </p>

                {section.id === 'sns-channels' && (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {SNS_CHANNELS.map((channel) => (
                      <li key={channel.label}>
                        <a
                          href={channel.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-block rounded-md px-2.5 py-1 text-xs ${BTN_OUTLINE}`}
                        >
                          {channel.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6 shrink-0">
                {section.id === 'content-generator' ? (
                  <button
                    type="button"
                    onClick={() => onNavigate('content-generator')}
                    className="w-full rounded-lg bg-gradient-to-r from-[#006B68] via-[#007A77] to-[#006B68] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-[#005552] hover:via-[#005955] hover:to-[#005552]"
                  >
                    컨텐츠 생성기 열기
                  </button>
                ) : section.id === 'design-system' ? (
                  <button
                    type="button"
                    disabled
                    className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium opacity-60 cursor-not-allowed ${BTN_DEFAULT}`}
                    title="준비 중입니다"
                  >
                    가이드 보기 (준비 중)
                  </button>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
