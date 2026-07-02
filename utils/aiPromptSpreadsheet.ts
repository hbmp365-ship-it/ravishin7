/** AI 프로필 → 구글 스프레드시트 TSV 컬럼 (A~R, 시트 1행 헤더와 동일) */
export const AI_PROFILE_SPREADSHEET_HEADERS = [
  '프로필 이미지',
  '인물 이름',
  '회원 닉네임',
  '성별',
  '나이',
  '활동지역',
  '평균타수',
  '골프경력',
  '월라운드 횟수',
  '해외 골프 횟수',
  '자주가는 골프장',
  '소개',
  '통합 프롬프트 등 프롬프트',
  '프로필 외 이미지1',
  '프로필 외 이미지2',
  '프로필 외 이미지3',
  '프로필 외 이미지4',
  '프로필 외 이미지5',
] as const;

export type ParsedAiPromptForSpreadsheet = {
  englishPrompt: string;
  koreanPrompt: string;
  detailFields: Record<string, string>;
  /** 옵션별 세부 프롬프트 섹션 원문 */
  detailFullText: string;
};

const DETAIL_EXCLUDED_FROM_OPTIONS = new Set(['AI 효과 제거', '이미지 비율']);

/** `## 섹션` 마크다운에서 AI 프로필 결과 파싱 */
export const parseAiPromptForSpreadsheet = (content: string): ParsedAiPromptForSpreadsheet => {
  let currentHeading = '';
  const sectionBodies = new Map<string, string[]>();

  for (const line of content.split('\n')) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      currentHeading = headingMatch[1].trim();
      if (!sectionBodies.has(currentHeading)) {
        sectionBodies.set(currentHeading, []);
      }
      continue;
    }
    if (currentHeading) {
      sectionBodies.get(currentHeading)!.push(line);
    }
  }

  const englishPrompt = (sectionBodies.get('통합 프롬프트 (English)') ?? []).join('\n').trim();
  const koreanPrompt = (sectionBodies.get('통합 프롬프트 (한국어)') ?? []).join('\n').trim();
  const detailLines = sectionBodies.get('옵션별 세부 프롬프트') ?? [];
  const detailFullText = detailLines.join('\n').trim();

  const detailFields: Record<string, string> = {};
  for (const line of detailLines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^-\s*(.+?):\s*(.*)$/);
    if (match) {
      detailFields[match[1].trim()] = match[2].trim();
    }
  }

  return { englishPrompt, koreanPrompt, detailFields, detailFullText };
};

/** M열: 통합·세부 프롬프트 전체 */
export const buildAiProfilePromptContentColumn = (parsed: ParsedAiPromptForSpreadsheet): string =>
  [
    '## 통합 프롬프트 (English)',
    parsed.englishPrompt,
    '',
    '## 통합 프롬프트 (한국어)',
    parsed.koreanPrompt,
    '',
    '## 옵션별 세부 프롬프트',
    parsed.detailFullText,
  ]
    .filter((block, index, arr) => !(block === '' && arr[index - 1] === ''))
    .join('\n')
    .trim();

/** C열(구): AI 효과·이미지비율을 제외한 세부 옵션 — 하위 호환용 */
export const buildAiProfileDetailOptionsText = (parsed: ParsedAiPromptForSpreadsheet): string => {
  const lines: string[] = [];
  for (const line of parsed.detailFullText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('- ')) continue;
    const match = trimmed.match(/^-\s*(.+?):\s*(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    if (DETAIL_EXCLUDED_FROM_OPTIONS.has(key)) continue;
    lines.push(trimmed);
  }
  return lines.join('\n').trim();
};

export type AiProfileSpreadsheetRowInput = {
  profileImageUrl?: string;
  member: {
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
  promptContent: string;
  extraImageUrls?: string[];
};

/** TSV 한 행 [A~R] */
export const buildAiPromptSpreadsheetRow = (input: AiProfileSpreadsheetRowInput): string[] => {
  const extras = input.extraImageUrls ?? [];
  return [
    input.profileImageUrl ?? '',
    input.member.personName,
    input.member.memberNickname,
    input.member.gender,
    input.member.age,
    input.member.activityRegion,
    input.member.averageScore,
    input.member.golfExperience,
    input.member.monthlyRounds,
    input.member.overseasGolfCount,
    input.member.favoriteGolfCourse,
    input.member.introduction,
    input.promptContent,
    extras[0] ?? '',
    extras[1] ?? '',
    extras[2] ?? '',
    extras[3] ?? '',
    extras[4] ?? '',
  ];
};

export const AI_PROFILE_IMAGE_SLOT_ID = 'ai-profile';
