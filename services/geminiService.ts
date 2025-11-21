
import { GoogleGenAI, Modality } from "@google/genai";
import type { UserInput, GeneratedContent } from '../types';
import { SYSTEM_PROMPT } from '../constants';

const formatUserInput = (input: UserInput): string => {
  let userPrompt = `
아래 항목을 채워서 그대로 입력하세요.

카테고리: ${input.category}
형식: ${input.format}
`;

  if (input.keyword && input.keyword.trim()) {
    userPrompt += `키워드/주제: ${input.keyword}\n`;
  }

  if (input.userText) {
    userPrompt += `user_text: ${input.userText}\n`;
  }
  if (input.format === 'INSTAGRAM-CARD') {
    userPrompt += `card_count: ${input.cardCount}\n`;
  }
  if (input.format === 'NAVER-BLOG/BAND' || input.format === 'ETC-BANNER') {
    userPrompt += `text_length: ${input.blogLength}\n`;
    if (input.format === 'NAVER-BLOG/BAND') {
      userPrompt += `section_count: ${input.sectionCount}\n`;
    }
  }
  if (input.format === 'YOUTUBE-SHORTFORM') {
    userPrompt += `video_length: ${input.videoLength}\n`;
  }
  if (input.tone) {
    userPrompt += `톤앤매너: ${input.tone}\n`;
  }
  return userPrompt;
}

/**
 * 재시도 로직 - 503/429 에러 시 재시도
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 2000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      const statusCode = error?.error?.code || error?.status || error?.statusCode;
      const isRetryable = statusCode === 503 || statusCode === 429;
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      // 429 에러: 3초 → 6초 → 12초
      // 503 에러: 2초 → 4초 → 8초
      const is429 = statusCode === 429;
      const multiplier = is429 ? 3 : 2;
      const delay = baseDelay * multiplier * Math.pow(1.5, attempt);
      
      console.log(`API 호출 실패 (에러 ${statusCode}). ${(delay / 1000).toFixed(1)}초 후 재시도...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('알 수 없는 오류가 발생했습니다.');
};

export const generateGolfContent = async (userInput: UserInput): Promise<GeneratedContent> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not set in environment variables.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const userRequest = formatUserInput(userInput);

  // Google Search 제거로 API 한도 절약
  const config: any = {
    systemInstruction: SYSTEM_PROMPT,
  };

  // 빠른 모델 우선 사용, 실패 시 백업 모델로 전환
  const models = ['gemini-2.0-flash-exp', 'gemini-1.5-flash'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      console.log(`모델 ${model}로 시도 중...`);
      const response = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
          model: model,
          contents: userRequest,
          config: config
        });
      }, 1, 2000); // 429/503 에러 시 1회 재시도
      
      const rawText = response.text;
      
      if (!rawText) {
        throw new Error(`모델 ${model}에서 응답을 받았지만 텍스트가 없습니다.`);
      }
      
      let content = rawText;
      let suggestions: string[] = [];

      const suggestionsRegex = /후속 제안:\s*(.*)/i;
      const match = rawText.match(suggestionsRegex);

      if (match && match[1]) {
        suggestions = match[1].split(',').map(s => s.trim()).filter(s => s);
        content = rawText.replace(suggestionsRegex, '').trim();
      }
      
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const sources: { uri: string; title: string }[] = [];

      if (groundingMetadata?.groundingChunks) {
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web && chunk.web.uri) {
            sources.push({
              uri: chunk.web.uri,
              title: chunk.web.title || chunk.web.uri,
            });
          }
        }
      }

      return { content, suggestions, sources };
    } catch (error: any) {
      lastError = error;
      const statusCode = error?.error?.code || error?.status || error?.statusCode;
      
      // 404 (모델 없음) 또는 503 (서버 과부하)인 경우 다음 모델 시도
      if (statusCode === 404 || statusCode === 503) {
        console.log(`모델 ${model} 실패 (${statusCode}). 다음 모델로 시도...`);
        continue;
      }
      
      // 다른 에러는 즉시 반환
      throw error;
    }
  }
  
  // 모든 모델 실패 시
  throw lastError || new Error('모든 모델에서 요청이 실패했습니다.');
};

export const generateImage = async (prompt: string, model: string = 'imagen-4.0-generate-001'): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not set in environment variables.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (model === 'imagen-4.0-generate-001') {
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages[0].image.imageBytes;
    }
  } else if (model === 'gemini-2.5-flash-image') {
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
    });
    
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
  }
  
  throw new Error("Image generation failed.");
};

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', resolution: '720p' | '1080p'): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not set. Please select a key.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: resolution,
      aspectRatio: aspectRatio,
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

  if (!downloadLink) {
    throw new Error("Video generation succeeded but no download link was provided.");
  }

  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
  }
  const videoBlob = await response.blob();
  return URL.createObjectURL(videoBlob);
};