import React, { useState, useEffect, useCallback } from 'react';
import type { UserInput } from '../types';

type BannerContentType = NonNullable<UserInput['bannerContentType']>;
import {
  AI_PROMPT_BACKGROUND_OPTIONS,
  AI_PROMPT_GENDER_OPTIONS,
  AI_PROMPT_NATIONALITY_OPTIONS,
  AI_PROMPT_TYPES,
  ASPECT_RATIOS,
  BLOG_CATEGORIES,
  BLOG_CATEGORY_KEYWORDS,
  BLOG_LENGTHS,
  CATEGORIES,
  CATEGORY_KEYWORDS,
  FORMAT_LABELS,
  FORMATS,
  TEESHOT_MEMBER_CAMERA_DISTANCE_OPTIONS,
  TEESHOT_MEMBER_POSE_OPTIONS,
  TEESHOT_MEMBER_VIEW_OPTIONS,
  TEESHOT_DEFAULT_CAMERA_DISTANCE,
  TONES,
  VIDEO_LENGTHS,
} from '../constants';
import { SparklesIcon, QuestionMarkCircleIcon, RefreshIcon, InstagramIcon, BlogIcon, YouTubeShortsIcon, BannerIcon } from './icons';

interface InputFormProps {
  onGenerate: (userInput: UserInput) => void;
  isLoading: boolean;
  suggestedKeyword: string;
  /** 어디로칠까 → 인스타 카드: 참고 텍스트로 채우기 */
  instaCardPrefill?: string | null;
  onConsumeInstaCardPrefill?: () => void;
}

const formatIcons: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  'INSTAGRAM-CARD': InstagramIcon,
  'NAVER-BLOG/BAND': BlogIcon,
  'YOUTUBE-SHORTFORM': YouTubeShortsIcon,
  'ETC-BANNER': BannerIcon,
  'AI-PROMPT': SparklesIcon,
};

const FORMAT_OPTION_STYLES: Record<
  string,
  { selected: string; unselected: string; iconUnselected: string }
> = {
  'INSTAGRAM-CARD': {
    selected: 'border-transparent bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white shadow-lg',
    unselected:
      'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-700',
    iconUnselected: 'text-[#E4405F]',
  },
  'NAVER-BLOG/BAND': {
    selected: 'border-transparent bg-[#03C75A] text-white shadow-lg',
    unselected:
      'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-700',
    iconUnselected: 'text-[#03C75A]',
  },
  'YOUTUBE-SHORTFORM': {
    selected: 'border-transparent bg-[#FF0000] text-white shadow-lg',
    unselected:
      'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-700',
    iconUnselected: 'text-[#FF0000]',
  },
  'ETC-BANNER': {
    selected: 'border-transparent bg-[#F97000] text-white shadow-lg',
    unselected:
      'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-700',
    iconUnselected: 'text-[#F97000]',
  },
  'AI-PROMPT': {
    selected: 'border-transparent bg-blue-600 text-white shadow-lg dark:bg-blue-500',
    unselected:
      'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-700',
    iconUnselected: 'text-blue-600 dark:text-blue-400',
  },
};


const BANNER_CONTENT_TYPE_OPTIONS: { value: BannerContentType; label: string }[] = [
  { value: '일반', label: '일반' },
  { value: '인포그래픽', label: '인포그래픽' },
  { value: '기타 이벤트 배너', label: '기타 이벤트 배너' },
  { value: '랭킹오브더월드', label: '랭킹오브더월드' },
  { value: '어디로칠까', label: '어디로칠까' },
  { value: '골프용어사전', label: '골프용어사전' },
];

const AI_PROMPT_CUSTOM_VALUE = '__custom__';
const AI_PROMPT_RANDOM_VALUE = '__random__';
const AI_PROMPT_RANDOM_LABEL = '랜덤';

const AI_PROMPT_AGE_OPTIONS = Array.from({ length: 41 }, (_, index) => {
  const age = String(index + 20);
  return { label: `${age}세`, value: age };
});

const randomAiPromptAge = (): string =>
  String(Math.floor(Math.random() * (60 - 20 + 1)) + 20);

const pickAiPromptSelectValue = (options: ReadonlyArray<{ value: string }>) => {
  const pool = options.filter(
    (o) => o.value !== AI_PROMPT_CUSTOM_VALUE && o.value !== AI_PROMPT_RANDOM_VALUE
  );
  return pool[Math.floor(Math.random() * pool.length)]!.value;
};

const pickRandomAspectRatio = () =>
  ASPECT_RATIOS[Math.floor(Math.random() * ASPECT_RATIOS.length)]!.value;

const pickRandomAiPromptType = (): UserInput['aiPromptType'] =>
  AI_PROMPT_TYPES[Math.floor(Math.random() * AI_PROMPT_TYPES.length)]!;

const pickRandomTeeshotOption = (options: ReadonlyArray<{ value: string }>) =>
  options[Math.floor(Math.random() * options.length)]!.value;

type AiProfileFormSnapshot = {
  aspectRatio: string;
  aiPromptType: string;
  aiPromptNationality: string;
  aiPromptGender: string;
  aiPromptAge: string;
  aiPromptAgeCustom: string;
  aiPromptBackground: string;
  aiPromptNationalityCustom: string;
  aiPromptGenderCustom: string;
  aiPromptBackgroundCustom: string;
  aiPromptRemoveAiEffect: boolean;
  aiPromptTeeshotPose: string;
  aiPromptTeeshotViewAngle: string;
  aiPromptTeeshotCameraDistance: string;
};

type ResolvedAiProfileForm = {
  aspectRatio: string;
  aiPromptType: UserInput['aiPromptType'];
  aiPromptNationality: string;
  aiPromptGender: string;
  aiPromptAge: string;
  aiPromptBackground: string;
  aiPromptRemoveAiEffect: boolean;
  aiPromptTeeshotPose?: string;
  aiPromptTeeshotViewAngle?: string;
  aiPromptTeeshotCameraDistance?: string;
};

const isAiPromptRandomValue = (value: string) => value === AI_PROMPT_RANDOM_VALUE;

const resolveAiPromptSelectField = (
  value: string,
  customValue: string,
  options: ReadonlyArray<{ value: string }>
): string => {
  if (isAiPromptRandomValue(value)) return pickAiPromptSelectValue(options);
  if (value === AI_PROMPT_CUSTOM_VALUE) return customValue.trim();
  return value;
};

const resolveAiProfileForm = (form: AiProfileFormSnapshot): ResolvedAiProfileForm => {
  const aiPromptType = isAiPromptRandomValue(form.aiPromptType ?? '')
    ? pickRandomAiPromptType()
    : form.aiPromptType!;
  const virtualProfile = aiPromptType === '가상 프로필 생성하기';

  const aiPromptAge = isAiPromptRandomValue(form.aiPromptAge)
    ? randomAiPromptAge()
    : form.aiPromptAge === AI_PROMPT_CUSTOM_VALUE
      ? form.aiPromptAgeCustom.trim() || randomAiPromptAge()
      : form.aiPromptAge.trim();

  const aiPromptRemoveAiEffect = form.aiPromptRemoveAiEffect;

  return {
    aspectRatio: isAiPromptRandomValue(form.aspectRatio) ? pickRandomAspectRatio() : form.aspectRatio,
    aiPromptType,
    aiPromptNationality: resolveAiPromptSelectField(
      form.aiPromptNationality,
      form.aiPromptNationalityCustom,
      AI_PROMPT_NATIONALITY_OPTIONS
    ),
    aiPromptGender: resolveAiPromptSelectField(
      form.aiPromptGender,
      form.aiPromptGenderCustom,
      AI_PROMPT_GENDER_OPTIONS
    ),
    aiPromptAge,
    aiPromptBackground: resolveAiPromptSelectField(
      form.aiPromptBackground,
      form.aiPromptBackgroundCustom,
      AI_PROMPT_BACKGROUND_OPTIONS
    ),
    aiPromptRemoveAiEffect,
    aiPromptTeeshotPose: virtualProfile
      ? isAiPromptRandomValue(form.aiPromptTeeshotPose)
        ? pickRandomTeeshotOption(TEESHOT_MEMBER_POSE_OPTIONS)
        : form.aiPromptTeeshotPose
      : undefined,
    aiPromptTeeshotViewAngle: virtualProfile
      ? isAiPromptRandomValue(form.aiPromptTeeshotViewAngle)
        ? pickRandomTeeshotOption(TEESHOT_MEMBER_VIEW_OPTIONS)
        : form.aiPromptTeeshotViewAngle
      : undefined,
    aiPromptTeeshotCameraDistance: virtualProfile
      ? isAiPromptRandomValue(form.aiPromptTeeshotCameraDistance)
        ? pickRandomTeeshotOption(TEESHOT_MEMBER_CAMERA_DISTANCE_OPTIONS)
        : form.aiPromptTeeshotCameraDistance
      : undefined,
  };
};

const buildAiProfileFormSnapshot = (form: {
  aspectRatio: string;
  aiPromptType: string;
  aiPromptNationality: string;
  aiPromptGender: string;
  aiPromptAge: string;
  aiPromptAgeCustom: string;
  aiPromptBackground: string;
  aiPromptNationalityCustom: string;
  aiPromptGenderCustom: string;
  aiPromptBackgroundCustom: string;
  aiPromptRemoveAiEffect: boolean;
  aiPromptTeeshotPose: string;
  aiPromptTeeshotViewAngle: string;
  aiPromptTeeshotCameraDistance: string;
}): AiProfileFormSnapshot => ({ ...form });

export const InputForm: React.FC<InputFormProps> = ({
  onGenerate,
  isLoading,
  suggestedKeyword,
  instaCardPrefill,
  onConsumeInstaCardPrefill,
}) => {
  const [isGolfRelated, setIsGolfRelated] = useState(true);
  const [format, setFormat] = useState(FORMATS[0]);
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [blogCategory, setBlogCategory] = useState(BLOG_CATEGORIES[0].name);
  const [customCategory, setCustomCategory] = useState('');

  const getRandomKeywordForCategory = useCallback((cat: string, isBlogFormat: boolean = false): string => {
    const keywordSource = isBlogFormat ? BLOG_CATEGORY_KEYWORDS : CATEGORY_KEYWORDS;
    const defaultCategory = isBlogFormat ? BLOG_CATEGORIES[0].name : CATEGORIES[0].name;
    
    const keywords = keywordSource[cat] && keywordSource[cat].length > 0 
      ? keywordSource[cat]
      : keywordSource[defaultCategory];
    
    if (!keywords || keywords.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * keywords.length);
    return keywords[randomIndex];
  }, []);

  const [keyword, setKeyword] = useState(() => getRandomKeywordForCategory(CATEGORIES[0].name, false));
  const [isKeywordManuallySet, setIsKeywordManuallySet] = useState(false); // 사용자가 직접 입력했는지 추적
  const [userText, setUserText] = useState('');
  const [cardCount, setCardCount] = useState(6);
  const [blogLength, setBlogLength] = useState(1000);
  const [sectionCount, setSectionCount] = useState(5);
  const [videoLength, setVideoLength] = useState(15);
  const [sceneCount, setSceneCount] = useState(6);
  const [cutCount, setCutCount] = useState(1);
  const [cutTexts, setCutTexts] = useState<string[]>(['']);
  const [tone, setTone] = useState(TONES[0]);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0].value);
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [bodyCopy, setBodyCopy] = useState('');
  const [cta, setCta] = useState('');
  const [bannerContentType, setBannerContentType] = useState<BannerContentType>('일반');
  const [bannerGolfCourseName, setBannerGolfCourseName] = useState('');
  const [golfDictionaryLevel, setGolfDictionaryLevel] = useState<'입문자' | '중급자' | '고급자'>('입문자');
  /** false(기본): 입력한 문구 필드만 출력 / true: 비어 있는 필드는 AI가 채움 */
  const [bannerAutoFillEmptyFields, setBannerAutoFillEmptyFields] = useState(false);
  /** 배너 전 유형 공통: 이미지 생성·본문 기획에 넣을 사용자 프롬프트 */
  const [bannerAiImagePromptHint, setBannerAiImagePromptHint] = useState('');
  /** 배너 배경(Nano Banana) 참고용 예시 이미지 — 디자인만 참고, 텍스트는 UI에서 합성 */
  const [bannerDesignReferenceFile, setBannerDesignReferenceFile] = useState<File | null>(null);
  const [bannerDesignReferenceObjectUrl, setBannerDesignReferenceObjectUrl] = useState<string | null>(null);
  const [aiPromptType, setAiPromptType] = useState<string>(AI_PROMPT_TYPES[0]);
  const [aiPromptNationality, setAiPromptNationality] = useState(AI_PROMPT_NATIONALITY_OPTIONS[0].value);
  const [aiPromptGender, setAiPromptGender] = useState(AI_PROMPT_GENDER_OPTIONS[0].value);
  const [aiPromptAge, setAiPromptAge] = useState('34');
  const [aiPromptAgeCustom, setAiPromptAgeCustom] = useState('');
  const [aiPromptBackground, setAiPromptBackground] = useState(AI_PROMPT_BACKGROUND_OPTIONS[0].value);
  const [aiPromptNationalityCustom, setAiPromptNationalityCustom] = useState('');
  const [aiPromptGenderCustom, setAiPromptGenderCustom] = useState('');
  const [aiPromptBackgroundCustom, setAiPromptBackgroundCustom] = useState('');
  const [aiPromptRemoveAiEffect, setAiPromptRemoveAiEffect] = useState(false);
  const [aiPromptCustomInput, setAiPromptCustomInput] = useState('');
  const [aiPromptCustomReferenceFile, setAiPromptCustomReferenceFile] = useState<File | null>(null);
  const [aiPromptCustomReferenceObjectUrl, setAiPromptCustomReferenceObjectUrl] = useState<string | null>(null);
  const [aiPromptTeeshotPose, setAiPromptTeeshotPose] = useState(TEESHOT_MEMBER_POSE_OPTIONS[0].value);
  const [aiPromptTeeshotViewAngle, setAiPromptTeeshotViewAngle] = useState(TEESHOT_MEMBER_VIEW_OPTIONS[0].value);
  const [aiPromptTeeshotCameraDistance, setAiPromptTeeshotCameraDistance] = useState(
    TEESHOT_DEFAULT_CAMERA_DISTANCE
  );

  const getAiProfileFormSnapshot = (): AiProfileFormSnapshot =>
    buildAiProfileFormSnapshot({
      aspectRatio,
      aiPromptType,
      aiPromptNationality,
      aiPromptGender,
      aiPromptAge,
      aiPromptAgeCustom,
      aiPromptBackground,
      aiPromptNationalityCustom,
      aiPromptGenderCustom,
      aiPromptBackgroundCustom,
      aiPromptRemoveAiEffect,
      aiPromptTeeshotPose,
      aiPromptTeeshotViewAngle,
      aiPromptTeeshotCameraDistance,
    });

  const buildAiProfileUserInput = (resolved: ResolvedAiProfileForm): UserInput => ({
    isGolfRelated: true,
    category: 'AI 프로필',
    format: 'AI-PROMPT',
    keyword: '',
    userText: '',
    cardCount: 6,
    blogLength: 1000,
    sectionCount: 5,
    videoLength: 30,
    sceneCount: 6,
    tone: '',
    aspectRatio: resolved.aspectRatio,
    aiPromptType: resolved.aiPromptType,
    aiPromptNationality: resolved.aiPromptNationality,
    aiPromptGender: resolved.aiPromptGender,
    aiPromptAge: resolved.aiPromptAge,
    aiPromptBackground: resolved.aiPromptBackground,
    aiPromptRemoveAiEffect: resolved.aiPromptRemoveAiEffect,
    aiPromptCustomInput: aiPromptCustomInput.trim() ? aiPromptCustomInput.trim() : undefined,
    aiPromptCustomReferenceImage: undefined,
    aiPromptTeeshotPose: resolved.aiPromptTeeshotPose,
    aiPromptTeeshotViewAngle: resolved.aiPromptTeeshotViewAngle,
    aiPromptTeeshotCameraDistance: resolved.aiPromptTeeshotCameraDistance,
  });
  useEffect(() => {
    return () => {
      if (bannerDesignReferenceObjectUrl) URL.revokeObjectURL(bannerDesignReferenceObjectUrl);
      if (aiPromptCustomReferenceObjectUrl) URL.revokeObjectURL(aiPromptCustomReferenceObjectUrl);
    };
  }, [bannerDesignReferenceObjectUrl, aiPromptCustomReferenceObjectUrl]);

  useEffect(() => {
    if (format !== 'AI-PROMPT') {
      setAiPromptCustomReferenceFile(null);
      setAiPromptCustomReferenceObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [format]);

  useEffect(() => {
    if (format !== 'ETC-BANNER') {
      setBannerDesignReferenceFile(null);
      setBannerDesignReferenceObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setBannerAiImagePromptHint('');
    }
  }, [format]);

  useEffect(() => {
    if (instaCardPrefill != null && instaCardPrefill !== '') {
      setFormat('INSTAGRAM-CARD');
      setUserText(instaCardPrefill);
      onConsumeInstaCardPrefill?.();
    }
  }, [instaCardPrefill, onConsumeInstaCardPrefill]);

  useEffect(() => {
    if (suggestedKeyword) {
      setKeyword(suggestedKeyword);
      setIsKeywordManuallySet(true); // 제안된 키워드도 사용자가 선택한 것으로 간주
      setUserText('');
    }
  }, [suggestedKeyword]);

  useEffect(() => {
    // 사용자가 직접 입력한 키워드는 자동으로 변경하지 않음
    if (isKeywordManuallySet) return;
    
    if (isGolfRelated && format !== 'ETC-BANNER') {
      const isBlogFormat = format === 'NAVER-BLOG/BAND';
      const currentCategory = isBlogFormat ? blogCategory : category;
      
      if (currentCategory === '직접 입력') {
        setKeyword('');
      } else {
        setKeyword(getRandomKeywordForCategory(currentCategory, isBlogFormat));
      }
    }
  }, [category, blogCategory, format, isGolfRelated, getRandomKeywordForCategory, isKeywordManuallySet]);
  
  // 포맷 변경 시 카테고리와 키워드 초기화 (사용자가 직접 입력한 경우 제외)
  useEffect(() => {
    // 사용자가 직접 입력한 키워드는 포맷 변경 시에도 유지
    if (isKeywordManuallySet) return;
    
    const isBlogFormat = format === 'NAVER-BLOG/BAND';
    const isBannerFormat = format === 'ETC-BANNER';
    if (isBlogFormat) {
      setBlogCategory(BLOG_CATEGORIES[0].name);
      setKeyword(getRandomKeywordForCategory(BLOG_CATEGORIES[0].name, true));
    } else if (!isBannerFormat) {
      setCategory(CATEGORIES[0].name);
      setKeyword(getRandomKeywordForCategory(CATEGORIES[0].name, false));
    }
  }, [format, getRandomKeywordForCategory, isKeywordManuallySet]);

  const isEventBannerForm = format === 'ETC-BANNER' && bannerContentType === '기타 이벤트 배너';

  const handleBannerDesignReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setBannerDesignReferenceFile(null);
      setBannerDesignReferenceObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    if (f.size > 7 * 1024 * 1024) {
      alert('참고 이미지는 7MB 이하만 업로드할 수 있습니다.');
      e.target.value = '';
      return;
    }
    if (!/^image\/(png|jpeg|jpg|webp)$/i.test(f.type)) {
      alert('PNG, JPEG, WebP 이미지만 지원합니다.');
      e.target.value = '';
      return;
    }
    setBannerDesignReferenceFile(f);
    setBannerDesignReferenceObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  };

  const clearBannerDesignReference = () => {
    setBannerDesignReferenceFile(null);
    setBannerDesignReferenceObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const handleAiPromptCustomReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setAiPromptCustomReferenceFile(null);
      setAiPromptCustomReferenceObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    if (f.size > 7 * 1024 * 1024) {
      alert('참고 이미지는 7MB 이하만 업로드할 수 있습니다.');
      e.target.value = '';
      return;
    }
    if (!/^image\/(png|jpeg|jpg|webp)$/i.test(f.type)) {
      alert('PNG, JPEG, WebP 이미지만 지원합니다.');
      e.target.value = '';
      return;
    }
    setAiPromptCustomReferenceFile(f);
    setAiPromptCustomReferenceObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  };

  const clearAiPromptCustomReference = () => {
    setAiPromptCustomReferenceFile(null);
    setAiPromptCustomReferenceObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const readAiPromptCustomReferenceImage = async (): Promise<UserInput['aiPromptCustomReferenceImage']> => {
    if (!aiPromptCustomReferenceFile) return undefined;
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(aiPromptCustomReferenceFile);
      });
      const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return undefined;
      let mimeType = m[1].trim();
      if (mimeType === 'image/jpg') mimeType = 'image/jpeg';
      return { mimeType, dataBase64: m[2] };
    } catch {
      alert('참고 이미지를 읽는 데 실패했습니다.');
      return undefined;
    }
  };

  const isVirtualProfileType =
    aiPromptType === '가상 프로필 생성하기' || aiPromptType === AI_PROMPT_RANDOM_VALUE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isBlogFormat = format === 'NAVER-BLOG/BAND';
    const isBannerFormat = format === 'ETC-BANNER';
    const isAiPromptFormat = format === 'AI-PROMPT';
    const currentCategory = isBlogFormat ? blogCategory : category;
    
    // 배너/포스터 — 일반·기타 이벤트 배너: 제목(헤드라인) 필수
    if (isBannerFormat && (bannerContentType === '일반' || bannerContentType === '기타 이벤트 배너') && !headline.trim()) {
      alert(bannerContentType === '기타 이벤트 배너' ? '제목을 입력해주세요.' : '헤드라인을 입력해주세요.');
      return;
    }
    if (isBannerFormat && (bannerContentType === '인포그래픽' || bannerContentType === '랭킹오브더월드') && !keyword.trim()) {
      alert('주제/키워드를 입력해주세요.');
      return;
    }
    if (isBannerFormat && bannerContentType === '어디로칠까' && !bannerGolfCourseName.trim()) {
      alert('골프장 이름을 입력해주세요.');
      return;
    }
    
    const isYouTubeFormat = format === 'YOUTUBE-SHORTFORM';

    let bannerDesignReferenceImage: UserInput['bannerDesignReferenceImage'];
    if (isBannerFormat && bannerDesignReferenceFile) {
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(bannerDesignReferenceFile);
        });
        const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (m) {
          let mimeType = m[1].trim();
          if (mimeType === 'image/jpg') mimeType = 'image/jpeg';
          bannerDesignReferenceImage = { mimeType, dataBase64: m[2] };
        }
      } catch {
        alert('참고 이미지를 읽는 데 실패했습니다.');
        return;
      }
    }

    let aiProfileResolved: ResolvedAiProfileForm | null = null;
    if (isAiPromptFormat) {
      aiProfileResolved = resolveAiProfileForm(getAiProfileFormSnapshot());
    }

    let aiPromptCustomReferenceImage: UserInput['aiPromptCustomReferenceImage'];
    if (isAiPromptFormat && aiPromptCustomReferenceFile) {
      aiPromptCustomReferenceImage = await readAiPromptCustomReferenceImage();
      if (aiPromptCustomReferenceFile && !aiPromptCustomReferenceImage) {
        return;
      }
    }

    const userInput: UserInput = {
      isGolfRelated,
      category:
        format === 'INSTAGRAM-CARD'
          ? '데일리 뉴스'
          : isAiPromptFormat
            ? 'AI 프로필'
            : (currentCategory === '직접 입력' ? customCategory : currentCategory),
      format,
      keyword:
        isAiPromptFormat
          ? ''
          : isBannerFormat && (bannerContentType === '인포그래픽' || bannerContentType === '랭킹오브더월드')
          ? keyword
          : isBannerFormat
            ? ''
            : keyword,
      userText: isBannerFormat || isAiPromptFormat ? '' : userText,
      cardCount,
      blogLength,
      sectionCount,
      videoLength,
      sceneCount,
      tone: isBannerFormat || isYouTubeFormat || isAiPromptFormat ? '' : tone,
      aspectRatio: isBannerFormat || isAiPromptFormat ? (aiProfileResolved?.aspectRatio ?? aspectRatio) : undefined,
      headline: isBannerFormat && (bannerContentType === '일반' || bannerContentType === '기타 이벤트 배너') ? headline : undefined,
      subheadline: isBannerFormat && (bannerContentType === '일반' || bannerContentType === '기타 이벤트 배너') ? subheadline : undefined,
      bodyCopy: isBannerFormat && (bannerContentType === '일반' || bannerContentType === '기타 이벤트 배너') ? bodyCopy : undefined,
      cta: isBannerFormat && (bannerContentType === '일반' || bannerContentType === '기타 이벤트 배너') ? cta : undefined,
      bannerContentType: isBannerFormat ? bannerContentType : undefined,
      bannerGolfCourseName: isBannerFormat && bannerContentType === '어디로칠까' ? bannerGolfCourseName.trim() : undefined,
      golfDictionaryLevel: isBannerFormat && bannerContentType === '골프용어사전' ? golfDictionaryLevel : undefined,
      bannerAutoFillEmptyFields: isBannerFormat ? bannerAutoFillEmptyFields : undefined,
      bannerDesignReferenceImage: isBannerFormat ? bannerDesignReferenceImage : undefined,
      bannerAiImagePromptHint:
        isBannerFormat && bannerAiImagePromptHint.trim() ? bannerAiImagePromptHint.trim() : undefined,
      cutCount: isYouTubeFormat ? cutCount : undefined,
      cutTexts: isYouTubeFormat ? cutTexts : undefined,
      aiPromptType: isAiPromptFormat ? aiProfileResolved!.aiPromptType : undefined,
      aiPromptNationality: isAiPromptFormat ? aiProfileResolved!.aiPromptNationality : undefined,
      aiPromptGender: isAiPromptFormat ? aiProfileResolved!.aiPromptGender : undefined,
      aiPromptAge: isAiPromptFormat ? aiProfileResolved!.aiPromptAge : undefined,
      aiPromptBackground: isAiPromptFormat ? aiProfileResolved!.aiPromptBackground : undefined,
      aiPromptRemoveAiEffect: isAiPromptFormat ? aiProfileResolved!.aiPromptRemoveAiEffect : undefined,
      aiPromptCustomInput: isAiPromptFormat && aiPromptCustomInput.trim() ? aiPromptCustomInput.trim() : undefined,
      aiPromptCustomReferenceImage: isAiPromptFormat ? aiPromptCustomReferenceImage : undefined,
      aiPromptTeeshotPose: isAiPromptFormat ? aiProfileResolved!.aiPromptTeeshotPose : undefined,
      aiPromptTeeshotViewAngle: isAiPromptFormat ? aiProfileResolved!.aiPromptTeeshotViewAngle : undefined,
      aiPromptTeeshotCameraDistance: isAiPromptFormat ? aiProfileResolved!.aiPromptTeeshotCameraDistance : undefined,
    };
    onGenerate(userInput);
  };
  
  const handleRefreshKeyword = () => {
    const isBlogFormat = format === 'NAVER-BLOG/BAND';
    const currentCategory = isBlogFormat ? blogCategory : category;
    
    if (currentCategory !== '직접 입력') {
        setKeyword(getRandomKeywordForCategory(currentCategory, isBlogFormat));
        setIsKeywordManuallySet(false); // 새로고침 버튼으로 생성된 키워드는 자동 생성으로 간주
    }
  };

  const handleQuickGenerate = () => {
    const isBlogFormat = format === 'NAVER-BLOG/BAND';
    
    // 카테고리 무작위 선택 (직접 입력 제외)
    const availableCategories = isBlogFormat 
      ? BLOG_CATEGORIES.filter(c => c.name !== '직접 입력')
      : CATEGORIES.filter(c => c.name !== '직접 입력');
    const randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    
    // 키워드 무작위 선택
    const randomKeyword = getRandomKeywordForCategory(randomCategory.name, isBlogFormat);
    setIsKeywordManuallySet(false); // 빠른 생성으로 생성된 키워드는 자동 생성으로 간주
    
    // 카드 수 무작위 선택 (3-10)
    const randomCardCount = Math.floor(Math.random() * 8) + 3;
    
    // 블로그 길이 무작위 선택 (500, 1000, 1500, 2000, 2500, 3000, 3500, 4000)
    const blogLengths = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];
    const randomBlogLength = blogLengths[Math.floor(Math.random() * blogLengths.length)];
    
    // 섹션 수 무작위 선택 (1-10)
    const randomSectionCount = Math.floor(Math.random() * 10) + 1;
    
    // 톤앤매너 무작위 선택
    const randomTone = TONES[Math.floor(Math.random() * TONES.length)];
    
    const userInput: UserInput = {
      isGolfRelated: true,
      category: randomCategory.name,
      format,
      keyword: randomKeyword,
      userText: '',
      cardCount: randomCardCount,
      blogLength: randomBlogLength,
      sectionCount: randomSectionCount,
      videoLength: 30,
      sceneCount: 6,
      tone: randomTone,
    };
    
    onGenerate(userInput);
  };

  const handleQuickAiPromptGenerate = async () => {
    const resolved = resolveAiProfileForm(getAiProfileFormSnapshot());
    const aiPromptCustomReferenceImage = await readAiPromptCustomReferenceImage();
    if (aiPromptCustomReferenceFile && !aiPromptCustomReferenceImage) return;
    onGenerate({
      ...buildAiProfileUserInput(resolved),
      aiPromptCustomReferenceImage,
    });
  };

  const commonInputClass = "w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006B68] focus:border-[#006B68] transition-colors placeholder:text-gray-400 dark:bg-black dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-[#006B68]/70 dark:focus:border-[#006B68]";
  const selectInputClass =
    "w-full appearance-none bg-gray-100 bg-[length:1.125rem_1.125rem] bg-[position:right_0.75rem_center] bg-no-repeat bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] border border-gray-300 rounded-md py-2 pl-3 pr-11 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006B68] focus:border-[#006B68] transition-colors cursor-pointer dark:bg-black dark:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%239ca3af%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] dark:border-gray-600 dark:text-gray-100 dark:focus:ring-[#006B68]/70 dark:focus:border-[#006B68]";
  const commonLabelClass = "block text-sm font-medium text-gray-600 dark:text-gray-300";

  const renderAiPromptSelect = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: ReadonlyArray<{ label: string; value: string }>,
    customValue: string,
    onCustomChange: (value: string) => void,
    customPlaceholder?: string
  ) => (
    <div>
      <label htmlFor={id} className={`${commonLabelClass} mb-1`}>
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectInputClass}>
        <option value={AI_PROMPT_RANDOM_VALUE}>{AI_PROMPT_RANDOM_LABEL}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        <option value={AI_PROMPT_CUSTOM_VALUE}>직접 입력</option>
      </select>
      {value === AI_PROMPT_CUSTOM_VALUE && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          className={`${commonInputClass} mt-2`}
          placeholder={customPlaceholder || `${label}을(를) 직접 입력하세요`}
        />
      )}
    </div>
  );

  const renderAiPromptOptionSelect = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: ReadonlyArray<{ label: string; value: string }>
  ) => (
    <div>
      <label htmlFor={id} className={`${commonLabelClass} mb-1`}>
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectInputClass}>
        <option value={AI_PROMPT_RANDOM_VALUE}>{AI_PROMPT_RANDOM_LABEL}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const renderTeeshotCameraDistanceField = () =>
    renderAiPromptOptionSelect(
      'aiPromptTeeshotCameraDistance',
      '카메라 거리',
      aiPromptTeeshotCameraDistance,
      setAiPromptTeeshotCameraDistance,
      TEESHOT_MEMBER_CAMERA_DISTANCE_OPTIONS
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">컨텐츠 생성 옵션</h2>
      
      <div>
        <label className={`${commonLabelClass} mb-2 flex items-center justify-between cursor-pointer`}>
            <span>골프 관련 컨텐츠</span>
            <div
              role="switch"
              aria-checked={isGolfRelated}
              onClick={() => setIsGolfRelated(!isGolfRelated)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                isGolfRelated ? 'bg-[#006B68]' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  isGolfRelated ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
          </label>
      </div>

      <div>
        <label className={`${commonLabelClass} mb-2`}>포맷</label>
        <div className="grid grid-cols-5 gap-2">
          {FORMATS.map(f => {
            const Icon = formatIcons[f];
            const styles = FORMAT_OPTION_STYLES[f];
            const isSelected = format === f;
            const colorClass = isSelected ? styles.selected : styles.unselected;

            return (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg p-2 text-center text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-900 ${colorClass} ${
                  isSelected
                    ? 'scale-105 ring-2 ring-white ring-offset-2 dark:ring-gray-300 dark:ring-offset-gray-900'
                    : 'scale-100'
                }`}
              >
                {Icon && (
                  <Icon
                    className={`h-6 w-6 flex-shrink-0 ${isSelected ? 'text-white' : styles.iconUnselected}`}
                  />
                )}
                <span className="text-xs font-semibold leading-tight">{FORMAT_LABELS[f]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {format === 'AI-PROMPT' && (
        <div className="space-y-5 rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-black">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            각 드롭다운에서 <span className="font-medium text-[#006B68]">랜덤</span>을 선택하면 생성 시 해당 항목만 무작위로 정해집니다.
          </p>
          <div>
            <label htmlFor="aiPromptAspectRatio" className={`${commonLabelClass} mb-1`}>
              이미지 비율
            </label>
            <span className="mb-2 block text-xs text-gray-500">
              통합 프롬프트와 세부 항목에 반영됩니다. 나노바나나 등 외부 이미지 툴에 붙여 넣을 때 종횡비를 맞출 때 참고하세요.
            </span>
            <select
              id="aiPromptAspectRatio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className={selectInputClass}
            >
              <option value={AI_PROMPT_RANDOM_VALUE}>{AI_PROMPT_RANDOM_LABEL}</option>
              {ASPECT_RATIOS.map((ratio) => (
                <option key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="aiPromptType" className={`${commonLabelClass} mb-1`}>
              AI 유형
            </label>
            <select
              id="aiPromptType"
              value={aiPromptType}
              onChange={(e) => setAiPromptType(e.target.value)}
              className={selectInputClass}
            >
              <option value={AI_PROMPT_RANDOM_VALUE}>{AI_PROMPT_RANDOM_LABEL}</option>
              {AI_PROMPT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {aiPromptType && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderAiPromptSelect('aiPromptNationality', '국적', aiPromptNationality, setAiPromptNationality, AI_PROMPT_NATIONALITY_OPTIONS, aiPromptNationalityCustom, setAiPromptNationalityCustom, '예: Korean-American, Brazilian')}
                {renderAiPromptSelect('aiPromptGender', '성별', aiPromptGender, setAiPromptGender, AI_PROMPT_GENDER_OPTIONS, aiPromptGenderCustom, setAiPromptGenderCustom, '예: androgynous subject')}
                <div>
                  <label htmlFor="aiPromptAge" className={`${commonLabelClass} mb-1`}>
                    나이
                  </label>
                  <select
                    id="aiPromptAge"
                    value={aiPromptAge}
                    onChange={(e) => setAiPromptAge(e.target.value)}
                    className={selectInputClass}
                  >
                    <option value={AI_PROMPT_RANDOM_VALUE}>{AI_PROMPT_RANDOM_LABEL}</option>
                    {AI_PROMPT_AGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    <option value={AI_PROMPT_CUSTOM_VALUE}>직접 입력</option>
                  </select>
                  {aiPromptAge === AI_PROMPT_CUSTOM_VALUE && (
                    <input
                      type="text"
                      value={aiPromptAgeCustom}
                      onChange={(e) => setAiPromptAgeCustom(e.target.value)}
                      className={`${commonInputClass} mt-2`}
                      placeholder="예: 34, 39, 45"
                    />
                  )}
                </div>
                {renderAiPromptSelect(
                  'aiPromptBackground',
                  '배경',
                  aiPromptBackground,
                  setAiPromptBackground,
                  AI_PROMPT_BACKGROUND_OPTIONS,
                  aiPromptBackgroundCustom,
                  setAiPromptBackgroundCustom,
                  '예: golf course in Scotland, links-style coastal background'
                )}
                {isVirtualProfileType && (
                  <>
                    {renderAiPromptOptionSelect(
                      'aiPromptTeeshotPose',
                      '포즈 / 자세',
                      aiPromptTeeshotPose,
                      setAiPromptTeeshotPose,
                      TEESHOT_MEMBER_POSE_OPTIONS
                    )}
                    {renderAiPromptOptionSelect(
                      'aiPromptTeeshotViewAngle',
                      '촬영 방향',
                      aiPromptTeeshotViewAngle,
                      setAiPromptTeeshotViewAngle,
                      TEESHOT_MEMBER_VIEW_OPTIONS
                    )}
                    {renderTeeshotCameraDistanceField()}
                  </>
                )}
              </div>

              <div>
                <span className={`${commonLabelClass} mb-2 block`}>추가 옵션</span>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm cursor-pointer dark:border-gray-600 dark:bg-black">
                    <input
                      type="checkbox"
                      checked={aiPromptRemoveAiEffect}
                      onChange={(e) => setAiPromptRemoveAiEffect(e.target.checked)}
                      className="mt-0.5 accent-[#006B68]"
                    />
                    <span className="flex-1">
                      <span className="block font-medium text-gray-800 dark:text-gray-100">AI 효과 제거</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                        선택 시 비대칭·기울어진 구도·손떨림(필수), 전체적으로 약간 어둡고 노출을 잘못 잡은 어색한 밝기, 아마추어 스마트폰 스냅샷 톤, 미세한 안면 비대칭, 렌즈 왜곡·질감, 주름·잔머리·모공, AI 느낌을 줄이는 Positive/Negative 프롬프트가 자동 적용됩니다.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="aiPromptCustomInput" className={`${commonLabelClass} mb-1`}>
                  직접 입력란
                </label>
                <span className="mb-1 block text-xs text-gray-400 dark:text-gray-500">(선택)</span>
                <textarea
                  id="aiPromptCustomInput"
                  value={aiPromptCustomInput}
                  onChange={(e) => setAiPromptCustomInput(e.target.value)}
                  className={`${commonInputClass} h-28`}
                  placeholder="포즈, 의상, 배경, 조명, 카메라, 스타일 등 추가로 반영할 내용을 한글로 입력하세요."
                />
                <div className="mt-3">
                  <label htmlFor="aiPromptCustomReference" className={`${commonLabelClass} mb-1`}>
                    참고 이미지 <span className="text-gray-400 font-normal text-xs">(선택)</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    프로필 이미지 생성 시 포즈·의상·구도·조명·무드를 참고합니다. 가상 프로필의 얼굴·나이 등은 위 옵션과 통합 프롬프트를 우선합니다.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      id="aiPromptCustomReference"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleAiPromptCustomReferenceChange}
                      className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:rounded-md file:border-0 file:bg-gray-800 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-gray-900 dark:file:bg-gray-700 dark:hover:file:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {aiPromptCustomReferenceObjectUrl && (
                      <>
                        <img
                          src={aiPromptCustomReferenceObjectUrl}
                          alt="참고 이미지 미리보기"
                          className="h-16 w-auto max-w-[120px] rounded border border-gray-200 dark:border-gray-600 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            clearAiPromptCustomReference();
                            const el = document.getElementById('aiPromptCustomReference') as HTMLInputElement | null;
                            if (el) el.value = '';
                          }}
                          className="text-xs text-gray-600 underline dark:text-gray-400"
                        >
                          제거
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {format === 'ETC-BANNER' && (
        <>
          <div>
            <label htmlFor="bannerContentType" className={`${commonLabelClass} mb-1`}>컨텐츠 유형</label>
            <select
              id="bannerContentType"
              value={bannerContentType}
              onChange={(e) => setBannerContentType(e.target.value as BannerContentType)}
              className={selectInputClass}
            >
              {BANNER_CONTENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {bannerContentType === '인포그래픽' && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>인포그래픽 유형</strong>이 선택되었습니다. 주제/키워드를 입력하여 인포그래픽 컨텐츠를 생성하세요.
                </p>
              </div>
            )}
            {bannerContentType === '랭킹오브더월드' && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900">
                  골프와 연관된 <strong>랭킹 주제</strong>를 입력하면 Top 10과 인스타 포스팅 글을 생성합니다.
                </p>
              </div>
            )}
            {bannerContentType === '어디로칠까' && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-900">
                  국내 골프장 이름을 입력하면 정보 요약과 인스타 포스팅 글을 만듭니다. 생성 후 결과 화면에서{' '}
                  <strong>인스타 카드로 만들기</strong>로 참고 텍스트를 넘길 수 있습니다.
                </p>
              </div>
            )}
            {bannerContentType === '골프용어사전' && (
              <div className="mt-3 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                <p className="text-sm text-violet-900">난이도에 맞는 골프 용어 10개와 인스타 포스팅 글을 생성합니다.</p>
              </div>
            )}
            {isEventBannerForm && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-800">
                  <strong>기타 이벤트 배너</strong>: <span className="text-red-600 font-medium">제목</span>만 필수입니다. 아래{' '}
                  <strong>비어 있는 문구 항목을 AI가 자동으로 채우기</strong>에서 부제·본문·CTA 보완 여부를 선택하세요.{' '}
                  <strong>기본 비율</strong>, <strong>예시 디자인 참고 이미지</strong>, <strong>이미지 생성 참고 프롬프트</strong>는 이미지 생성에 반영됩니다.
                </p>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="aspectRatio" className={`${commonLabelClass} mb-1`}>기본 비율</label>
            <select id="aspectRatio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className={selectInputClass}>
              {ASPECT_RATIOS.map((ratio) => (
                <option key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bannerDesignReference" className={`${commonLabelClass} mb-1`}>
              예시 디자인 참고 이미지 <span className="text-gray-400 font-normal text-xs">(선택)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              이미지 생성 시 구도·색감·무드만 참고합니다. 기획 문구는 본문·🎨와 동일하게 쓰고, 참고 이미지 속 글자·로고는 복제하지 않도록 API에 지시합니다.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                id="bannerDesignReference"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleBannerDesignReferenceChange}
                className={`block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-800 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {bannerDesignReferenceObjectUrl && (
                <>
                  <img
                    src={bannerDesignReferenceObjectUrl}
                    alt="참고 이미지 미리보기"
                    className="h-16 w-auto max-w-[120px] rounded border border-gray-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      clearBannerDesignReference();
                      const el = document.getElementById('bannerDesignReference') as HTMLInputElement | null;
                      if (el) el.value = '';
                    }}
                    className="text-xs text-gray-600 underline"
                  >
                    제거
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
      
      {isGolfRelated && format !== 'NAVER-BLOG/BAND' && format !== 'ETC-BANNER' && format !== 'INSTAGRAM-CARD' && format !== 'YOUTUBE-SHORTFORM' && format !== 'AI-PROMPT' && (
        <div>
          <div className="flex items-center mb-1">
              <label htmlFor="category" className={commonLabelClass}>카테고리</label>
              <div className="group relative ml-1.5">
                  <QuestionMarkCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2 w-80 transform opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="bg-white text-gray-700 text-sm rounded-lg shadow-xl p-3 border border-gray-200">
                          <h4 className="font-bold text-gray-900 mb-2 text-base">카테고리 설명</h4>
                          <ul className="space-y-1.5 text-left">
                              {CATEGORIES.map(c => (
                                  <li key={c.name} className="flex">
                                      <strong className="text-[#006B68] font-semibold w-28 flex-shrink-0">{c.name}:</strong>
                                      <span className="text-gray-600">{c.description}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>
              </div>
          </div>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectInputClass}>
            {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
           {category === '직접 입력' && (
            <div className="mt-2">
              <label htmlFor="customCategory" className={`${commonLabelClass} mb-1 sr-only`}>사용자 정의 카테고리</label>
              <input
                type="text"
                id="customCategory"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className={commonInputClass}
                placeholder="카테고리명을 입력하세요"
                required
              />
            </div>
          )}
        </div>
      )}

      {format === 'YOUTUBE-SHORTFORM' && (
        <>
          <div>
            <label htmlFor="videoLength" className={`${commonLabelClass} mb-2`}>
              영상 길이
              <span className="ml-2 text-lg font-bold text-[#006B68]">{videoLength}초</span>
            </label>
            <input
              type="range"
              id="videoLength"
              min="5"
              max="15"
              step="5"
              value={videoLength}
              onChange={(e) => setVideoLength(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#006B68] hover:accent-[#005552] transition-colors"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5초</span>
              <span>10초</span>
              <span>15초</span>
            </div>
          </div>
          
          <div>
            <label htmlFor="cutCount" className={`${commonLabelClass} mb-2`}>
              영상 컷
              <span className="ml-2 text-lg font-bold text-[#006B68]">{cutCount}개</span>
            </label>
            <input
              type="range"
              id="cutCount"
              min="1"
              max="5"
              step="1"
              value={cutCount}
              onChange={(e) => {
                const newCutCount = parseInt(e.target.value);
                setCutCount(newCutCount);
                // 컷 수에 맞춰 cutTexts 배열 조정
                const newCutTexts = Array(newCutCount).fill('').map((_, index) => cutTexts[index] || '');
                setCutTexts(newCutTexts);
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#006B68] hover:accent-[#005552] transition-colors"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1개</span>
              <span>2개</span>
              <span>3개</span>
              <span>4개</span>
              <span>5개</span>
            </div>
          </div>
          
          {Array.from({ length: cutCount }).map((_, index) => (
            <div key={index}>
              <label htmlFor={`cutText-${index}`} className={`${commonLabelClass} mb-1`}>
                컷 {index + 1} 참고 텍스트 {index === 0 && <span className="text-gray-400 text-xs">(선택)</span>}
              </label>
              <textarea
                id={`cutText-${index}`}
                value={cutTexts[index] || ''}
                onChange={(e) => {
                  const newCutTexts = [...cutTexts];
                  newCutTexts[index] = e.target.value;
                  setCutTexts(newCutTexts);
                }}
                className={`${commonInputClass} h-24`}
                placeholder={`컷 ${index + 1}에 대한 참고 텍스트를 입력하세요`}
              />
            </div>
          ))}
        </>
      )}

      {format === 'INSTAGRAM-CARD' && (
        <div>
          <label htmlFor="cardCount" className={`${commonLabelClass} mb-2`}>
            카드 수
            <span className="ml-2 text-lg font-bold text-[#006B68]">{cardCount}장</span>
          </label>
          <input
            type="range"
            id="cardCount"
            min="3"
            max="10"
            step="1"
            value={cardCount}
            onChange={(e) => setCardCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#006B68] hover:accent-[#005552] transition-colors"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>3장</span>
            <span>4장</span>
            <span>5장</span>
            <span>6장</span>
            <span>7장</span>
            <span>8장</span>
            <span>9장</span>
            <span>10장</span>
          </div>
        </div>
      )}

      {format === 'NAVER-BLOG/BAND' && (
        <>
         <div>
          <label htmlFor="blogLength" className={`${commonLabelClass} mb-2`}>
            텍스트 분량
            <span className="ml-2 text-lg font-bold text-[#006B68]">{blogLength.toLocaleString()}자</span>
          </label>
          <input
            type="range"
            id="blogLength"
            min="500"
            max="4000"
            step="500"
            value={blogLength}
            onChange={(e) => setBlogLength(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#006B68] hover:accent-[#005552] transition-colors"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>500자</span>
            <span>1000자</span>
            <span>1500자</span>
            <span>2000자</span>
            <span>2500자</span>
            <span>3000자</span>
            <span>3500자</span>
            <span>4000자</span>
          </div>
        </div>
        
        <div>
          <label htmlFor="sectionCount" className={`${commonLabelClass} mb-2`}>
            본문 섹션 수
            <span className="ml-2 text-lg font-bold text-[#006B68]">{sectionCount}개</span>
          </label>
          <input
            type="range"
            id="sectionCount"
            min="1"
            max="10"
            step="1"
            value={sectionCount}
            onChange={(e) => setSectionCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#006B68] hover:accent-[#005552] transition-colors"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1개</span>
            <span>2개</span>
            <span>3개</span>
            <span>4개</span>
            <span>5개</span>
            <span>6개</span>
            <span>7개</span>
            <span>8개</span>
            <span>9개</span>
            <span>10개</span>
          </div>
        </div>
        </>
      )}

      {format === 'ETC-BANNER' && (
        <>
          {bannerContentType === '인포그래픽' && (
            <>
              <div>
                <label htmlFor="keyword" className={`${commonLabelClass} mb-1`}>주제 / 키워드</label>
                <input 
                    type="text" 
                    id="keyword" 
                    value={keyword} 
                    onChange={(e) => {
                      setKeyword(e.target.value);
                      setIsKeywordManuallySet(true);
                    }} 
                    className={`${commonInputClass} pr-10`}
                    placeholder="인포그래픽 주제나 키워드를 입력하세요" 
                />
              </div>
            </>
          )}
          {bannerContentType === '랭킹오브더월드' && (
            <>
              <div>
                <label htmlFor="keyword-ranking" className={`${commonLabelClass} mb-1`}>랭킹 주제 / 키워드</label>
                <input
                  type="text"
                  id="keyword-ranking"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setIsKeywordManuallySet(true);
                  }}
                  className={commonInputClass}
                  placeholder="예: 국내 파3 명문 코스, 스크린골프 인기 브랜드"
                />
              </div>
            </>
          )}
          {bannerContentType === '어디로칠까' && (
            <>
              <div>
                <label htmlFor="bannerGolfCourseName" className={`${commonLabelClass} mb-1`}>골프장 이름</label>
                <input
                  type="text"
                  id="bannerGolfCourseName"
                  value={bannerGolfCourseName}
                  onChange={(e) => setBannerGolfCourseName(e.target.value)}
                  className={commonInputClass}
                  placeholder="예: 제주 오라CC, 안양 컨트리클럽"
                />
              </div>
            </>
          )}
          {bannerContentType === '골프용어사전' && (
            <>
              <div>
                <label htmlFor="golfDictionaryLevel" className={`${commonLabelClass} mb-1`}>난이도</label>
                <select
                  id="golfDictionaryLevel"
                  value={golfDictionaryLevel}
                  onChange={(e) => setGolfDictionaryLevel(e.target.value as '입문자' | '중급자' | '고급자')}
                  className={selectInputClass}
                >
                  <option value="입문자">입문자</option>
                  <option value="중급자">중급자</option>
                  <option value="고급자">고급자</option>
                </select>
              </div>
            </>
          )}
          {(isEventBannerForm || bannerContentType === '일반') && (
          <>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="headline" className={commonLabelClass}>
                {isEventBannerForm ? '제목' : '헤드라인'} <span className="text-red-500">*</span>
              </label>
              {!isEventBannerForm && (
              <span className={`text-xs ${headline.length > 8 ? 'text-blue-600 font-medium' : headline.length > 0 ? 'text-[#F97000] font-medium' : 'text-gray-400'}`}>
                {headline.length}자 {headline.length > 8 ? '✓ 그대로 사용' : headline.length > 0 ? '→ 확장 가능' : ''}
              </span>
              )}
              {isEventBannerForm && headline.length > 0 && (
                <span className="text-xs text-blue-600 font-medium">입력 그대로 사용 (변형 금지)</span>
              )}
            </div>
            <input
              type="text"
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className={commonInputClass}
              placeholder={isEventBannerForm ? '이벤트 배너 제목을 입력하세요' : '배너/포스터의 메인 메시지를 입력하세요'}
              required
            />
            {isEventBannerForm && headline.length > 0 && (
              <p className="mt-1 text-xs text-blue-600">제목은 길이와 관계없이 원문 그대로 출력됩니다.</p>
            )}
            {!isEventBannerForm && headline.length > 0 && (
              <p className={`mt-1 text-xs ${headline.length > 8 ? 'text-blue-600' : 'text-[#F97000]'}`}>
                {headline.length > 8 
                  ? '✓ 입력하신 텍스트가 그대로 사용됩니다.' 
                  : '💡 8글자 이하이면 AI가 내용을 확장하여 생성합니다.'}
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="subheadline" className={commonLabelClass}>
                {isEventBannerForm ? '부제목' : '서브헤드라인'} <span className="text-gray-400 text-xs">(선택)</span>
              </label>
              {!isEventBannerForm && subheadline.length > 0 && (
                <span className={`text-xs ${subheadline.length > 8 ? 'text-blue-600 font-medium' : 'text-[#F97000] font-medium'}`}>
                  {subheadline.length}자 {subheadline.length > 8 ? '✓ 그대로 사용' : '→ 확장 가능'}
                </span>
              )}
              {isEventBannerForm && subheadline.length > 0 && (
                <span className="text-xs text-blue-600 font-medium">입력 그대로 사용</span>
              )}
            </div>
            <input
              type="text"
              id="subheadline"
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              className={commonInputClass}
              placeholder={
                isEventBannerForm
                  ? bannerAutoFillEmptyFields
                    ? '부제목 (비우면 AI가 제목에 맞게 작성)'
                    : '부제목 (비우면 결과에서 생략)'
                  : bannerAutoFillEmptyFields
                    ? '보조 메시지 (비우면 자동 생성)'
                    : '보조 메시지 (비우면 결과에서 생략)'
              }
            />
            {isEventBannerForm && subheadline.length > 0 && (
              <p className="mt-1 text-xs text-blue-600">입력한 부제목은 수정 없이 그대로 사용됩니다.</p>
            )}
            {!isEventBannerForm && subheadline.length > 0 && (
              <p className={`mt-1 text-xs ${subheadline.length > 8 ? 'text-blue-600' : 'text-[#F97000]'}`}>
                {subheadline.length > 8 
                  ? '✓ 입력하신 텍스트가 그대로 사용됩니다.' 
                  : bannerAutoFillEmptyFields
                    ? '💡 8글자 이하이면 AI가 내용을 확장하여 생성합니다.'
                    : '💡 8글자 이하 — 자동 채우기를 켠 경우에만 확장됩니다.'}
              </p>
            )}
            {subheadline.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">
                {isEventBannerForm
                  ? bannerAutoFillEmptyFields
                    ? '비워 두면 제목에 맞는 부제목을 AI가 작성합니다.'
                    : '비워 두면 부제목 섹션은 출력하지 않습니다.'
                  : bannerAutoFillEmptyFields
                    ? '비우면 헤드라인에 어울리는 서브헤드라인을 자동 생성합니다.'
                    : '비우면 서브헤드라인은 결과에 포함하지 않습니다.'}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="bodyCopy" className={commonLabelClass}>
              {isEventBannerForm ? '본문' : '바디카피'} <span className="text-gray-400 text-xs">(선택)</span>
            </label>
            <textarea
              id="bodyCopy"
              value={bodyCopy}
              onChange={(e) => setBodyCopy(e.target.value)}
              className={`${commonInputClass} h-24`}
              placeholder={
                isEventBannerForm
                  ? bannerAutoFillEmptyFields
                    ? '본문 (비우면 AI가 작성)'
                    : '본문 (비우면 결과에서 생략)'
                  : bannerAutoFillEmptyFields
                    ? '본문 (비우면 자동 생성)'
                    : '본문 (비우면 결과에서 생략)'
              }
            />
            {isEventBannerForm && bodyCopy.length > 0 && (
              <p className="mt-1 text-xs text-blue-600">입력한 본문은 수정 없이 그대로 사용됩니다.</p>
            )}
            {bodyCopy.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">
                {isEventBannerForm
                  ? bannerAutoFillEmptyFields
                    ? '비워 두면 제목에 맞는 본문을 AI가 작성합니다.'
                    : '비워 두면 본문 섹션은 출력하지 않습니다.'
                  : bannerAutoFillEmptyFields
                    ? '비우면 바디카피를 자동 생성합니다.'
                    : '비우면 바디카피는 결과에 포함하지 않습니다.'}
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="cta" className={commonLabelClass}>
                {isEventBannerForm ? 'CTA 문구' : 'CTA (행동 유도 문구)'} <span className="text-gray-400 text-xs">(선택)</span>
              </label>
              {!isEventBannerForm && cta.length > 0 && (
                <span className={`text-xs ${cta.length > 8 ? 'text-blue-600 font-medium' : 'text-[#F97000] font-medium'}`}>
                  {cta.length}자 {cta.length > 8 ? '✓ 그대로 사용' : '→ 확장 가능'}
                </span>
              )}
              {isEventBannerForm && cta.length > 0 && (
                <span className="text-xs text-blue-600 font-medium">입력 그대로 사용</span>
              )}
            </div>
            <input
              type="text"
              id="cta"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              className={commonInputClass}
              placeholder={
                isEventBannerForm
                  ? bannerAutoFillEmptyFields
                    ? '예: 지금 신청하기 (비우면 AI가 작성)'
                    : '예: 지금 신청하기 (비우면 CTA 생략)'
                  : bannerAutoFillEmptyFields
                    ? '예: 지금 예약하기 (비우면 자동 생성)'
                    : '예: 지금 예약하기 (비우면 CTA 생략)'
              }
            />
            {isEventBannerForm && cta.length > 0 && (
              <p className="mt-1 text-xs text-blue-600">입력한 CTA는 수정 없이 그대로 사용됩니다.</p>
            )}
            {!isEventBannerForm && cta.length > 0 && (
              <p className={`mt-1 text-xs ${cta.length > 8 ? 'text-blue-600' : 'text-[#F97000]'}`}>
                {cta.length > 8 
                  ? '✓ 입력하신 텍스트가 그대로 사용됩니다.' 
                  : bannerAutoFillEmptyFields
                    ? '💡 8글자 이하이면 AI가 내용을 확장하여 생성합니다.'
                    : '💡 8글자 이하 — 자동 채우기를 켠 경우에만 확장됩니다.'}
              </p>
            )}
            {cta.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">
                {isEventBannerForm
                  ? bannerAutoFillEmptyFields
                    ? '비워 두면 제목에 맞는 CTA를 AI가 작성합니다.'
                    : '비워 두면 CTA 섹션은 출력하지 않습니다.'
                  : bannerAutoFillEmptyFields
                    ? '비우면 CTA를 자동 생성합니다.'
                    : '비우면 CTA는 결과에 포함하지 않습니다.'}
              </p>
            )}
          </div>
          </>
          )}

          <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 mt-2 dark:border-gray-700 dark:bg-black">
            <button
              type="button"
              onClick={() => setBannerAutoFillEmptyFields((v) => !v)}
              className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all border-2 ${
                bannerAutoFillEmptyFields
                  ? 'border-gray-900 bg-white text-gray-900 shadow-sm dark:border-gray-400 dark:bg-black dark:text-gray-100'
                  : 'border-transparent bg-white/70 text-gray-800 hover:border-gray-400 dark:bg-black dark:text-gray-200 dark:hover:border-gray-500'
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                    bannerAutoFillEmptyFields ? 'bg-gray-900' : 'bg-gray-300'
                  }`}
                  aria-hidden
                >
                  <span
                    className={`m-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      bannerAutoFillEmptyFields ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </span>
                <span>비어 있는 문구 항목을 AI가 자동으로 채우기</span>
              </span>
            </button>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              {bannerAutoFillEmptyFields ? (
                <>
                  <strong className="text-gray-900">켜짐:</strong> 미입력·짧은 입력이 있어도 AI가 문구·섹션을 보완합니다.{' '}
                  <span className="text-gray-500">
                    (일반·기타 이벤트: 부제·본문·CTA / 인포그래픽·랭킹·어디로칠까·용어사전: 내용·설명 확장)
                  </span>
                </>
              ) : (
                <>
                  <strong className="text-gray-800">꺼짐(기본):</strong> 일반·기타 이벤트는 입력한 문구만 반영하고 비운 칸은 결과에 넣지 않습니다.{' '}
                  <span className="text-gray-500">
                    인포그래픽·랭킹·골프장·용어사전은 확인되지 않은 수치·사실을 만들어내지 않고 보수적으로 작성합니다.
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <label htmlFor="bannerAiImagePromptHint" className={`${commonLabelClass} mb-1`}>
              이미지 생성 참고 프롬프트 <span className="text-gray-400 text-xs font-normal">(선택)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2 leading-relaxed">
              콘텐츠 생성 시 본문·기획에 반영되고, 이미지 생성 시에도 함께 적용됩니다. 구도, 색감, 텍스트 정렬, 그래픽 스타일, 글자 크기 비율 등을 적어 주세요.
            </p>
            <textarea
              id="bannerAiImagePromptHint"
              value={bannerAiImagePromptHint}
              onChange={(e) => setBannerAiImagePromptHint(e.target.value)}
              className={`${commonInputClass} min-h-[88px]`}
              placeholder="예: 전체 왼쪽 정렬, 다크 배경 + 민트 포인트, 헤드라인은 매우 크게, 하단에 플랫 일러스트 장식"
              rows={4}
            />
          </div>
        </>
      )}
      
      {format !== 'ETC-BANNER' && format !== 'YOUTUBE-SHORTFORM' && format !== 'AI-PROMPT' && (
        <div>
          <label htmlFor="tone" className={`${commonLabelClass} mb-1`}>톤앤매너</label>
          <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)} className={selectInputClass}>
            {TONES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      {format !== 'ETC-BANNER' && format !== 'AI-PROMPT' && (
        <>
          <div>
            <label htmlFor="keyword" className={`${commonLabelClass} mb-1`}>키워드 / 주제</label>
            <div className="relative flex items-center">
                <input 
                    type="text" 
                    id="keyword" 
                    value={keyword} 
                    onChange={(e) => {
                      setKeyword(e.target.value);
                      setIsKeywordManuallySet(true); // 사용자가 직접 입력했음을 표시
                    }} 
                    className={`${commonInputClass} pr-10`}
                    placeholder={isGolfRelated && category !== '직접 입력' ? "카테고리에 맞는 주제를 추천해드려요" : "생성할 콘텐츠의 주제를 입력하세요"} 
                />
                {isGolfRelated && category !== '직접 입력' && (
                    <button 
                    type="button" 
                    onClick={handleRefreshKeyword} 
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none"
                    aria-label="새로운 키워드 추천받기"
                    title="새로운 키워드 추천받기"
                    >
                    <RefreshIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
          </div>
          
          <div>
            <label htmlFor="userText" className={`${commonLabelClass} mb-1`}>참고 텍스트 (선택)</label>
            <textarea id="userText" value={userText} onChange={(e) => setUserText(e.target.value)} className={`${commonInputClass} h-24`} placeholder="요약 또는 재구성이 필요한 원문을 입력하세요." />
          </div>
        </>
      )}

      <div className="space-y-3">
        <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-gradient-to-r from-[#006B68] via-[#007A77] to-[#006B68] hover:from-[#005552] hover:via-[#005955] hover:to-[#005552] text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              생성 중...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              {format === 'AI-PROMPT' ? '프로필 생성하기' : '컨텐츠 생성하기'}
            </>
          )}
        </button>

        {format === 'AI-PROMPT' && (
          <button
            type="button"
            onClick={handleQuickAiPromptGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center bg-gradient-to-r from-[#F97000] via-[#FF8519] to-[#F97000] hover:from-[#E06600] hover:via-[#F97000] hover:to-[#E06600] text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                생성 중...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                빠른 프로필 생성하기 (랜덤)
              </>
            )}
          </button>
        )}

        {(format === 'INSTAGRAM-CARD' || format === 'NAVER-BLOG/BAND') && (
          <button 
            type="button" 
            onClick={handleQuickGenerate} 
            disabled={isLoading}
            className="w-full flex items-center justify-center bg-gradient-to-r from-[#F97000] via-[#FF8519] to-[#F97000] hover:from-[#E06600] hover:via-[#F97000] hover:to-[#E06600] text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                생성 중...
              </>
            ) : (
              <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              빠른 컨텐츠 생성하기(랜덤)
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
};

