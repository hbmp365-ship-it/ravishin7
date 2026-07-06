import {
  buildTeeshotCameraDistanceImageFinalReminder,
  buildTeeshotCameraDistanceImagePreamble,
} from '../constants';

export const AI_PROFILE_EXTRA_IMAGE_SLOT_IDS = [
  'ai-profile-extra-1',
  'ai-profile-extra-2',
  'ai-profile-extra-3',
  'ai-profile-extra-4',
  'ai-profile-extra-5',
] as const;

export type AiProfileExtraImageSlotId = (typeof AI_PROFILE_EXTRA_IMAGE_SLOT_IDS)[number];

/** 프로필 외 이미지 — 장면·의상·구도를 크게 바꾸되 동일 인물만 유지 */
const EXTRA_IMAGE_SNAPSHOT_RULES =
  'Smartphone snapshot rules: deep depth of field — background AND subject both in focus, no portrait mode bokeh, no blurred background, no subject isolation. Flat low-contrast exposure, no HDR, no punchy contrast.';
const EXTRA_IMAGE_COURSE_BACKGROUND =
  'Background must be outdoor golf course field ONLY (fairway, tee, green, rough, trees, sky). No driving range, no indoor facility, no signs, no readable text, no smeared blank signage.';
/** 구도·거리 표현은 카메라 거리 설정과 충돌하지 않도록 포즈·장면만 지정 */
const EXTRA_IMAGE_VARIATIONS = [
  'Completely new scene: mid iron swing on the fairway, side view. Wear a different color golf polo and cap than the reference photo.',
  'Completely new scene: walking on a cart path between holes on the course, candid smile, back three-quarter view. Different windbreaker or vest outfit from the reference.',
  'Completely new scene: putting on an on-course green, low stance, side profile. Different hat or visor and different top color from the reference.',
  'Completely new scene: standing near an on-course sand bunker looking at the hole, holding a club, front-facing casual pose. Different golf skirt or pants and shoes from the reference.',
  'Completely new scene: resting on the fairway edge between shots, relaxed moment, three-quarter angle. Different casual golf outfit from the reference (layered top or different polo).',
] as const;

export const buildAiProfileExtraImagePrompt = (
  slotIndex: number,
  ageNum?: string | null,
  cameraMeters?: number | null
): string => {
  const variation = EXTRA_IMAGE_VARIATIONS[slotIndex % EXTRA_IMAGE_VARIATIONS.length];
  const ageLine = ageNum
    ? `Identity lock: keep the same face, exact age (${ageNum} years old — do NOT make younger), gender presentation, skin tone, and body type.`
    : 'Identity lock: keep the same face, exact age as the reference, gender presentation, skin tone, and body type.';
  const blocks = [
    'Create a NEW smartphone-style golf photo of the SAME PERSON as the reference image.',
    ageLine,
    'Variation required — do NOT clone the reference photo:',
    '- Do NOT reuse the same pose, body angle, or hand position',
    '- Do NOT reuse the same background location or composition',
    '- Do NOT reuse the same clothing, cap, or colors — change the outfit freely (still realistic amateur golf wear)',
    'The result must look like a different photo taken on another day, not a slight edit of the reference.',
    EXTRA_IMAGE_COURSE_BACKGROUND,
    EXTRA_IMAGE_SNAPSHOT_RULES,
    'Photo quality: casual smartphone snapshot — deep depth of field (background mostly in focus), no portrait mode bokeh, no professional blur, mild softness, low to moderate contrast, not HDR or hyper-sharp.',
    'Avoid polished AI portrait look, studio lighting, or influencer-quality photography.',
    '',
    `New photo brief: ${variation}`,
  ];

  if (cameraMeters != null) {
    return [
      buildTeeshotCameraDistanceImagePreamble(cameraMeters),
      'Pose, outfit, and scene must change — but camera distance MUST stay exactly as specified above (user-selected setting). Ignore any close-up or portrait wording below if it conflicts.',
      blocks.join('\n'),
      buildTeeshotCameraDistanceImageFinalReminder(cameraMeters),
    ].join('\n\n');
  }

  return blocks.join('\n');
};

export const countGeneratedExtraProfileImages = (
  imageStatuses: Record<string, { url?: string | null } | undefined>
): number =>
  AI_PROFILE_EXTRA_IMAGE_SLOT_IDS.filter((slotId) => Boolean(imageStatuses[slotId]?.url)).length;

export const getNextExtraProfileImageSlotId = (
  imageStatuses: Record<string, { url?: string | null } | undefined>
): AiProfileExtraImageSlotId | null => {
  for (const slotId of AI_PROFILE_EXTRA_IMAGE_SLOT_IDS) {
    if (!imageStatuses[slotId]?.url) return slotId;
  }
  return null;
};
