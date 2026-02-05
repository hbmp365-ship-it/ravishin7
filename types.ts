
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
  bannerContentType?: '일반' | '인포그래픽';
}

export interface GeneratedContent {
  content: string;
  suggestions: string[];
  sources: { uri: string; title: string }[];
}