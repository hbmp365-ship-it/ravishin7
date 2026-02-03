
import { GoogleGenAI, Modality } from "@google/genai";
import type { UserInput, GeneratedContent } from '../types';
import { SYSTEM_PROMPT } from '../constants';

/**
 * URL에서 텍스트 내용 가져오기
 */
const fetchUrlContent = async (url: string): Promise<string> => {
  try {
    console.log('URL 내용 가져오기 시작:', url);
    
    // CORS 문제를 피하기 위해 프록시 서버 사용 또는 직접 fetch
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    console.log('Fetch 응답 상태:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    console.log('HTML 길이:', html.length, '자');
    
    // 메인 콘텐츠 영역 찾기 (네이버 스포츠 등 특정 사이트에 맞춤)
    let textContent = '';
    
    // 네이버 스포츠의 경우 특정 클래스나 ID를 찾아서 추출
    const contentSelectors = [
      /<main[^>]*>([\s\S]*?)<\/main>/i,
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ];
    
    for (const selector of contentSelectors) {
      const match = html.match(selector);
      if (match && match[1]) {
        textContent = match[1];
        console.log('메인 콘텐츠 영역 찾음:', textContent.substring(0, 200));
        break;
      }
    }
    
    // 메인 콘텐츠를 찾지 못한 경우 전체 HTML에서 추출
    if (!textContent) {
      textContent = html;
      console.log('메인 콘텐츠 영역을 찾지 못해 전체 HTML 사용');
    }
    
    // HTML 파싱 (텍스트만 추출)
    const parsedText = textContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 스크립트 제거
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // 스타일 제거
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '') // noscript 제거
      .replace(/<!--[\s\S]*?-->/g, '') // 주석 제거
      .replace(/<[^>]+>/g, ' ') // HTML 태그 제거
      .replace(/&nbsp;/g, ' ') // &nbsp; 제거
      .replace(/&[a-z]+;/gi, ' ') // 기타 HTML 엔티티 제거
      .replace(/\s+/g, ' ') // 연속된 공백 제거
      .trim();
    
    const finalText = parsedText.substring(0, 15000); // 최대 15000자로 제한
    console.log('파싱된 텍스트 길이:', finalText.length, '자');
    console.log('파싱된 텍스트 미리보기:', finalText.substring(0, 500));
    
    if (!finalText || finalText.length < 50) {
      console.warn('URL에서 충분한 내용을 가져오지 못했습니다. 원본 HTML 일부를 포함합니다.');
      // 원본 HTML의 일부를 포함
      const htmlPreview = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .substring(0, 5000);
      return `URL: ${url}\n\n페이지 내용이 제한적이거나 동적으로 로드되는 콘텐츠입니다. 다음은 페이지의 일부 내용입니다:\n\n${htmlPreview}`;
    }
    
    return finalText;
  } catch (error: any) {
    console.error('URL 내용 가져오기 실패:', error);
    console.error('에러 상세:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // CORS 에러인 경우 안내 메시지
    if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
      return `URL 내용을 가져오는 중 CORS 오류가 발생했습니다. 브라우저에서 직접 접근할 수 없는 URL입니다.\n\nURL: ${url}\n\n해결 방법:\n1. 서버 사이드에서 URL 내용을 가져오는 API 엔드포인트를 사용하세요.\n2. 또는 URL의 내용을 복사하여 "참고 텍스트" 입력란에 붙여넣어주세요.`;
    }
    
    return `URL 내용을 가져오는 중 오류가 발생했습니다: ${error.message}\n\nURL: ${url}`;
  }
};

const formatUserInput = async (input: UserInput): Promise<string> => {
  let userPrompt = `
아래 항목을 채워서 그대로 입력하세요.

형식: ${input.format}
`;

  // 골프 관련 컨텐츠 토글 처리
  if (input.isGolfRelated === false) {
    userPrompt += `\n🚨🚨🚨 중요: 골프 관련 컨텐츠 비활성화 🚨🚨🚨\n`;
    userPrompt += `골프와 연관된 내용, 키워드, 예시, 참고사항을 절대 사용하지 마세요.\n`;
    userPrompt += `골프장, 골프 용품, 골프 선수, 골프 용어 등 골프 관련 모든 내용을 제외하고 컨텐츠를 생성하세요.\n`;
    userPrompt += `일반적인 주제나 사용자가 입력한 주제에만 집중하여 컨텐츠를 생성하세요.\n\n`;
  }

  if (input.format === 'ETC-BANNER') {
    // 배너/포스터 포맷일 때
    const headline = input.headline || '';
    const headlineLength = headline.length;
    userPrompt += `헤드라인: "${headline}"\n`;
    if (headlineLength > 8) {
      userPrompt += `\n🚨🚨🚨 절대 엄수 규칙 🚨🚨🚨\n`;
      userPrompt += `헤드라인 글자 수: ${headlineLength}자 (8글자 초과)\n`;
      userPrompt += `📝 원본 헤드라인: "${headline}"\n`;
      userPrompt += `\n❌ 절대 금지:\n`;
      userPrompt += `- 단어 추가 금지 (예: "오픈!!" → "오픈 기념" 절대 금지)\n`;
      userPrompt += `- 단어 변경 금지 (예: "오픈" → "런칭", "서비스" → "앱" 절대 금지)\n`;
      userPrompt += `- 느낌표/물음표 제거 금지 (예: "오픈!!" → "오픈" 절대 금지)\n`;
      userPrompt += `- 띄어쓰기 변경 금지\n`;
      userPrompt += `- 어떠한 수정도 금지\n`;
      userPrompt += `\n✅ 필수 출력:\n`;
      userPrompt += `"${headline}" ← 이것을 정확히 100% 그대로 사용하세요.\n`;
      userPrompt += `\n⚠️ 경고: 헤드라인을 조금이라도 수정하면 심각한 오류입니다. 반드시 원본 그대로 사용하세요!\n\n`;
    } else {
      userPrompt += `헤드라인 글자 수: ${headlineLength}자 (8글자 이하 - 확장 가능)\n`;
    }
    
    if (input.subheadline && input.subheadline.trim()) {
      const subheadlineLength = input.subheadline.length;
      userPrompt += `서브헤드라인: "${input.subheadline}"\n`;
      if (subheadlineLength > 8) {
        userPrompt += `🚨 서브헤드라인 글자 수: ${subheadlineLength}자 (8글자 초과) → 그대로 사용 필수\n`;
        userPrompt += `✅ 반드시 "${input.subheadline}" 정확히 그대로 출력하세요. 수정/추가/삭제 금지!\n\n`;
      } else {
        userPrompt += `서브헤드라인 글자 수: ${subheadlineLength}자 (8글자 이하 - 확장 가능)\n`;
      }
    } else {
      userPrompt += `서브헤드라인: (입력 없음 - 자동 생성)\n`;
    }
    
    if (input.bodyCopy && input.bodyCopy.trim()) {
      userPrompt += `바디카피: ${input.bodyCopy}\n`;
      userPrompt += `바디카피 글자 수: ${input.bodyCopy.length}자\n`;
      userPrompt += `✅ 입력된 바디카피를 그대로 사용하세요.\n`;
    } else {
      userPrompt += `바디카피: (입력 없음 - 자동 생성)\n`;
    }
    
    if (input.cta && input.cta.trim()) {
      const ctaLength = input.cta.length;
      userPrompt += `CTA: "${input.cta}"\n`;
      if (ctaLength > 8) {
        userPrompt += `🚨 CTA 글자 수: ${ctaLength}자 (8글자 초과) → 그대로 사용 필수\n`;
        userPrompt += `✅ 반드시 "${input.cta}" 정확히 그대로 출력하세요. 수정/추가/삭제 금지!\n\n`;
      } else {
        userPrompt += `CTA 글자 수: ${ctaLength}자 (8글자 이하 - 확장 가능)\n`;
      }
    } else {
      userPrompt += `CTA: (입력 없음 - 자동 생성)\n`;
    }
  } else {
    // 다른 포맷일 때
    userPrompt += `카테고리: ${input.category}\n`;
    if (input.keyword && input.keyword.trim()) {
      userPrompt += `키워드/주제: ${input.keyword}\n`;
      userPrompt += `🚨 중요: 위 키워드/주제를 반드시 중심으로 컨텐츠를 생성하세요. 키워드/주제의 핵심 내용을 적극적으로 반영하고, 이 주제에서 벗어나지 않도록 주의하세요.\n`;
    }
    if (input.userText && input.userText.trim()) {
      userPrompt += `\n[참고 텍스트]\n`;
      userPrompt += `${input.userText}\n`;
      userPrompt += `\n🚨🚨🚨 참고 텍스트 활용 규칙 (최우선) 🚨🚨🚨\n`;
      userPrompt += `- 위 참고 텍스트의 내용을 적극적으로 활용하여 컨텐츠를 생성하세요.\n`;
      userPrompt += `- 참고 텍스트의 핵심 정보, 데이터, 사실, 통계, 예시 등을 정확히 반영하세요.\n`;
      userPrompt += `- 참고 텍스트의 내용을 바탕으로 구체적이고 정확한 정보를 제공하세요.\n`;
      userPrompt += `- 참고 텍스트에 없는 내용을 임의로 추가하지 마세요.\n`;
      if (input.keyword && input.keyword.trim()) {
        userPrompt += `- 키워드/주제와 참고 텍스트를 함께 고려하여 일관성 있는 컨텐츠를 생성하세요.\n`;
      }
      userPrompt += `\n`;
    }
  }
  
  if (input.referenceUrl) {
    // URL 내용 가져오기
    const urlContent = await fetchUrlContent(input.referenceUrl);
    userPrompt += `\n[참고 URL 내용]\n`;
    userPrompt += `URL: ${input.referenceUrl}\n`;
    userPrompt += `내용:\n${urlContent}\n`;
    userPrompt += `\n위 URL의 내용을 참고하여 컨텐츠를 생성해주세요. URL의 내용을 정확히 반영하고, 출처를 명시해주세요.\n`;
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
  if (input.format === 'ETC-BANNER') {
    if (input.aspectRatio) {
      userPrompt += `기본 비율: ${input.aspectRatio}\n`;
    }
    if (input.theme) {
      userPrompt += `테마: ${input.theme}\n`;
      if (input.theme === '다크모드') {
        userPrompt += `⚠️ 중요: 어두운 배경(dark background)에 밝은 텍스트(light text)를 사용하세요.\n`;
      } else {
        userPrompt += `⚠️ 중요: 밝은 배경(light background)에 어두운 텍스트(dark text)를 사용하세요.\n`;
      }
    }
    if (input.style) {
      userPrompt += `시각적 스타일: ${input.style}\n`;
    }
    if (input.alignment) {
      userPrompt += `정렬 옵션: ${input.alignment}\n`;
    }
    if (input.imageGeneratorTool) {
      userPrompt += `이미지 생성 프롬프트 모델: ${input.imageGeneratorTool}\n`;
      userPrompt += `⚠️ 중요: 선택된 모델(${input.imageGeneratorTool})에 최적화된 프롬프트를 작성하세요.\n`;
    }
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

  const userRequest = await formatUserInput(userInput);

  // API 요청 데이터 로그
  console.log('=== API 요청 데이터 ===');
  console.log('UserInput:', JSON.stringify(userInput, null, 2));
  console.log('Formatted User Request:', userRequest);
  console.log('System Prompt 길이:', SYSTEM_PROMPT.length, '자');
  console.log('====================');

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
      console.log('API 호출 파라미터:', {
        model,
        contents: userRequest.substring(0, 500) + (userRequest.length > 500 ? '...' : ''),
        contentsLength: userRequest.length,
        config: {
          systemInstructionLength: config.systemInstruction?.length || 0,
        }
      });
      
      const response = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
          model: model,
          contents: userRequest,
          config: config
        });
      }, 1, 2000); // 429/503 에러 시 1회 재시도
      
      console.log('API 응답 받음:', {
        hasText: !!response.text,
        textLength: response.text?.length || 0,
        hasCandidates: !!response.candidates,
        candidatesCount: response.candidates?.length || 0,
      });
      
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