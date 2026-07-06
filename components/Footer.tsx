
import React from 'react';
import teeshotLogo from '../assets/teeshot-logo.png';
import teeshotLogoDark from '../assets/teeshot-logo-dark.png';
import { useTheme } from '../theme/ThemeProvider';

export const Footer: React.FC = () => {
  const { theme } = useTheme();

  return (
    <footer className="mt-12 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
      <div className="container mx-auto flex flex-col gap-8 px-4 py-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="space-y-3 text-left">
          <img
            src={theme === 'dark' ? teeshotLogoDark : teeshotLogo}
            alt="TEESHOT"
            className="h-6 w-auto"
          />
          <div className="space-y-1 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
            <p className="font-medium">골프로 연결되는 골프친구, 티샷</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              골프조인 · 골프친구 · 골프예약 · 각종 프로모션 이벤트를 한 곳에서
            </p>
          </div>
        </div>

        <div className="space-y-1 text-left text-xs leading-relaxed text-gray-500 dark:text-gray-400 lg:text-right">
          <p>(주)에이치비엠피 · 대표이사 정봉훈</p>
          <p>서울특별시 구로구 디지털로 26길 111, JNK디지털타워 612호 · Tel : 02-2277-3489</p>
          <p>사업자등록번호 : 119-86-94960 · 통신판매업 신고번호 : 2020-제주이도2-0040호</p>
          <p className="pt-1 text-gray-400 dark:text-gray-500">
            Copyright © (주)에이치비엠피 All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
