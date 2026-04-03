
import { GoogleGenAI, Modality } from "@google/genai";
import type { UserInput, GeneratedContent } from '../types';
import { SYSTEM_PROMPT, GEMINI_NATIVE_IMAGE_MODEL_ID } from '../constants';

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
    userPrompt += `**단, 사용자가 직접 입력한 키워드/주제는 예외입니다. 사용자가 입력한 키워드/주제를 정확히 반영하여 컨텐츠를 생성하세요.**\n`;
    userPrompt += `일반적인 주제나 사용자가 입력한 주제에만 집중하여 컨텐츠를 생성하세요.\n\n`;
  }

  // 기타 이벤트 배너: 배너에 넣을 **문구 기획만** (이미지 프롬프트·시각 스펙 없음)
  if (input.format === 'ETC-BANNER' && input.bannerContentType === '기타 이벤트 배너') {
    const headline = input.headline || '';
    userPrompt += `카테고리: ${input.category}\n`;
    userPrompt += `컨텐츠 유형: 기타 이벤트 배너 (텍스트 기획 전용)\n`;
    if (input.aspectRatio) {
      userPrompt += `선택된 기본 비율(이미지 생성·레이아웃 참고용 — 본문에 '기본 비율:' 줄로 출력하지 마세요): ${input.aspectRatio}\n`;
    }
    userPrompt += `\n🚨🚨🚨 역할: 이벤트 배너에 들어갈 **카피(문구)만** 정리합니다. 🚨🚨🚨\n`;
    userPrompt += `- **금지**: 이미지 생성 프롬프트, 영어 프롬프트, 나노바나나/Midjourney/DALL·E 등 도구용 설명, "제목:"·"기본 비율:"·📐·🎨·💡 형식의 일반 배너 출력, 색상 HEX·폰트명·픽셀·일러스트 지시.\n`;
    userPrompt += `- **허용**: 한국어로 배너에 실을 문구를 섹션별로 짧게 정리. (선택) 정보 위계를 **문장으로만** 2~3줄 안내 가능.\n\n`;
    userPrompt += `🚨 사용자 입력 원본 보존 (최우선)\n`;
    userPrompt += `- 제목·부제목·본문·CTA 중 **입력된 필드**는 최종 출력에서 **입력과 완전히 동일** (확장·축약·맞춤법·띄어쓰기·구두점 변경 금지).\n`;
    userPrompt += `- **비어 있는 필드만** 이벤트에 맞게 AI가 작성.\n\n`;
    userPrompt += `제목(필수): "${headline}"\n`;
    userPrompt += `→ "## 헤드라인" 아래에 위 문자열을 **그대로** 넣으세요.\n\n`;
    if (input.subheadline && input.subheadline.trim()) {
      userPrompt += `부제목: "${input.subheadline}" → "## 서브카피" 아래에 **그대로**.\n\n`;
    } else {
      userPrompt += `부제목: (미입력 — "## 서브카피"에 AI 작성)\n\n`;
    }
    if (input.bodyCopy && input.bodyCopy.trim()) {
      userPrompt += `본문: """${input.bodyCopy}""" → "## 본문" 아래에 **그대로**.\n\n`;
    } else {
      userPrompt += `본문: (미입력 — "## 본문"에 AI 작성)\n\n`;
    }
    if (input.cta && input.cta.trim()) {
      userPrompt += `CTA: "${input.cta}" → "## CTA" 아래에 **그대로**.\n\n`;
    } else {
      userPrompt += `CTA: (미입력 — "## CTA"에 AI 작성)\n\n`;
    }
    userPrompt += `필수 출력 형식 (이 순서·제목 그대로):\n\n`;
    userPrompt += `## 헤드라인\n`;
    userPrompt += `(위 제목 문자열 그대로, 한 줄)\n\n`;
    userPrompt += `## 서브카피\n`;
    userPrompt += `(부제·보조 문구, 1~3줄)\n\n`;
    userPrompt += `## 본문\n`;
    userPrompt += `(바디 카피, 필요 시 여러 줄)\n\n`;
    userPrompt += `## CTA\n`;
    userPrompt += `(행동 유도 한 줄)\n\n`;
    userPrompt += `## 텍스트 배치 안내 (선택)\n`;
    userPrompt += `위 문구를 배너에서 어떻게 나눠 배치할지 **한국어 문장**으로만 2~4줄 (예: 상단 헤드라인, 중앙 본문). 색·이미지·폰트 지시 금지.\n\n`;
    userPrompt += `마지막 줄: 후속 제안: [비슷한 이벤트 주제 1], [2], [3]\n`;

    if (input.referenceUrl) {
      const urlContent = await fetchUrlContent(input.referenceUrl);
      userPrompt += `\n[참고 URL 내용]\n`;
      userPrompt += `URL: ${input.referenceUrl}\n`;
      userPrompt += `내용:\n${urlContent}\n`;
      userPrompt += `\n위 URL 정보를 반영하되, 사용자가 입력한 고정 문구는 절대 수정하지 마세요.\n`;
    }
    userPrompt += `text_length: ${input.blogLength}\n`;
    return userPrompt;
  }

  if (input.format === 'ETC-BANNER' && input.bannerContentType === '일반') {
      // 배너/포스터 — 일반 유형
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
  } else if (input.format !== 'ETC-BANNER') {
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
    userPrompt += `video_length: ${input.videoLength}초\n`;
    userPrompt += `cut_count: ${input.cutCount || 1}개\n`;
    userPrompt += `\n🚨 중요: 사용자가 입력한 키워드/주제("${input.keyword}")와 참고 텍스트를 반드시 반영하여 영상 프롬프트와 이미지 프롬프트를 생성하세요. 키워드/주제와 관련된 내용으로만 구성하세요.\n`;
    if (input.cutTexts && input.cutTexts.length > 0) {
      userPrompt += `\n[컷별 참고 텍스트]\n`;
      input.cutTexts.forEach((cutText, index) => {
        if (cutText && cutText.trim()) {
          userPrompt += `컷 ${index + 1}: ${cutText}\n`;
        }
      });
      userPrompt += `\n위 컷별 참고 텍스트와 키워드/주제를 바탕으로 각 컷에 맞는 이미지 프롬프트를 생성하세요.\n`;
      userPrompt += `🚨 중요: 모든 컷의 이미지 프롬프트에서 등장인물이 있다면, 영상 프롬프트에서 명시한 등장인물의 외형(얼굴 특징, 헤어스타일, 체형, 의상 등)을 정확히 동일하게 유지해야 합니다. 컷마다 등장인물의 생김새가 달라지면 안 됩니다.\n`;
    }
  }
  if (input.format === 'ETC-BANNER') {
    const textOnlyBannerNotice =
      '\n🚨 이 컨텐츠 유형은 **텍스트 전용**입니다.\n' +
      '- 출력 금지: 일반 배너용 "제목:", 기본 비율·테마·스타일 설명, 📐 디자인 컨셉, 🎨 AI 이미지 생성 프롬프트, 💡 디자인 가이드라인, 후속 제안.\n' +
      '- 아래에 명시한 섹션 제목을 그대로 사용하고 한국어로만 작성하세요.\n\n';

    if (input.bannerContentType === '랭킹오브더월드') {
      userPrompt += `카테고리: ${input.category}\n`;
      userPrompt += `컨텐츠 유형: 랭킹오브더월드\n`;
      if (input.aspectRatio) {
        userPrompt += `(참고) 썸네일·배너 이미지 생성 시 선호 비율: ${input.aspectRatio}. 본문 출력 형식 규칙은 아래와 같습니다.\n`;
      }
      if (input.keyword && input.keyword.trim()) {
        userPrompt += `골프 관련 랭킹 주제: ${input.keyword}\n`;
      }
      userPrompt += textOnlyBannerNotice;
      userPrompt += `다음 섹션으로 출력하세요:\n\n`;
      userPrompt += `## 랭킹 주제\n`;
      userPrompt += `(위 주제를 한 줄로 요약)\n\n`;
      userPrompt += `## Top 10 랭킹\n`;
      userPrompt += `1위부터 10위까지 번호를 붙이고, 각 항목은 "순위. 항목명 — 한두 문장 설명 또는 핵심 포인트" 형식으로 정돈하세요. 골프와 직접 관련된 주제여야 합니다.\n\n`;
      userPrompt += `## 인스타그램 포스팅 글\n`;
      userPrompt += `위 랭킹을 소개하는 캡션(2~5문단, 이모지 적절히). 마지막에 해시태그 5~8개(골프 관련).\n`;
      userPrompt += `검증되지 않은 사실은 단정하지 말고, 일반적으로 알려진 정보나 상식 수준에서 작성하세요.\n`;
      userPrompt += `\n본문 마지막 줄에 반드시 추가: 후속 제안: [비슷한 랭킹 주제 1], [주제 2], [주제 3] (쉼표로 구분, 각 20자 내외)\n`;
      return userPrompt;
    }

    if (input.bannerContentType === '어디로칠까') {
      const name = (input.bannerGolfCourseName || '').trim();
      userPrompt += `카테고리: ${input.category}\n`;
      userPrompt += `컨텐츠 유형: 어디로칠까\n`;
      userPrompt += `국내 골프장 이름: ${name}\n`;
      if (input.aspectRatio) {
        userPrompt += `(참고) 썸네일·배너 이미지 생성 시 선호 비율: ${input.aspectRatio}. 본문 출력 형식 규칙은 아래와 같습니다.\n`;
      }
      userPrompt += textOnlyBannerNotice;
      userPrompt += `다음 섹션으로 출력하세요:\n\n`;
      userPrompt += `## 골프장 개요\n`;
      userPrompt += `지역(시·도), 대략적인 특징, 어떤 골퍼에게 맞을지 등을 한눈에 정리.\n\n`;
      userPrompt += `## 코스·시설·분위기\n`;
      userPrompt += `알려진 정보를 바탕으로 정리. 불확실하면 "일반적으로 알려진 바에 따르면" 등으로 서술하고 추측은 최소화.\n\n`;
      userPrompt += `## 라운딩·예약 팁\n`;
      userPrompt += `예약, 시즌, 준비물 등 실용 팁 3~6가지.\n\n`;
      userPrompt += `## 인스타그램 포스팅 글\n`;
      userPrompt += `이 골프장을 소개하는 캡션과 해시태그 5~8개.\n`;
      userPrompt += `\n본문 마지막 줄에 반드시 추가: 후속 제안: [다른 국내 골프장 또는 지역 1], [2], [3] (쉼표로 구분)\n`;
      return userPrompt;
    }

    if (input.bannerContentType === '골프용어사전') {
      const level = input.golfDictionaryLevel || '입문자';
      userPrompt += `카테고리: ${input.category}\n`;
      userPrompt += `컨텐츠 유형: 골프용어사전\n`;
      userPrompt += `난이도: ${level}\n`;
      if (input.aspectRatio) {
        userPrompt += `(참고) 썸네일·배너 이미지 생성 시 선호 비율: ${input.aspectRatio}. 본문 출력 형식 규칙은 아래와 같습니다.\n`;
      }
      userPrompt += textOnlyBannerNotice;
      userPrompt += `다음 섹션으로 출력하세요:\n\n`;
      userPrompt += `## 난이도: ${level}\n`;
      userPrompt += `선택 난이도에 맞는 골프 용어 **정확히 10개**를 선정하세요.\n\n`;
      userPrompt += `## 골프 용어 10선\n`;
      userPrompt += `각 항목 형식: **용어** (영문 병기 가능) — 짧은 정의(1~2문장) — 라운딩/연습에서의 쓰임 한 줄.\n`;
      userPrompt += `입문자: 기초 규칙·스윙·코스 기본 용어 위주. 중급자: 샷 형태, 전략, 스코어·필드 용어. 고급자: 룰 세부, 샷 셰이핑, 장비·스펙, 투어·기술 용어 등.\n\n`;
      userPrompt += `## 인스타그램 포스팅 글\n`;
      userPrompt += `오늘의 용어 공부를 권하는 톤의 캡션과 해시태그 5~8개.\n`;
      userPrompt += `\n본문 마지막 줄에 반드시 추가: 후속 제안: [용어/주제 1], [2], [3] (쉼표로 구분, 같은 난이도 또는 인접 난이도)\n`;
      return userPrompt;
    }

    // 인포그래픽 컨텐츠 유형인 경우
    if (input.bannerContentType === '인포그래픽') {
      userPrompt += `컨텐츠 유형: 인포그래픽\n`;
      if (input.aspectRatio) {
        userPrompt += `기본 비율: ${input.aspectRatio}\n`;
      }
      if (input.keyword && input.keyword.trim()) {
        userPrompt += `키워드/주제: ${input.keyword}\n`;
      }
      userPrompt += `\n🚨🚨🚨 최우선 중요: 사용자가 입력한 키워드/주제("${input.keyword || ''}")를 반드시 중심으로 인포그래픽 컨텐츠를 생성하세요.\n`;
      userPrompt += `- 사용자가 입력한 키워드/주제에서 벗어나지 마세요. 무작위로 다른 주제의 내용을 생성하지 마세요.\n`;
      userPrompt += `- 키워드/주제가 짧거나 간단한 경우(예: "스크린 골프", "골프", "퍼팅" 등), 해당 키워드와 관련된 구체적인 정보, 데이터, 통계, 팁 등을 자동으로 확장하여 인포그래픽을 구성하세요.\n`;
      userPrompt += `- 키워드/주제와 관련된 정보, 데이터, 통계, 팁 등을 시각적으로 표현할 수 있는 인포그래픽으로 구성하세요.\n`;
      userPrompt += `- 인포그래픽은 차트, 그래프, 아이콘, 숫자, 텍스트 등을 포함한 정보 전달형 디자인이어야 합니다.\n`;
      userPrompt += `- 키워드만 입력되어도 관련된 구체적인 내용(통계, 방법, 팁, 데이터 등)을 자동으로 기획하여 인포그래픽에 포함하세요.\n`;
      userPrompt += `- 시각은 되도록 일러스트·아이콘·차트 등 그래픽 중심으로 하고 실사 사진은 최소화하세요. 한글·숫자 텍스트는 가독성(대비, 크기 위계, 여백)을 최우선으로 📊·📐·🎨에 반영하세요.\n`;
      return userPrompt;
    }
    
    // 일반 배너/포스터 포맷인 경우
    userPrompt +=
      `\n[배너/포스터 시각 방향] 📐 디자인 컨셉·🎨 AI 이미지 생성 프롬프트 작성 시: 실사(현실 사진)보다 **일러스트·벡터·플랫 그래픽·아이콘·도형**을 우선하세요. ` +
      `텍스트는 **가독성 최우선**(배경과 충분한 명암 대비, 헤드라인·본문 크기 위계, 필요 시 글자 뒤 반투명 패널·외곽선).\n\n`;
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
  if (input.tone && input.format !== 'YOUTUBE-SHORTFORM') {
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

/**
 * 사용 가능한 모델 목록 확인 (디버깅용)
 */
const listAvailableModels = async (ai: GoogleGenAI): Promise<void> => {
  try {
    // @google/genai SDK에서 사용 가능한 모델 목록 확인
    console.log('사용 가능한 모델 확인 시도...');
    // 참고: SDK에 listModels 메서드가 있다면 사용
  } catch (error) {
    console.warn('모델 목록 확인 실패:', error);
  }
};

export const generateGolfContent = async (userInput: UserInput): Promise<GeneratedContent> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not set in environment variables.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 디버깅: 사용 가능한 모델 목록 확인 (필요시)
  // await listAvailableModels(ai);

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
  // 현재 API에서 사용 가능한 모델: gemini-2.5-flash, gemini-2.5
  const models = [
    'gemini-2.5-flash',       // 빠른 모델 (우선 사용)
    'gemini-2.5',             // 더 강력한 모델 (백업)
  ];
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
        // @google/genai SDK의 generateContent API 호출
        // 참고: 모델 이름이 정확해야 함
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
      const errorMessage = error?.error?.message || error?.message || '';
      
      console.error(`모델 ${model} 오류:`, {
        statusCode,
        errorMessage,
        fullError: error
      });
      
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
  if (lastError) {
    const errorMessage = (lastError as any)?.error?.message || lastError?.message || '알 수 없는 오류';
    throw new Error(`모든 모델에서 요청이 실패했습니다. 마지막 오류: ${errorMessage}. 사용 가능한 모델 이름을 확인해주세요.`);
  }
  throw new Error('모든 모델에서 요청이 실패했습니다.');
};

/**
 * 이미지 생성은 항상 Gemini 네이티브 이미지 모델 1종만 사용합니다.
 * 두 번째 인자는 하위 호환용이며 무시됩니다.
 */
export const generateImage = async (prompt: string, _modelIgnored?: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not set in environment variables.");
  }

  const modelId = GEMINI_NATIVE_IMAGE_MODEL_ID;
  console.log('[generateImage] model:', modelId);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await retryWithBackoff(async () => {
    return await ai.models.generateContent({
      model: modelId,
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