export type GolfBackgroundAsset = {
  /** 파일명(확장자 제외) — 골프장명 */
  courseName: string;
  /** 권역 폴더명 (예: 경기권, 제주) */
  region: string;
  url: string;
};

/** 시트 「활동지역」 — 참고 골프장 권역 폴더명과 대응 */
const GOLF_BACKGROUND_REGION_TO_ACTIVITY_REGIONS: Record<string, readonly string[]> = {
  강원권: ['강원 춘천시'],
  경기권: [
    '경기 성남시 분당구',
    '경기 수원시 영통구',
    '경기 고양시 일산동구',
    '경기 용인시 기흥구',
  ],
  경상권: [
    '부산 부산진구',
    '부산 해운대구',
    '부산 수영구',
    '대구 수성구',
    '대구 달서구',
    '울산 남구',
    '경북 포항시 북구',
    '경남 창원시 성산구',
  ],
  수도권: [
    '서울 강서구',
    '서울 송파구',
    '서울 마포구',
    '서울 강남구',
    '인천 연수구',
    '인천 남동구',
    '세종 조치원읍',
  ],
  전라권: ['광주 서구', '전북 전주시 완산구', '전남 여수시'],
  제주: ['제주 제주시'],
  충청권: ['대전 유성구', '충북 청주시 상당구', '충남 천안시 서북구'],
};

const pickRandom = <T,>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)]!;

export const resolveActivityRegionFromGolfBackgroundRegion = (region: string): string | null => {
  const normalized = region.trim();
  const candidates = GOLF_BACKGROUND_REGION_TO_ACTIVITY_REGIONS[normalized];
  if (!candidates?.length) return null;
  return pickRandom(candidates);
};

export type ProfileGolfBackgroundSheetRef = {
  courseName: string;
  /** 권역 폴더명 (예: 경기권) */
  region: string;
  activityRegion: string;
};

export const buildProfileGolfBackgroundSheetRef = (
  courseName: string,
  region: string
): ProfileGolfBackgroundSheetRef | null => {
  const trimmedCourse = courseName.trim();
  const trimmedRegion = region.trim();
  if (!trimmedCourse || !trimmedRegion) return null;
  const activityRegion = resolveActivityRegionFromGolfBackgroundRegion(trimmedRegion);
  if (!activityRegion) return null;
  return {
    courseName: trimmedCourse,
    region: trimmedRegion,
    activityRegion,
  };
};

const golfBackgroundUrlModules = import.meta.glob<string>(
  '../assets/ai-profile-golf-backgrounds/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
  { eager: true, query: '?url', import: 'default' }
);

const parseGolfBackgroundModulePath = (modulePath: string, url: string): GolfBackgroundAsset | null => {
  const normalized = modulePath.replace(/\\/g, '/');
  const marker = 'ai-profile-golf-backgrounds/';
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex < 0) return null;

  const rest = normalized.slice(markerIndex + marker.length);
  const segments = rest.split('/').filter(Boolean);
  if (segments.length < 2) return null;

  const fileName = segments[segments.length - 1] ?? '';
  const courseName = fileName.replace(/\.[^.]+$/i, '').trim();
  if (!courseName) return null;

  const region = segments[0] ?? '';
  return { courseName, region, url };
};

export const AI_PROFILE_GOLF_BACKGROUND_CATALOG: GolfBackgroundAsset[] = Object.entries(
  golfBackgroundUrlModules
)
  .map(([path, url]) => parseGolfBackgroundModulePath(path, url))
  .filter((item): item is GolfBackgroundAsset => item !== null);

export const pickRandomGolfBackground = (): GolfBackgroundAsset | null => {
  if (AI_PROFILE_GOLF_BACKGROUND_CATALOG.length === 0) return null;
  return AI_PROFILE_GOLF_BACKGROUND_CATALOG[
    Math.floor(Math.random() * AI_PROFILE_GOLF_BACKGROUND_CATALOG.length)
  ]!;
};

const base64Cache = new Map<string, { mimeType: string; data: string }>();

export const loadGolfBackgroundBase64 = async (
  url: string
): Promise<{ mimeType: string; data: string } | null> => {
  const cached = base64Cache.get(url);
  if (cached) return cached;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const mimeType = blob.type === 'image/jpg' ? 'image/jpeg' : blob.type || 'image/jpeg';
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
    if (!match) return null;
    const payload = { mimeType, data: match[1] };
    base64Cache.set(url, payload);
    return payload;
  } catch {
    return null;
  }
};

export type GolfBackgroundReference = GolfBackgroundAsset & {
  mimeType: string;
  data: string;
};

export const loadRandomGolfBackgroundReference = async (): Promise<GolfBackgroundReference | null> => {
  const picked = pickRandomGolfBackground();
  if (!picked) return null;
  const encoded = await loadGolfBackgroundBase64(picked.url);
  if (!encoded) return null;
  return { ...picked, mimeType: encoded.mimeType, data: encoded.data };
};

export const loadGolfBackgroundReference = async (
  asset: GolfBackgroundAsset
): Promise<GolfBackgroundReference | null> => {
  const encoded = await loadGolfBackgroundBase64(asset.url);
  if (!encoded) return null;
  return { ...asset, mimeType: encoded.mimeType, data: encoded.data };
};
