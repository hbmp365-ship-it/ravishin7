
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
    userPrompt += `text_length_level: ${input.blogLength}\n`;
  }
  if (input.format === 'YOUTUBE-SHORTFORM') {
    userPrompt += `video_length_level: ${input.videoLength}\n`;
    userPrompt += `scene_count: ${input.sceneCount}\n`;
  }
  if (input.tone) {
    userPrompt += `톤앤매너: ${input.tone}\n`;
  }
  return userPrompt;
}

/**
 * 재시도 로직이 포함된 API 호출 헬퍼 함수
 * 503 에러의 경우 더 긴 대기 시간 적용
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // 503 (서버 과부하) 또는 429 (너무 많은 요청) 에러인 경우에만 재시도
      const statusCode = error?.error?.code || error?.status || error?.statusCode;
      const isRetryable = statusCode === 503 || statusCode === 429;
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      // 503 에러의 경우 더 긴 대기 시간: 5초, 10초, 20초
      // 429 에러의 경우: 2초, 4초, 8초
      const is503 = statusCode === 503;
      const multiplier = is503 ? 5 : 2;
      const delay = baseDelay * multiplier * Math.pow(2, attempt);
      
      console.log(`API 호출 실패 (시도 ${attempt + 1}/${maxRetries + 1}). ${(delay / 1000).toFixed(1)}초 후 재시도...`);
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

  const config: any = {
    systemInstruction: SYSTEM_PROMPT,
    tools: [{googleSearch: {}}],
  };

  // 모델 우선순위: gemini-2.5-pro -> gemini-1.5-pro -> gemini-1.5-flash
  const models = ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];
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
      }, 2, 2000); // 503 에러 시 2회만 재시도 (각 모델당)
      
      // 성공 시 결과 반환
      const rawText = response.text;
      
      // response.text가 없는 경우 에러 처리
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
      
      // 503 에러가 아니면 즉시 에러 반환 (다른 모델 시도 불필요)
      if (statusCode !== 503) {
        throw error;
      }
      
      // 503 에러인 경우 다음 모델로 시도
      console.log(`모델 ${model} 실패 (503). 다음 모델로 시도...`);
      continue;
    }
  }
  
  // 모든 모델 실패 시 마지막 에러 throw
  throw lastError || new Error('모든 모델에서 요청이 실패했습니다. 서버가 과부하 상태입니다. 잠시 후 다시 시도해주세요.');

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