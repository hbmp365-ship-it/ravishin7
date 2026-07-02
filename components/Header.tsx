import React from 'react';
import teeshotLogo from '../assets/teeshot-logo.png';
import { MoonIcon, SunIcon } from './icons';
import { useTheme } from '../theme/ThemeProvider';
import type { ThemeMode } from '../theme/ThemeProvider';

type SnsChannel = {
  label: string;
  href: string;
};

const SNS_CHANNELS: SnsChannel[] = [
  { label: '인스타그램', href: 'https://www.instagram.com/teeshot_official/' },
  { label: '유튜브', href: 'https://www.youtube.com/@%ED%8B%B0%EC%83%B7%EC%88%8F%EC%B8%A0' },
  { label: '페이스북', href: '#' },
  { label: '네이버 카페', href: '#' },
  { label: '네이버 블로그', href: 'https://blog.naver.com/teeshotgolf-' },
  { label: '네이버 밴드', href: '#' },
];

const GLASS_NAV =
  'bg-white/95 backdrop-blur-sm backdrop-saturate-150 border-white/90 shadow-[0_1px_0_rgba(255,255,255,0.92)_inset] supports-[backdrop-filter]:bg-white/92 dark:bg-gray-950/95 dark:border-gray-800/90 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] dark:supports-[backdrop-filter]:bg-gray-950/92';

type ThemeToggleProps = {
  theme: ThemeMode;
  onChange: (theme: ThemeMode) => void;
};

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onChange }) => (
  <div
    className="flex items-center rounded-full border border-gray-200/90 bg-gray-100/90 p-0.5 dark:border-gray-700 dark:bg-gray-800/90"
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

export const Header: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <header
      className={`group/sns relative sticky top-0 z-50 border-b border-gray-200/80 shadow-[0_2px_14px_rgba(15,23,42,0.07)] dark:border-gray-800/80 dark:shadow-[0_2px_16px_rgba(0,0,0,0.35)] ${GLASS_NAV}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-[72px] items-center justify-between">
          <div className="flex min-w-0 items-center gap-5">
            <img
              src={teeshotLogo}
              alt="TEESHOT"
              className="h-8 w-auto shrink-0"
            />
            <span className="hidden truncate text-[13px] font-light tracking-wide text-gray-400 dark:text-gray-500 sm:inline">
              Content Generator V 0.1
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-4 sm:gap-6">
            <nav className="flex h-full items-center">
              <span
                className="cursor-default select-none py-4 text-[15px] font-normal text-gray-800 transition-all duration-200 group-hover/sns:font-semibold dark:text-gray-200"
                aria-haspopup="true"
              >
                SNS 채널
              </span>
            </nav>
            <ThemeToggle theme={theme} onChange={setTheme} />
          </div>
        </div>
      </div>

      <div className="pointer-events-none invisible absolute inset-x-0 top-full z-50 w-full opacity-0 transition-all duration-200 group-hover/sns:pointer-events-auto group-hover/sns:visible group-hover/sns:opacity-100">
        <div className={`w-full border-b border-gray-200/70 pt-1 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:border-gray-800/70 dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)] ${GLASS_NAV}`}>
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-end gap-x-10 gap-y-2 pb-4 pt-2">
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
    </header>
  );
};
