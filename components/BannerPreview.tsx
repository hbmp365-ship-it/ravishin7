import React, { useCallback, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import type { BannerDesignStyleId } from '../types';
import {
  bannerAlignmentGridClass,
  bannerAspectRatioClass,
  getBannerTypographyClasses,
} from './bannerTypographyPresets';

export interface BannerPreviewProps {
  backgroundSrc: string;
  headline?: string;
  subheadline?: string;
  bodyCopy?: string;
  cta?: string;
  aspectRatio?: string;
  alignment?: string;
  theme?: string;
  designStyleId?: BannerDesignStyleId;
  className?: string;
}

const sportyStroke = { WebkitTextStroke: '1px rgba(20, 83, 45, 0.9)' } as React.CSSProperties;

export const BannerPreview: React.FC<BannerPreviewProps> = ({
  backgroundSrc,
  headline,
  subheadline,
  bodyCopy,
  cta,
  aspectRatio,
  alignment,
  theme,
  designStyleId,
  className = '',
}) => {
  const captureRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const aspectClass = bannerAspectRatioClass(aspectRatio);
  const alignClass = bannerAlignmentGridClass(alignment);
  const isDark = theme === '다크모드';
  const textAlignOverride =
    alignment?.includes('Left') && !alignment?.includes('Right')
      ? '[&_h2]:!text-left [&_p]:!text-left'
      : alignment?.includes('Right')
        ? '[&_h2]:!text-right [&_p]:!text-right'
        : '';

  const strokeFor = useCallback(
    (slot: 'headline' | 'subheadline' | 'body') =>
      designStyleId === 'dynamic_sporty' ? sportyStroke : undefined,
    [designStyleId]
  );

  const handleDownloadComposite = useCallback(async () => {
    const node = captureRef.current;
    if (!node) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `teeshot-banner-${Date.now()}.png`;
      a.click();
    } catch (e) {
      console.error('Banner composite export failed:', e);
    } finally {
      setExporting(false);
    }
  }, [isDark]);

  const hasAnyText = Boolean(
    (headline && headline.trim()) ||
      (subheadline && subheadline.trim()) ||
      (bodyCopy && bodyCopy.trim()) ||
      (cta && cta.trim())
  );

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-800">텍스트 합성 미리보기</h4>
        <button
          type="button"
          onClick={handleDownloadComposite}
          disabled={exporting || !hasAnyText}
          className="rounded-lg bg-[#004B49] px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-[#003a38] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting ? '저장 중…' : '합성 이미지 다운로드 (PNG)'}
        </button>
      </div>
      <p className="mb-3 text-xs text-gray-500">
        배경은 Nano Banana <strong>무텍스트</strong> 장면입니다. 제목·부제·본문·CTA는 고해상도 CSS로 얹었습니다.
      </p>

      <div
        ref={captureRef}
        className={`relative w-full overflow-hidden rounded-lg ${aspectClass} ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}
      >
        <img src={backgroundSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />

        <div
          className={`absolute inset-0 z-[1] flex flex-col justify-between gap-2 bg-gradient-to-b from-black/25 via-transparent to-black/40 p-4 sm:p-6 md:p-8 ${alignClass}`}
        >
          <div
            className={`flex w-full flex-col ${alignClass.includes('text-left') ? 'items-start' : alignClass.includes('text-right') ? 'items-end' : 'items-center'} ${textAlignOverride}`}
          >
            {headline?.trim() ? (
              <h2
                className={getBannerTypographyClasses(designStyleId, 'headline')}
                style={strokeFor('headline')}
              >
                {headline.trim()}
              </h2>
            ) : null}
            {subheadline?.trim() ? (
              <p
                className={getBannerTypographyClasses(designStyleId, 'subheadline')}
                style={strokeFor('subheadline')}
              >
                {subheadline.trim()}
              </p>
            ) : null}
            {bodyCopy?.trim() ? (
              <p
                className={getBannerTypographyClasses(designStyleId, 'body')}
                style={strokeFor('body')}
              >
                {bodyCopy.trim()}
              </p>
            ) : null}
          </div>

          {cta?.trim() ? (
            <div
              className={`mt-auto flex w-full ${alignClass.includes('text-left') ? 'justify-start' : alignClass.includes('text-right') ? 'justify-end' : 'justify-center'}`}
            >
              <span className={getBannerTypographyClasses(designStyleId, 'cta')}>{cta.trim()}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
