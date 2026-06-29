/** AI 프로필 → 구글 스프레드시트 TSV 컬럼 (A~F, 시트 1행 헤더와 동일) */
export const AI_PROFILE_SPREADSHEET_HEADERS = [
  '통합프롬프트(영문)',
  '통합프롬프트(국문)',
  '세부옵션',
  'AI 효과',
  '이미지비율',
  '생성된 이미지',
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

/** C열: AI 효과·이미지비율을 제외한 세부 옵션 */
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

/** TSV 한 행 [A~F] — F열은 생성된 이미지 S3 URL(없으면 빈칸) */
export const buildAiPromptSpreadsheetRow = (
  parsed: ParsedAiPromptForSpreadsheet,
  generatedImageUrl = ''
): string[] => [
  parsed.englishPrompt,
  parsed.koreanPrompt,
  buildAiProfileDetailOptionsText(parsed),
  parsed.detailFields['AI 효과 제거'] ?? '',
  parsed.detailFields['이미지 비율'] ?? '',
  generatedImageUrl,
];

export const AI_PROFILE_IMAGE_SLOT_ID = 'ai-profile';
