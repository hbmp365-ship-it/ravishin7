
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
  aspectRatio?: string;
  theme?: string;
  style?: string;
  headline?: string;
  subheadline?: string;
  bodyCopy?: string;
  cta?: string;
  imageGeneratorTool?: string;
  alignment?: string;
  isGolfRelated?: boolean;
  cutCount?: number;
  cutTexts?: string[];
  bannerContentType?: '일반' | '인포그래픽' | '랭킹오브더월드' | '어디로칠까' | '골프용어사전' | '기타 이벤트 배너';
  /** 어디로칠까: 국내 골프장 이름 */
  bannerGolfCourseName?: string;
  /** 골프용어사전: 입문자 | 중급자 | 고급자 */
  golfDictionaryLevel?: '입문자' | '중급자' | '고급자';
}

export interface GeneratedContent {
  content: string;
  suggestions: string[];
  sources: { uri: string; title: string }[];
}