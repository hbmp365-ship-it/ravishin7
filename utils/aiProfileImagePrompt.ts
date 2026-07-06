import type { ParsedAiPromptForSpreadsheet } from './aiPromptSpreadsheet';
import {
  AI_EFFECT_REMOVAL_IMAGE_FINAL_REMINDER,
  AI_EFFECT_REMOVAL_IMAGE_PRIORITY_HEADER,
  buildAiEffectRemovalImageEnforcement,
  buildTeeshotCameraDistanceImageFinalReminder,
  buildTeeshotCameraDistanceImagePreamble,
  parseTeeshotCameraDistanceFromDetail,
} from '../constants';

export const normalizeAiProfileAge = (raw?: string): string | null => {
  if (!raw?.trim()) return null;
  const match = raw.trim().replace(/세$/, '').match(/(\d{1,3})/);
  return match ? match[1] : null;
};

export const parseAgeFromAiPromptDetail = (detailValue?: string): string | null => {
  if (!detailValue) return null;
  const koMatch = detailValue.match(/(\d{1,3})세/);
  if (koMatch) return koMatch[1];
  const enMatch = detailValue.match(/(\d{1,3})-year-old/i);
  if (enMatch) return enMatch[1];
  return normalizeAiProfileAge(detailValue);
};

const parseEnglishDetailValue = (detailValue?: string): string | null => {
  if (!detailValue?.trim()) return null;
  const parts = detailValue.split('/').map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0] ?? null;
};

export const buildAgeAppearanceGuidance = (ageNum: number): string => {
  if (ageNum >= 55) {
    return 'mature adult with clearly visible age-appropriate features: mature skin texture, possible gray or salt-and-pepper hair, natural wrinkles around eyes and forehead, no youthful de-aging';
  }
  if (ageNum >= 45) {
    return 'middle-aged adult with natural mature features: subtle to moderate wrinkles, mature skin, age-appropriate face shape, not a young adult';
  }
  if (ageNum >= 35) {
    return 'adult in their mid-30s to 40s with realistic mature features, not a teenager or person in their early 20s';
  }
  if (ageNum >= 25) {
    return 'adult in their late 20s to early 30s with age-appropriate youthful-but-adult features';
  }
  return 'adult with age-appropriate youthful features';
};

export type AiProfileImageIdentity = {
  age?: string | null;
  genderEn?: string | null;
  nationalityEn?: string | null;
};

export const resolveAiProfileImageIdentity = (
  parsed: ParsedAiPromptForSpreadsheet
): AiProfileImageIdentity => ({
  age: parseAgeFromAiPromptDetail(parsed.detailFields['나이']),
  genderEn: parseEnglishDetailValue(parsed.detailFields['성별']),
  nationalityEn: parseEnglishDetailValue(parsed.detailFields['국적']),
});

const promptIncludesAiEffectRemoval = (englishPrompt: string): boolean =>
  englishPrompt.includes('CRITICAL — composition (MUST apply; non-negotiable when AI effect removal is on)') ||
  englishPrompt.includes('HIGHEST PRIORITY — AI EFFECT REMOVAL');

const promptIncludesAgeEnforcement = (englishPrompt: string): boolean =>
  englishPrompt.includes('Mandatory subject age:') ||
  englishPrompt.includes('CRITICAL — SUBJECT IDENTITY');

/** 프로필 이미지 생성 — 통합 English 프롬프트 + 누락 시에만 짧게 보강 (중복 주입 방지) */
export const buildAiProfileImageGenerationPrompt = (
  englishPrompt: string,
  identity: AiProfileImageIdentity = {},
  parsed?: ParsedAiPromptForSpreadsheet | null,
  cameraDistanceMetersOverride?: number | null
): string => {
  const trimmed = englishPrompt.trim();
  if (!trimmed) return '';

  const ageStr = identity.age ? normalizeAiProfileAge(identity.age) : null;
  const ageNum = ageStr ? parseInt(ageStr, 10) : NaN;
  const hasAge = Boolean(ageStr && !Number.isNaN(ageNum));
  const genderEn = identity.genderEn?.trim();
  const nationalityEn = identity.nationalityEn?.trim();
  const aiEffectRemovalActive = parsed?.detailFields['AI 효과 제거']?.includes('적용') ?? false;
  const isVirtualProfile = parsed?.detailFields['AI 유형']?.includes('가상 프로필') ?? false;
  const cameraMeters =
    cameraDistanceMetersOverride ??
    (parsed ? parseTeeshotCameraDistanceFromDetail(parsed.detailFields['티샷 가상회원 카메라 거리']) : null);
  const shouldEnforceCameraDistance =
    cameraMeters != null && (isVirtualProfile || cameraDistanceMetersOverride != null);

  const hasAiEffectInPrompt = promptIncludesAiEffectRemoval(trimmed);
  const hasAgeInPrompt = promptIncludesAgeEnforcement(trimmed);

  const preambleBlocks: string[] = [];

  if (shouldEnforceCameraDistance) {
    preambleBlocks.push(buildTeeshotCameraDistanceImagePreamble(cameraMeters));
  }

  if (aiEffectRemovalActive) {
    if (hasAiEffectInPrompt) {
      preambleBlocks.push(AI_EFFECT_REMOVAL_IMAGE_PRIORITY_HEADER);
    } else {
      preambleBlocks.push(
        buildAiEffectRemovalImageEnforcement({ includeTeeshotSnapshotRules: isVirtualProfile })
      );
    }
  }

  if (!hasAgeInPrompt && (hasAge || genderEn || nationalityEn)) {
    const identityLines: string[] = ['CRITICAL — SUBJECT IDENTITY (highest priority; must obey):'];

    if (hasAge) {
      const guidance = buildAgeAppearanceGuidance(ageNum);
      identityLines.push(
        `- Age: exactly ${ageNum} years old (${ageNum}-year-old). The person must look like a believable real ${ageNum}-year-old, not younger.`,
        `- Age appearance: ${guidance}.`
      );
      if (ageNum >= 40) {
        identityLines.push(
          `(Negative — wrong age): teenager, person in their 20s, person in their 30s, baby face, de-aged face, overly smooth young skin, making the subject look significantly younger than ${ageNum}.`
        );
      } else if (ageNum >= 30) {
        identityLines.push(
          `(Negative — wrong age): teenager, person in their early 20s, childlike face, making the subject look significantly younger than ${ageNum}.`
        );
      }
    }

    if (genderEn) {
      identityLines.push(`- Gender presentation: ${genderEn}.`);
    }

    if (nationalityEn) {
      identityLines.push(`- Nationality / ethnicity appearance: ${nationalityEn}.`);
    }

    preambleBlocks.push(identityLines.join('\n'));
  }

  const tailBlocks: string[] = [];
  if (aiEffectRemovalActive) {
    tailBlocks.push(AI_EFFECT_REMOVAL_IMAGE_FINAL_REMINDER);
  }
  if (shouldEnforceCameraDistance) {
    tailBlocks.push(buildTeeshotCameraDistanceImageFinalReminder(cameraMeters));
  }

  if (preambleBlocks.length === 0 && tailBlocks.length === 0) {
    return trimmed;
  }

  const bridge =
    aiEffectRemovalActive || shouldEnforceCameraDistance
      ? 'Creative brief below — camera distance and mandatory rules above take priority over any conflicting close portrait language:'
      : 'Full creative brief (constraints above override portrait-mode or youth bias in style notes):';

  return [preambleBlocks.join('\n\n'), bridge, trimmed, ...tailBlocks].filter(Boolean).join('\n\n');
};
