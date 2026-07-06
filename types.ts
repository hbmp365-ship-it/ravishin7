/** 배너/포스터 → Nano Banana 이미지 생성 시 선두에 붙는 디자인 스타일 */
export type BannerDesignStyleId =
  | 'minimal_clean'
  | 'business_luxury'
  | 'modern_illustration'
  | 'dynamic_sporty';

export type AiPromptType = '커스텀 생성하기' | '가상 프로필 생성하기';

export type AiPromptAdditionalOption =
  | 'non_symmetrical_face'
  | 'specific_device'
  | 'imperfections';

export interface UserInput {
  category: string;
  format: string;
  keyword: string;
  userText: string;
  referenceUrl?: string;
  cardCount: number;
  blogLength: number;
  videoLength: number;
  sceneCount: number;
  sectionCount: number;
  tone: string;
  /** 배너(ETC-BANNER) 이미지 생성·AI 프롬프트(AI-PROMPT) 통합 프롬프트에 반영되는 종횡비 */
  aspectRatio?: string;
  theme?: string;
  style?: string;
  headline?: string;
  subheadline?: string;
  bodyCopy?: string;
  cta?: string;
  alignment?: string;
  isGolfRelated?: boolean;
  cutCount?: number;
  cutTexts?: string[];
  bannerContentType?: '일반' | '인포그래픽' | '랭킹오브더월드' | '어디로칠까' | '골프용어사전' | '기타 이벤트 배너';
  /** 어디로칠까: 국내 골프장 이름 */
  bannerGolfCourseName?: string;
  /** 골프용어사전: 입문자 | 중급자 | 고급자 */
  golfDictionaryLevel?: '입문자' | '중급자' | '고급자';
  /** 배너/포스터 전용: 이미지 생성(Nano Banana) 프롬프트 선두 스타일 키워드 */
  bannerDesignStyle?: BannerDesignStyleId;
  /**
   * 배너/포스터 전 유형 공통: true면 미입력·짧은 입력을 AI가 보완(일반·이벤트: 부제·본문·CTA 등).
   * false(기본)면 일반·이벤트는 입력한 문구만 반영·미입력 섹션 생략; 인포·랭킹·골프장·용어는 과도한 추측·가공 수치 없이 보수적으로.
   */
  bannerAutoFillEmptyFields?: boolean;
  /**
   * 배너/포스터(ETC-BANNER): 배경 이미지 생성 시 참고할 예시 디자인(구도·색감 등).
   * 텍스트·로고는 재현하지 말 것을 API 프롬프트로 지시함.
   */
  bannerDesignReferenceImage?: { mimeType: string; dataBase64: string };
  /**
   * 배너/포스터 전 유형 공통: 콘텐츠·이미지 생성 시 반영할 사용자 지정 이미지 프롬프트(구도·색·스타일 등).
   */
  bannerAiImagePromptHint?: string;
  /** AI 프롬프트: 생성 대상 유형 */
  aiPromptType?: AiPromptType;
  aiPromptNationality?: string;
  aiPromptGender?: string;
  aiPromptAge?: string;
  aiPromptHair?: string;
  aiPromptSkin?: string;
  aiPromptClothing?: string;
  aiPromptClothingColor?: string;
  aiPromptActionPose?: string;
  aiPromptCameraAngle?: string;
  aiPromptBackground?: string;
  aiPromptLighting?: string;
  /** AI 프롬프트 '카메라 렌즈': 기종명 또는 렌즈 풀네임만 (셀피 등 촬영 방식 문구 제외) */
  aiPromptCamera?: string;
  aiPromptPhotoStyle?: string;
  aiPromptAdditionalOptions?: AiPromptAdditionalOption[];
  aiPromptRemoveAiEffect?: boolean;
  aiPromptCustomInput?: string;
  /**
   * AI 인물 직접 입력란 참고 이미지 — 프로필 이미지 생성 시 포즈·의상·구도·조명·무드 참고.
   * 가상 프로필의 얼굴·나이 등 정체성은 텍스트 프롬프트를 우선합니다.
   */
  aiPromptCustomReferenceImage?: { mimeType: string; dataBase64: string };
  /** 티샷 AI 가상회원 프로필 — 포즈·자세 */
  aiPromptTeeshotPose?: string;
  /** 티샷 AI 가상회원 프로필 — 뒷/옆/앞/3·4 측면 */
  aiPromptTeeshotViewAngle?: string;
  /** 티샷 AI 가상회원 프로필 — 카메라 거리·프레이밍 */
  aiPromptTeeshotCameraDistance?: string;
}

export interface GeneratedContent {
  content: string;
  suggestions: string[];
  sources: { uri: string; title: string }[];
}