import type { UserInput } from '../types';
import {
  AI_PROMPT_GENDER_OPTIONS,
  AI_PROMPT_NATIONALITY_OPTIONS,
} from '../constants';

export const AI_PROFILE_MEMBER_SHEET_SECTION = '가상 회원 프로필 (시트용)';

export const AI_PROFILE_AVERAGE_SCORE_OPTIONS = [
  '싱글',
  '80-90타',
  '90-100타',
  '100타 이상',
  '초보',
] as const;

export const AI_PROFILE_GOLF_EXPERIENCE_OPTIONS = [
  '1년 이하',
  '2-3년',
  '4-5년',
  '6-7년',
  '8-9년',
  '10년 이상',
] as const;

export const AI_PROFILE_ROUND_FREQUENCY_OPTIONS = [
  '1회 이하',
  '1-2회',
  '2-3회',
  '4-5회',
  '6-7회',
  '8-9회',
  '10회 이상',
] as const;

export const AI_PROFILE_KOREAN_ACTIVITY_REGIONS = [
  '서울 강서구',
  '서울 송파구',
  '서울 마포구',
  '서울 강남구',
  '부산 부산진구',
  '부산 해운대구',
  '부산 수영구',
  '인천 연수구',
  '인천 남동구',
  '대구 수성구',
  '대구 달서구',
  '광주 서구',
  '대전 유성구',
  '울산 남구',
  '세종 조치원읍',
  '경기 성남시 분당구',
  '경기 수원시 영통구',
  '경기 고양시 일산동구',
  '경기 용인시 기흥구',
  '강원 춘천시',
  '충북 청주시 상당구',
  '충남 천안시 서북구',
  '전북 전주시 완산구',
  '전남 여수시',
  '경북 포항시 북구',
  '경남 창원시 성산구',
  '제주 제주시',
] as const;

export const AI_PROFILE_DOMESTIC_GOLF_COURSES = [
  '레이크사이드CC',
  '안양CC',
  '베어크릭CC',
  '잭니클라우스GC',
  '블루원상주CC',
  '한화CC',
  '우정힐CC',
  '세종에머슨CC',
  '골든베이CC',
  '라비에벨CC',
  '오크밸리CC',
  '남촌CC',
  '화순CC',
  '양평TPC',
  '클럽72CC',
] as const;

export type AiProfileMemberMetadata = {
  personName: string;
  memberNickname: string;
  gender: string;
  age: string;
  activityRegion: string;
  averageScore: string;
  golfExperience: string;
  monthlyRounds: string;
  overseasGolfCount: string;
  favoriteGolfCourse: string;
  introduction: string;
};

const MEMBER_FIELD_LABELS: Record<keyof AiProfileMemberMetadata, string> = {
  personName: '인물 이름',
  memberNickname: '회원 닉네임',
  gender: '성별',
  age: '나이',
  activityRegion: '활동지역',
  averageScore: '평균타수',
  golfExperience: '골프경력',
  monthlyRounds: '월라운드 횟수',
  overseasGolfCount: '해외 골프 횟수',
  favoriteGolfCourse: '자주가는 골프장',
  introduction: '소개',
};

const pickRandom = <T,>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)]!;

const findOptionLabel = (
  options: ReadonlyArray<{ label: string; value: string }>,
  value: string
) => options.find((o) => o.value === value)?.label ?? value;

const KOREAN_SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'] as const;
const KOREAN_GIVEN = ['민준', '서연', '지후', '하은', '도윤', '수아', '예준', '지민', '현우', '서윤'] as const;

export const buildAiProfileMemberMetadataFallback = (input: UserInput): AiProfileMemberMetadata => {
  const genderLabel = findOptionLabel(
    AI_PROMPT_GENDER_OPTIONS,
    input.aiPromptGender || AI_PROMPT_GENDER_OPTIONS[0].value
  );
  const age = input.aiPromptAge?.trim().replace(/세$/, '') || '34';
  const surname = pickRandom(KOREAN_SURNAMES);
  const given = pickRandom(KOREAN_GIVEN);
  const personName = `${surname}${given}`;
  const nicknameSuffix = pickRandom(['골퍼', '버디', '이글', '퍼터', '드라이버', '라운드']);
  const memberNickname = `${given}${nicknameSuffix}${Math.floor(Math.random() * 90 + 10)}`;

  return {
    personName,
    memberNickname,
    gender: genderLabel === '성별 특정 없음' ? pickRandom(['남성', '여성']) : genderLabel,
    age: `${age}세`,
    activityRegion: pickRandom(AI_PROFILE_KOREAN_ACTIVITY_REGIONS),
    averageScore: pickRandom(AI_PROFILE_AVERAGE_SCORE_OPTIONS),
    golfExperience: pickRandom(AI_PROFILE_GOLF_EXPERIENCE_OPTIONS),
    monthlyRounds: pickRandom(AI_PROFILE_ROUND_FREQUENCY_OPTIONS),
    overseasGolfCount: pickRandom(AI_PROFILE_ROUND_FREQUENCY_OPTIONS),
    favoriteGolfCourse: pickRandom(AI_PROFILE_DOMESTIC_GOLF_COURSES),
    introduction: pickRandom([
      '주말 라운드 좋아하는 아마추어 골퍼입니다.',
      '천천히 실력 키우는 중이에요. 같이 라운드해요!',
      '골프 치면서 스트레스 푸는 직장인입니다.',
      '버디 한 번 더 내보고 싶은 열정 골퍼예요.',
      '초보지만 라운딩 즐기는 편입니다.',
    ]),
  };
};

export const formatAiProfileMemberMetadataSection = (metadata: AiProfileMemberMetadata): string =>
  (Object.keys(MEMBER_FIELD_LABELS) as Array<keyof AiProfileMemberMetadata>)
    .map((key) => `- ${MEMBER_FIELD_LABELS[key]}: ${metadata[key]}`)
    .join('\n');

export const parseAiProfileMemberMetadata = (content: string): AiProfileMemberMetadata | null => {
  let inSection = false;
  const fields: Partial<Record<keyof AiProfileMemberMetadata, string>> = {};
  const labelToKey = Object.fromEntries(
    (Object.entries(MEMBER_FIELD_LABELS) as Array<[keyof AiProfileMemberMetadata, string]>).map(
      ([key, label]) => [label, key]
    )
  ) as Record<string, keyof AiProfileMemberMetadata>;

  for (const line of content.split('\n')) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      inSection = headingMatch[1].trim() === AI_PROFILE_MEMBER_SHEET_SECTION;
      continue;
    }
    if (!inSection) continue;
    const match = line.trim().match(/^-\s*(.+?):\s*(.*)$/);
    if (!match) continue;
    const key = labelToKey[match[1].trim()];
    if (key) fields[key] = match[2].trim();
  }

  if (!fields.personName || !fields.memberNickname) return null;
  return {
    personName: fields.personName,
    memberNickname: fields.memberNickname,
    gender: fields.gender ?? '',
    age: fields.age ?? '',
    activityRegion: fields.activityRegion ?? '',
    averageScore: fields.averageScore ?? '',
    golfExperience: fields.golfExperience ?? '',
    monthlyRounds: fields.monthlyRounds ?? '',
    overseasGolfCount: fields.overseasGolfCount ?? '',
    favoriteGolfCourse: fields.favoriteGolfCourse ?? '',
    introduction: fields.introduction ?? '',
  };
};

export const buildAiProfileMemberMetadataPrompt = (input: UserInput): string => {
  const genderLabel = findOptionLabel(
    AI_PROMPT_GENDER_OPTIONS,
    input.aiPromptGender || AI_PROMPT_GENDER_OPTIONS[0].value
  );
  const nationalityLabel = findOptionLabel(
    AI_PROMPT_NATIONALITY_OPTIONS,
    input.aiPromptNationality || AI_PROMPT_NATIONALITY_OPTIONS[0].value
  );
  const age = input.aiPromptAge?.trim().replace(/세$/, '') || '34';

  return [
    'Generate fictional golf app member profile metadata as JSON only.',
    'Keys (all strings, Korean text unless noted):',
    'personName, memberNickname, gender, age, activityRegion, averageScore, golfExperience, monthlyRounds, overseasGolfCount, favoriteGolfCourse, introduction',
    '',
    'Rules:',
    `- gender MUST be exactly: ${genderLabel === '성별 특정 없음' ? '남성 or 여성 (pick one)' : genderLabel}`,
    `- age MUST be exactly: ${age}세`,
    `- activityRegion MUST be a real Korean region formatted like "부산 부산진구" or "서울 강서구" (시/도 + 시·군·구)`,
    `- averageScore MUST be one of: ${AI_PROFILE_AVERAGE_SCORE_OPTIONS.join(', ')}`,
    `- golfExperience MUST be one of: ${AI_PROFILE_GOLF_EXPERIENCE_OPTIONS.join(', ')}`,
    `- monthlyRounds MUST be one of: ${AI_PROFILE_ROUND_FREQUENCY_OPTIONS.join(', ')}`,
    `- overseasGolfCount MUST be one of: ${AI_PROFILE_ROUND_FREQUENCY_OPTIONS.join(', ')}`,
    '- favoriteGolfCourse: plausible domestic Korean golf course name',
    '- introduction: one short casual Korean line suitable for SNS or KakaoTalk profile (max 40 chars)',
    '- personName: realistic Korean full name matching nationality vibe',
    `- memberNickname: fun Korean golf nickname, different from personName`,
    `- nationality context for naming tone: ${nationalityLabel}`,
    '',
    'Return ONLY valid JSON object with the keys above.',
  ].join('\n');
};
