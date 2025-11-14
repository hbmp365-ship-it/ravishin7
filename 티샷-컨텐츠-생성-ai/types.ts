
export interface UserInput {
  category: string;
  format: string;
  keyword: string;
  userText: string;
  cardCount: number;
  blogLength: number;
  videoLength: number;
  sceneCount: number;
  tone: string;
}

export interface GeneratedContent {
  content: string;
  suggestions: string[];
  sources: { uri: string; title: string }[];
}