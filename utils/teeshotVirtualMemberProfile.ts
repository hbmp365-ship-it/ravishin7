import type { UserInput } from '../types';
import {
  TEESHOT_GOLF_BRAND_LOGO_REQUIREMENT,
  TEESHOT_MEMBER_CAMERA_DISTANCE_OPTIONS,
  TEESHOT_MEMBER_POSE_OPTIONS,
  TEESHOT_MEMBER_VIEW_OPTIONS,
  TEESHOT_VIRTUAL_MEMBER_ANTI_POLISH_NEGATIVE,
  TEESHOT_VIRTUAL_MEMBER_COURSE_BACKGROUND_ONLY,
  TEESHOT_VIRTUAL_MEMBER_PROFILE_STYLE,
  TEESHOT_VIRTUAL_MEMBER_PROFILE_STYLE_COMPACT,
  TEESHOT_VIRTUAL_MEMBER_SNAPSHOT_MANDATORY,
  buildTeeshotCameraDistanceImageEnforcement,
  parseTeeshotCameraDistanceFromDetail,
  parseTeeshotCameraDistanceMeters,
  buildTeeshotCameraDistanceImagePreamble,
} from '../constants';

export type TeeshotMemberOption = { label: string; value: string; promptEn: string };

const findOption = (options: ReadonlyArray<TeeshotMemberOption>, value: string | undefined) =>
  options.find((o) => o.value === value) ?? options[0]!;

export const isTeeshotVirtualMemberProfileEnabled = (input: UserInput): boolean =>
  input.aiPromptType === '가상 프로필 생성하기';

export type TeeshotVirtualMemberProfileSelections = {
  pose: TeeshotMemberOption;
  view: TeeshotMemberOption;
  distance: TeeshotMemberOption;
};

export const resolveTeeshotVirtualMemberProfileSelections = (
  input: UserInput
): TeeshotVirtualMemberProfileSelections => ({
  pose: findOption(TEESHOT_MEMBER_POSE_OPTIONS, input.aiPromptTeeshotPose),
  view: findOption(TEESHOT_MEMBER_VIEW_OPTIONS, input.aiPromptTeeshotViewAngle),
  distance: findOption(TEESHOT_MEMBER_CAMERA_DISTANCE_OPTIONS, input.aiPromptTeeshotCameraDistance),
});

/** 통합 프롬프트(English) 본문 뒤에 붙는 티샷 가상회원 스타일 단락 */
export const buildTeeshotVirtualMemberProfileEnglishParagraph = (
  input: UserInput,
  options?: { skipSnapshotRules?: boolean }
): string => {
  if (!isTeeshotVirtualMemberProfileEnabled(input)) return '';

  const { pose, view, distance } = resolveTeeshotVirtualMemberProfileSelections(input);
  const cameraMeters = parseTeeshotCameraDistanceMeters(distance.value);
  const removeAiEffect = options?.skipSnapshotRules ?? Boolean(input.aiPromptRemoveAiEffect);
  const skipSnapshotRules = removeAiEffect;

  return [
    TEESHOT_VIRTUAL_MEMBER_COURSE_BACKGROUND_ONLY,
    skipSnapshotRules ? '' : TEESHOT_VIRTUAL_MEMBER_SNAPSHOT_MANDATORY,
    removeAiEffect ? TEESHOT_VIRTUAL_MEMBER_PROFILE_STYLE_COMPACT : TEESHOT_VIRTUAL_MEMBER_PROFILE_STYLE,
    buildTeeshotCameraDistanceImageEnforcement(cameraMeters),
    `Pose / action: ${pose.promptEn}`,
    `Camera view / angle: ${view.promptEn}`,
    `Camera distance summary: ${distance.promptEn}`,
    TEESHOT_GOLF_BRAND_LOGO_REQUIREMENT,
    removeAiEffect ? '' : TEESHOT_VIRTUAL_MEMBER_ANTI_POLISH_NEGATIVE,
  ]
    .filter(Boolean)
    .join('\n\n');
};

/** 프로필 이미지 생성 시 카메라 거리 최우선 주입 */
export const buildTeeshotVirtualMemberImageEnforcement = (
  parsedDetailFields: Record<string, string>
): string => {
  const aiType = parsedDetailFields['AI 유형'] ?? '';
  if (!aiType.includes('가상 프로필')) return '';

  const cameraMeters = parseTeeshotCameraDistanceFromDetail(
    parsedDetailFields['티샷 가상회원 카메라 거리']
  );
  if (!cameraMeters) return '';

  return buildTeeshotCameraDistanceImagePreamble(cameraMeters);
};

/** 통합 프롬프트(한국어)에 붙일 티샷 요약 */
export const buildTeeshotVirtualMemberProfileKoreanSummary = (
  input: UserInput,
  options?: { skipSnapshotRules?: boolean }
): string => {
  if (!isTeeshotVirtualMemberProfileEnabled(input)) return '';

  const { pose, view, distance } = resolveTeeshotVirtualMemberProfileSelections(input);
  const skipSnapshotRules = options?.skipSnapshotRules ?? Boolean(input.aiPromptRemoveAiEffect);
  const snapshotKo = skipSnapshotRules
    ? ''
    : ' 스마트폰 스냅샷 느낌(배경 아웃포커싱·과선명·고대비 금지).';

  return `티샷 AI 가상회원 프로필 — 포즈: ${pose.label}, 촬영 방향: ${view.label}, 카메라 거리: ${distance.label}. 배경은 야외 골프장 필드만(연습장·실내·간판 금지).${snapshotKo} 착용 의류에 골프 브랜드 로고 필수.`;
};

/** 옵션별 세부 프롬프트 섹션에 추가할 줄들 */
export const buildTeeshotVirtualMemberProfileDetailLines = (input: UserInput): string[] => {
  if (!isTeeshotVirtualMemberProfileEnabled(input)) return [];

  const { pose, view, distance } = resolveTeeshotVirtualMemberProfileSelections(input);
  const removeAiEffect = Boolean(input.aiPromptRemoveAiEffect);

  return [
    `- 티샷 가상회원 포즈: ${pose.label} / ${pose.promptEn}`,
    `- 티샷 가상회원 촬영 방향: ${view.label} / ${view.promptEn}`,
    `- 티샷 가상회원 카메라 거리: ${distance.label} / ${distance.promptEn}`,
    `- 배경 (필수): 야외 골프장 필드만 — 페어웨이·티·그린·러프·코스 내 벙커 등`,
    `- 골프 브랜드 로고 의류: 필수`,
    ...(removeAiEffect
      ? []
      : [`- 티샷 스마트폰 스냅샷: 배경·인물 모두 초점, 보케·과선명·고대비 금지`]),
    ...(parseTeeshotCameraDistanceMeters(distance.value) >= 40
      ? [`- 카메라 거리 (${distance.label}): 프레임 높이 대비 인물 크기 비율 반드시 준수 — 가까운 인물샷 금지`]
      : []),
  ];
};
