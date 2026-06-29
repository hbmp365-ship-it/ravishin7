export type ImagePromptSlot = {
  /** imageStatuses 맵 키 — cover | insta-card-N */
  slotId: string;
  prompt: string;
  /** 카드 번호 (표지는 0, 인스타 카드 외 포맷은 생략) */
  cardNumber?: number;
};

export type InstagramCardData = {
  number: number;
  subtitle: string;
  body: string;
  prompt: string;
  source: string;
};

export type ParsedInstagramCards = {
  coverPrompt: string;
  cards: InstagramCardData[];
};

/** 생성 결과에서 파싱용 노이즈(JSON 블록·포맷 레이블 등) 제거 */
export const cleanGeneratedContent = (content: string): string =>
  content
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/^[A-D]\)\s+(INSTAGRAM-CARD|NAVER-BLOG\/BAND|YOUTUBE-SHORTFORM|ETC-BANNER):\s*/gm, '')
    .replace(/^\{[\s\S]*?"생성요청"[\s\S]*?\}/gm, '')
    .trim();

const CARD_HEADER_RE = /^\[Card\s*(\d+)\]/i;

export const isInstagramCardContent = (content: string): boolean =>
  /\[Card\s*\d+\]/i.test(content);

export const isCardHeaderLine = (line: string): boolean =>
  CARD_HEADER_RE.test(line.trim());

export const getCardNumberFromLine = (line: string): number | null => {
  const match = line.trim().match(CARD_HEADER_RE);
  return match ? parseInt(match[1], 10) : null;
};

/** 📸 이미지 프롬프트: / 전각 콜론 / 앞뒤 공백 변형 */
export const parseImagePromptFromLine = (line: string): string | null => {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const labeled = trimmed.match(/^(?:📸\s*)?이미지\s*프롬프트\s*[:：]\s*(.*)$/i);
  if (labeled) {
    const text = labeled[1].replace(/\(표지용\)/g, '').trim();
    return text || null;
  }

  if (trimmed.startsWith('📸 이미지 프롬프트:')) {
    const text = trimmed.replace('📸 이미지 프롬프트:', '').replace('(표지용)', '').trim();
    return text || null;
  }

  return null;
};

export const isImagePromptLine = (line: string): boolean =>
  parseImagePromptFromLine(line) !== null;

const parseSubtitleFromLine = (line: string): string | null => {
  const trimmed = line.trim();
  const match = trimmed.match(/^💡\s*소제목\s*[:：]\s*(.+)$/i);
  return match ? match[1].trim() : null;
};

const parseSourceFromLine = (line: string): string | null => {
  const trimmed = line.trim();
  const match = trimmed.match(/^🔎\s*출처\s*[:：]\s*(.+)$/i);
  return match ? match[1].trim() : null;
};

const isSkippableMetadataLine = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed) return true;
  return (
    /^제목(\(.*\))?\s*[:：]/.test(trimmed) ||
    trimmed.startsWith('✍️') ||
    trimmed.startsWith('후속 제안:') ||
    trimmed.startsWith('🔑') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('핵심 메시지') ||
    trimmed.startsWith('카드 수') ||
    /카드 수:|카드별 콘텐츠/.test(trimmed)
  );
};

/** 표지·카드 번호 기준 slotId — UI·일괄 생성·스프레드시트 공통 */
export const getInstagramImageSlotId = (
  seenAnyCard: boolean,
  currentCardNumber: number
): string => {
  if (!seenAnyCard || currentCardNumber <= 0) return 'cover';
  return `insta-card-${currentCardNumber}`;
};

/**
 * 인스타 카드 본문에서 표지·카드별 이미지 프롬프트를 문서 순서대로 추출.
 * slotId = cover | insta-card-N (카드 번호와 1:1 매칭)
 */
export const extractInstagramCardImageSlots = (content: string): ImagePromptSlot[] => {
  const slots: ImagePromptSlot[] = [];
  let seenAnyCard = false;
  let currentCardNumber = 0;

  for (const line of content.split('\n')) {
    const cardNumber = getCardNumberFromLine(line);
    if (cardNumber !== null) {
      seenAnyCard = true;
      currentCardNumber = cardNumber;
      continue;
    }

    const prompt = parseImagePromptFromLine(line);
    if (!prompt) continue;

    const slotId = getInstagramImageSlotId(seenAnyCard, currentCardNumber);
    const cardNumberForSlot = slotId === 'cover' ? 0 : currentCardNumber;
    const existingIdx = slots.findIndex((slot) => slot.slotId === slotId);

    const nextSlot: ImagePromptSlot = {
      slotId,
      prompt,
      cardNumber: cardNumberForSlot,
    };

    if (existingIdx >= 0) {
      slots[existingIdx] = nextSlot;
    } else {
      slots.push(nextSlot);
    }
  }

  return slots;
};

/**
 * 스프레드시트용 카드 섹션 파싱.
 * 이미지 프롬프트·메타 라인은 본문에서 제외.
 */
export const parseInstagramCardSections = (content: string): ParsedInstagramCards => {
  const lines = cleanGeneratedContent(content).split('\n');
  let coverPrompt = '';
  const cards: InstagramCardData[] = [];
  let currentCard: InstagramCardData | null = null;
  let bodyLines: string[] = [];
  let isBeforeCards = true;

  const pushCard = () => {
    if (!currentCard) return;
    currentCard.body = bodyLines.join('\n').trim();
    cards.push(currentCard);
    currentCard = null;
    bodyLines = [];
  };

  for (const line of lines) {
    const cardNumber = getCardNumberFromLine(line);
    if (cardNumber !== null) {
      pushCard();
      isBeforeCards = false;
      currentCard = {
        number: cardNumber,
        subtitle: '',
        body: '',
        prompt: '',
        source: '',
      };
      continue;
    }

    if (isImagePromptLine(line)) {
      const prompt = parseImagePromptFromLine(line)!;
      if (isBeforeCards && !currentCard) {
        coverPrompt = prompt;
      } else if (currentCard) {
        currentCard.prompt = prompt;
      }
      continue;
    }

    const subtitle = parseSubtitleFromLine(line);
    if (subtitle !== null) {
      if (currentCard) currentCard.subtitle = subtitle;
      continue;
    }

    const source = parseSourceFromLine(line);
    if (source !== null) {
      if (currentCard) {
        currentCard.source = source === '자체 정보' ? '' : source;
      }
      continue;
    }

    if (isSkippableMetadataLine(line)) continue;

    if (currentCard) {
      bodyLines.push(line.trim());
    }
  }

  pushCard();
  cards.sort((a, b) => a.number - b.number);

  return { coverPrompt, cards };
};

/** 카드 번호로 슬롯 조회 */
export const findSlotByCardNumber = (
  slots: ImagePromptSlot[],
  cardNumber: number
): ImagePromptSlot | undefined => {
  if (cardNumber <= 0) return slots.find((slot) => slot.slotId === 'cover');
  return slots.find((slot) => slot.slotId === `insta-card-${cardNumber}`);
};

/** 프롬프트 문자열로 슬롯 조회 (동일 프롬프트가 여러 장이면 첫 슬롯만) */
export const findSlotByPrompt = (
  slots: ImagePromptSlot[],
  prompt: string
): ImagePromptSlot | undefined => {
  if (!prompt.trim()) return undefined;
  return slots.find((slot) => slot.prompt === prompt);
};
