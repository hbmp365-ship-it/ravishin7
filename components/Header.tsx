import React, { useRef, useState } from 'react';
import teeshotLogo from '../assets/teeshot-logo.png';
import teeshotLogoDark from '../assets/teeshot-logo-dark.png';
import { MoonIcon, SunIcon } from './icons';
import { useTheme } from '../theme/ThemeProvider';
import type { ThemeMode } from '../theme/ThemeProvider';
import type { AppPage, HubSection } from '../types/appPage';
import { SNS_CHANNELS } from '../constants/snsChannels';

type HeaderProps = {
  activePage?: AppPage;
  onNavigate?: (page: AppPage, section?: HubSection) => void;
};

const GLASS_NAV =
  'bg-white/95 backdrop-blur-sm backdrop-saturate-150 border-white/90 shadow-[0_1px_0_rgba(255,255,255,0.92)_inset] supports-[backdrop-filter]:bg-white/92 dark:bg-black/95 dark:border-gray-800/90 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] dark:supports-[backdrop-filter]:bg-black/92';

const NAV_DROP_SHADOW =
  'shadow-[0_2px_14px_rgba(15,23,42,0.07)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.35)]';

const GLASS_NAV_SUBMENU =
  'bg-white/95 backdrop-blur-sm backdrop-saturate-150 border-white/90 supports-[backdrop-filter]:bg-white/92 ' +
  'shadow-[0_8px_28px_-6px_rgba(15,23,42,0.10)] ' +
  'dark:bg-black/95 dark:border-gray-800/90 dark:supports-[backdrop-filter]:bg-black/92 ' +
  'dark:shadow-[0_10px_32px_-6px_rgba(0,0,0,0.48)]';

const NAV_ITEM_BASE =
  'whitespace-nowrap py-4 text-[15px] transition-colors duration-200';

const navItemClass = (active: boolean) =>
  active
    ? `${NAV_ITEM_BASE} font-semibold text-[#006B68] dark:text-[#2dd4bf]`
    : `${NAV_ITEM_BASE} font-normal text-gray-800 hover:text-gray-950 dark:text-gray-200 dark:hover:text-white`;

const headerSubtitle = (activePage: AppPage): string => {
  if (activePage === 'content-generator') return 'Content Generator V 0.1';
  return 'Teeshot Design HUB';
};

type ThemeToggleProps = {
  theme: ThemeMode;
  onChange: (theme: ThemeMode) => void;
};

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onChange }) => (
  <div
    className="flex items-center rounded-full border border-gray-200/90 bg-gray-100/90 p-0.5 dark:border-gray-700 dark:bg-black/90"
    role="group"
    aria-label="테마 설정"
  >
    <button
      type="button"
      onClick={() => onChange('light')}
      aria-pressed={theme === 'light'}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
        theme === 'light'
          ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
      }`}
    >
      <SunIcon className="h-3.5 w-3.5" aria-hidden />
      <span className="hidden sm:inline">Light</span>
    </button>
    <button
      type="button"
      onClick={() => onChange('dark')}
      aria-pressed={theme === 'dark'}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
        theme === 'dark'
          ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
      }`}
    >
      <MoonIcon className="h-3.5 w-3.5" aria-hidden />
      <span className="hidden sm:inline">Dark</span>
    </button>
  </div>
);

export const Header: React.FC<HeaderProps> = ({ activePage = 'hub' as AppPage, onNavigate }) => {
  const { theme, setTheme } = useTheme();
  const [snsMenuOpen, setSnsMenuOpen] = useState(false);
  const snsCloseTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const openSnsMenu = () => {
    if (snsCloseTimerRef.current) clearTimeout(snsCloseTimerRef.current);
    setSnsMenuOpen(true);
  };

  const scheduleCloseSnsMenu = () => {
    if (snsCloseTimerRef.current) clearTimeout(snsCloseTimerRef.current);
    snsCloseTimerRef.current = setTimeout(() => setSnsMenuOpen(false), 220);
  };

  const navigate = (page: AppPage, section?: HubSection) => {
    onNavigate?.(page, section);
    if (!(page === 'hub' && section)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`relative sticky top-0 z-50 border-b border-gray-200/80 dark:border-gray-800/80 ${NAV_DROP_SHADOW} ${GLASS_NAV}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-[72px] items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('hub')}
            className="flex min-w-0 items-center gap-5 rounded-md text-left transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B68]/40"
            aria-label="Teeshot Design HUB 메인으로 이동"
          >
            <img
              src={theme === 'dark' ? teeshotLogoDark : teeshotLogo}
              alt="TEESHOT"
              className="h-8 w-auto shrink-0"
            />
            <span className="hidden truncate text-[13px] font-light tracking-wide text-gray-400 dark:text-gray-500 sm:inline">
              {headerSubtitle(activePage)}
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-4 sm:gap-6">
            <nav className="flex h-full items-center gap-5 sm:gap-8" aria-label="주요 메뉴">
              <button
                type="button"
                onClick={() => navigate('hub', 'design-system')}
                className={navItemClass(activePage === 'design-system')}
              >
                디자인시스템
              </button>
              <button
                type="button"
                onClick={() => navigate('content-generator')}
                aria-current={activePage === 'content-generator' ? 'page' : undefined}
                className={navItemClass(activePage === 'content-generator')}
              >
                컨텐츠생성기
              </button>

              <div
                className="relative flex h-full items-center"
                onMouseEnter={openSnsMenu}
                onMouseLeave={scheduleCloseSnsMenu}
              >
                <span
                  className={`${NAV_ITEM_BASE} cursor-default select-none font-normal text-gray-800 transition-all duration-200 ${snsMenuOpen ? 'font-semibold' : ''} dark:text-gray-200`}
                  aria-haspopup="true"
                  aria-expanded={snsMenuOpen}
                >
                  SNS채널
                </span>

                <div
                  className={`fixed inset-x-0 top-[72px] z-50 transition-opacity duration-200 ${
                    snsMenuOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
                  }`}
                  onMouseEnter={openSnsMenu}
                  onMouseLeave={scheduleCloseSnsMenu}
                >
                  {/* 트리거 ↔ 패널 사이 hover 끊김 방지 */}
                  <div className="h-3" aria-hidden />
                  <div className={`border-b border-gray-200/70 dark:border-gray-800/70 ${GLASS_NAV_SUBMENU}`}>
                    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 px-4 pb-4 pt-2">
                      {SNS_CHANNELS.map((channel) => (
                        <a
                          key={channel.label}
                          href={channel.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="whitespace-nowrap text-sm text-gray-500 transition-colors duration-200 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                        >
                          {channel.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('hub', 'version-info')}
                className={navItemClass(activePage === 'version-info')}
              >
                버전정보
              </button>
            </nav>
            <ThemeToggle theme={theme} onChange={setTheme} />
          </div>
        </div>
      </div>
    </header>
  );
};
