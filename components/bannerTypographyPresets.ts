import type { BannerDesignStyleId } from '../types';

export type BannerTypographySlot = 'headline' | 'subheadline' | 'body' | 'cta';

/** 디자인 스타일별 Tailwind 클래스 (CDN Tailwind + 일부 arbitrary) */
export function getBannerTypographyClasses(
  styleId: BannerDesignStyleId | undefined,
  slot: BannerTypographySlot
): string {
  const id = styleId ?? 'minimal_clean';

  if (id === 'minimal_clean') {
    if (slot === 'headline') {
      return 'font-sans font-light tracking-[0.35em] uppercase text-white text-center drop-shadow-lg text-2xl sm:text-3xl md:text-4xl leading-tight';
    }
    if (slot === 'subheadline') {
      return 'font-sans font-light tracking-widest uppercase text-white/90 text-center text-sm sm:text-base mt-3';
    }
    if (slot === 'body') {
      return 'font-sans font-light text-white/85 text-center text-xs sm:text-sm mt-4 max-w-prose mx-auto leading-relaxed whitespace-pre-wrap';
    }
    return 'font-sans font-light tracking-[0.2em] uppercase text-white text-center text-xs sm:text-sm mt-6 px-6 py-2 border border-white/40 rounded-full';
  }

  if (id === 'business_luxury') {
    if (slot === 'headline') {
      return "font-serif font-bold text-center text-2xl sm:text-3xl md:text-4xl leading-tight bg-gradient-to-b from-[#D4AF37] to-[#F9F4E1] bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]";
    }
    if (slot === 'subheadline') {
      return "font-serif text-center text-sm sm:text-base mt-3 text-[#F9F4E1]/90 drop-shadow-md";
    }
    if (slot === 'body') {
      return 'font-serif text-center text-xs sm:text-sm mt-4 text-[#f5f0e6]/90 max-w-prose mx-auto leading-relaxed whitespace-pre-wrap drop-shadow';
    }
    return 'font-serif font-bold text-center mt-6 text-sm sm:text-base px-6 py-2 rounded-md bg-gradient-to-b from-[#D4AF37] to-[#8B6914] text-[#1a1204] shadow-lg';
  }

  if (id === 'modern_illustration') {
    const panel = 'rounded-2xl bg-white/88 backdrop-blur-sm px-4 py-3 shadow-md border border-white/60';
    if (slot === 'headline') {
      return `font-sans font-extrabold text-center text-2xl sm:text-3xl text-gray-900 ${panel}`;
    }
    if (slot === 'subheadline') {
      return `font-sans font-bold text-center text-sm sm:text-base mt-3 text-gray-800 ${panel}`;
    }
    if (slot === 'body') {
      return `font-sans font-medium text-center text-xs sm:text-sm mt-3 text-gray-700 max-w-prose mx-auto leading-relaxed whitespace-pre-wrap ${panel}`;
    }
    return `font-sans font-extrabold text-center mt-6 text-sm text-white bg-gradient-to-r from-pink-400 to-violet-500 px-6 py-2.5 rounded-full shadow-lg`;
  }

  /* dynamic_sporty — 외곽선은 BannerPreview에서 WebkitTextStroke로 적용 */
  if (slot === 'headline') {
    return 'font-sans font-black italic text-center text-2xl sm:text-3xl md:text-4xl text-[#ADFF2F] drop-shadow-[0_0_12px_rgba(173,255,47,0.5)] -skew-x-6';
  }
  if (slot === 'subheadline') {
    return 'font-sans font-extrabold italic text-center text-sm sm:text-base mt-2 text-[#C8FF7A] drop-shadow-md -skew-x-3';
  }
  if (slot === 'body') {
    return 'font-sans font-bold italic text-center text-xs sm:text-sm mt-3 text-[#E8FFC8] max-w-prose mx-auto leading-relaxed whitespace-pre-wrap -skew-x-1';
  }
  return 'font-sans font-black italic text-center mt-6 text-sm sm:text-base text-[#0f172a] bg-[#ADFF2F] px-6 py-2 rounded-lg shadow-[0_0_20px_rgba(173,255,47,0.6)] -skew-x-3';
}

export function bannerAspectRatioClass(ratio?: string): string {
  const r = (ratio || '').trim();
  if (r.includes('720') && r.includes('200')) return 'aspect-[720/200]';
  if (r === '16:9' || r.includes('16:9')) return 'aspect-video';
  if (r === '9:16' || r.includes('9:16')) return 'aspect-[9/16]';
  if (r === '1:1' || r.includes('1:1')) return 'aspect-square';
  if (r === '4:5' || r.includes('4:5')) return 'aspect-[4/5]';
  if (r === '3:2' || r.includes('3:2')) return 'aspect-[3/2]';
  if (/A4\s*Vertical|A4\s*세로/i.test(r)) return 'aspect-[210/297]';
  if (/A4\s*Horizontal|A4\s*가로/i.test(r)) return 'aspect-[297/210]';
  return 'aspect-video';
}

export function bannerAlignmentGridClass(alignment?: string): string {
  const a = alignment || 'Center aligned';
  if (a.includes('Left')) return 'items-start text-left';
  if (a.includes('Right')) return 'items-end text-right';
  return 'items-center text-center';
}
