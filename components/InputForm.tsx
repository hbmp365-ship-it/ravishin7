import React, { useState, useEffect, useCallback } from 'react';
import type { UserInput, AiPromptAdditionalOption } from '../types';

type BannerContentType = NonNullable<UserInput['bannerContentType']>;
import {
  AI_PROMPT_ADDITIONAL_OPTIONS,
  AI_PROMPT_BACKGROUND_OPTIONS,
  AI_PROMPT_CAMERA_ANGLE_OPTIONS,
  AI_PROMPT_CAMERA_LENS_OPTIONS,
  AI_PROMPT_CLOTHING_COLOR_OPTIONS,
  AI_PROMPT_CLOTHING_OPTIONS,
  AI_PROMPT_GENDER_OPTIONS,
  AI_PROMPT_HAIR_OPTIONS,
  AI_PROMPT_LIGHTING_OPTIONS,
  AI_PROMPT_NATIONALITY_OPTIONS,
  AI_PROMPT_PHOTO_STYLE_OPTIONS,
  AI_PROMPT_SKIN_OPTIONS,
  AI_PROMPT_TYPES,
  ASPECT_RATIOS,
  BLOG_CATEGORIES,
  BLOG_CATEGORY_KEYWORDS,
  BLOG_LENGTHS,
  CATEGORIES,
  CATEGORY_KEYWORDS,
  FORMAT_LABELS,
  FORMATS,
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


const BANNER_CONTENT_TYPE_OPTIONS: { value: BannerContentType; label: string }[] = [
  { value: '일반', label: '일반' },
  { value: '인포그래픽', label: '인포그래픽' },
  { value: '기타 이벤트 배너', label: '기타 이벤트 배너' },
  { value: '랭킹오브더월드', label: '랭킹오브더월드' },
  { value: '어디로칠까', label: '어디로칠까' },
  { value: '골프용어사전', label: '골프용어사전' },
];

const AI_PROMPT_CUSTOM_VALUE = '__custom__';

const AI_PROMPT_RANDOM_AGES = ['26세', '28세', '31세', '34세', '37세', '41세', '45세'];
const AI_PROMPT_RANDOM_ACTIONS_EN = [
  'realistic golf follow-through after a clean iron shot',
  'candid moment adjusting a golf glove on the tee box',
  'focused putting stance on a practice green',
  'walking casually with a golf bag along the cart path',
  'modest fist pump after sinking a medium-length putt',
  'checking yardage on a wristwatch before an approach shot',
];

const pickAiPromptSelectValue = (options: ReadonlyArray<{ value: string }>) => {
  const pool = options.filter((o) => o.value !== AI_PROMPT_CUSTOM_VALUE);
  return pool[Math.floor(Math.random() * pool.length)]!.value;
};

const randomAiPromptAdditionalIds = (): AiPromptAdditionalOption[] =>
  AI_PROMPT_ADDITIONAL_OPTIONS.map((o) => o.id).filter(() => Math.random() < 0.45);

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
  const [aiPromptType, setAiPromptType] = useState<UserInput['aiPromptType']>(AI_PROMPT_TYPES[0]);
  const [aiPromptNationality, setAiPromptNationality] = useState(AI_PROMPT_NATIONALITY_OPTIONS[0].value);
  const [aiPromptGender, setAiPromptGender] = useState(AI_PROMPT_GENDER_OPTIONS[0].value);
  const [aiPromptAge, setAiPromptAge] = useState('34');
  const [aiPromptHair, setAiPromptHair] = useState(AI_PROMPT_HAIR_OPTIONS[0].value);
  const [aiPromptSkin, setAiPromptSkin] = useState(AI_PROMPT_SKIN_OPTIONS[0].value);
  const [aiPromptClothing, setAiPromptClothing] = useState(AI_PROMPT_CLOTHING_OPTIONS[0].value);
  const [aiPromptClothingColor, setAiPromptClothingColor] = useState(AI_PROMPT_CLOTHING_COLOR_OPTIONS[0].value);
  const [aiPromptActionPose, setAiPromptActionPose] = useState('');
  const [aiPromptCameraAngle, setAiPromptCameraAngle] = useState(AI_PROMPT_CAMERA_ANGLE_OPTIONS[0].value);
  const [aiPromptBackground, setAiPromptBackground] = useState(AI_PROMPT_BACKGROUND_OPTIONS[0].value);
  const [aiPromptLighting, setAiPromptLighting] = useState(AI_PROMPT_LIGHTING_OPTIONS[0].value);
  const [aiPromptCamera, setAiPromptCamera] = useState(AI_PROMPT_CAMERA_LENS_OPTIONS[0].value);
  const [aiPromptPhotoStyle, setAiPromptPhotoStyle] = useState(AI_PROMPT_PHOTO_STYLE_OPTIONS[0].value);
  const [aiPromptNationalityCustom, setAiPromptNationalityCustom] = useState('');
  const [aiPromptGenderCustom, setAiPromptGenderCustom] = useState('');
  const [aiPromptHairCustom, setAiPromptHairCustom] = useState('');
  const [aiPromptSkinCustom, setAiPromptSkinCustom] = useState('');
  const [aiPromptClothingCustom, setAiPromptClothingCustom] = useState('');
  const [aiPromptClothingColorCustom, setAiPromptClothingColorCustom] = useState('');
  const [aiPromptCameraAngleCustom, setAiPromptCameraAngleCustom] = useState('');
  const [aiPromptBackgroundCustom, setAiPromptBackgroundCustom] = useState('');
  const [aiPromptLightingCustom, setAiPromptLightingCustom] = useState('');
  const [aiPromptCameraCustom, setAiPromptCameraCustom] = useState('');
  const [aiPromptPhotoStyleCustom, setAiPromptPhotoStyleCustom] = useState('');
  const [aiPromptAdditionalOptions, setAiPromptAdditionalOptions] = useState<NonNullable<UserInput['aiPromptAdditionalOptions']>>([]);
  const [aiPromptRemoveAiEffect, setAiPromptRemoveAiEffect] = useState(false);
  const [aiPromptCustomInput, setAiPromptCustomInput] = useState('');
  useEffect(() => {
    return () => {
      if (bannerDesignReferenceObjectUrl) URL.revokeObjectURL(bannerDesignReferenceObjectUrl);
    };
  }, [bannerDesignReferenceObjectUrl]);

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

  const toggleAiPromptAdditionalOption = (id: NonNullable<UserInput['aiPromptAdditionalOptions']>[number]) => {
    setAiPromptAdditionalOptions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const resolveAiPromptSelectValue = (value: string, customValue: string) =>
    value === AI_PROMPT_CUSTOM_VALUE ? customValue.trim() : value;

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
      aspectRatio: isBannerFormat || isAiPromptFormat ? aspectRatio : undefined,
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
      aiPromptType: isAiPromptFormat ? aiPromptType : undefined,
      aiPromptNationality: isAiPromptFormat
        ? resolveAiPromptSelectValue(aiPromptNationality, aiPromptNationalityCustom)
        : undefined,
      aiPromptGender: isAiPromptFormat
        ? resolveAiPromptSelectValue(aiPromptGender, aiPromptGenderCustom)
        : undefined,
      aiPromptAge: isAiPromptFormat && aiPromptAge.trim() ? aiPromptAge.trim() : undefined,
      aiPromptHair: isAiPromptFormat ? resolveAiPromptSelectValue(aiPromptHair, aiPromptHairCustom) : undefined,
      aiPromptSkin: isAiPromptFormat ? resolveAiPromptSelectValue(aiPromptSkin, aiPromptSkinCustom) : undefined,
      aiPromptClothing: isAiPromptFormat
        ? resolveAiPromptSelectValue(aiPromptClothing, aiPromptClothingCustom)
        : undefined,
      aiPromptClothingColor: isAiPromptFormat
        ? resolveAiPromptSelectValue(aiPromptClothingColor, aiPromptClothingColorCustom)
        : undefined,
      aiPromptActionPose: isAiPromptFormat && aiPromptActionPose.trim() ? aiPromptActionPose.trim() : undefined,
      aiPromptCameraAngle: isAiPromptFormat
        ? resolveAiPromptSelectValue(aiPromptCameraAngle, aiPromptCameraAngleCustom)
        : undefined,
      aiPromptBackground: isAiPromptFormat
        ? resolveAiPromptSelectValue(aiPromptBackground, aiPromptBackgroundCustom)
        : undefined,
      aiPromptLighting: isAiPromptFormat
        ? resolveAiPromptSelectValue(aiPromptLighting, aiPromptLightingCustom)
        : undefined,
      aiPromptCamera: isAiPromptFormat ? resolveAiPromptSelectValue(aiPromptCamera, aiPromptCameraCustom) : undefined,
      aiPromptPhotoStyle: isAiPromptFormat
        ? resolveAiPromptSelectValue(aiPromptPhotoStyle, aiPromptPhotoStyleCustom)
        : undefined,
      aiPromptAdditionalOptions: isAiPromptFormat ? aiPromptAdditionalOptions : undefined,
      aiPromptRemoveAiEffect: isAiPromptFormat ? aiPromptRemoveAiEffect : undefined,
      aiPromptCustomInput: isAiPromptFormat && aiPromptCustomInput.trim() ? aiPromptCustomInput.trim() : undefined,
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

  const handleQuickAiPromptGenerate = () => {
    const additional = randomAiPromptAdditionalIds();
    const age = AI_PROMPT_RANDOM_AGES[Math.floor(Math.random() * AI_PROMPT_RANDOM_AGES.length)];
    const actionPose =
      AI_PROMPT_RANDOM_ACTIONS_EN[Math.floor(Math.random() * AI_PROMPT_RANDOM_ACTIONS_EN.length)];
    const nationality = pickAiPromptSelectValue(AI_PROMPT_NATIONALITY_OPTIONS);
    const gender = pickAiPromptSelectValue(AI_PROMPT_GENDER_OPTIONS);
    const hair = pickAiPromptSelectValue(AI_PROMPT_HAIR_OPTIONS);
    const skin = pickAiPromptSelectValue(AI_PROMPT_SKIN_OPTIONS);
    const clothing = pickAiPromptSelectValue(AI_PROMPT_CLOTHING_OPTIONS);
    const clothingColor = pickAiPromptSelectValue(AI_PROMPT_CLOTHING_COLOR_OPTIONS);
    const cameraAngle = pickAiPromptSelectValue(AI_PROMPT_CAMERA_ANGLE_OPTIONS);
    const background = pickAiPromptSelectValue(AI_PROMPT_BACKGROUND_OPTIONS);
    const lighting = pickAiPromptSelectValue(AI_PROMPT_LIGHTING_OPTIONS);
    const cameraLens = pickAiPromptSelectValue(AI_PROMPT_CAMERA_LENS_OPTIONS);
    const photoStyle = pickAiPromptSelectValue(AI_PROMPT_PHOTO_STYLE_OPTIONS);
    const removeAiEffect = Math.random() < 0.35;
    const randomAspect = ASPECT_RATIOS[Math.floor(Math.random() * ASPECT_RATIOS.length)].value;

    setAspectRatio(randomAspect);
    setAiPromptType(AI_PROMPT_TYPES[0]);
    setAiPromptNationality(nationality);
    setAiPromptGender(gender);
    setAiPromptAge(age);
    setAiPromptHair(hair);
    setAiPromptSkin(skin);
    setAiPromptClothing(clothing);
    setAiPromptClothingColor(clothingColor);
    setAiPromptActionPose(actionPose);
    setAiPromptCameraAngle(cameraAngle);
    setAiPromptBackground(background);
    setAiPromptLighting(lighting);
    setAiPromptCamera(cameraLens);
    setAiPromptPhotoStyle(photoStyle);
    setAiPromptAdditionalOptions(additional);
    setAiPromptRemoveAiEffect(removeAiEffect);
    setAiPromptCustomInput('');
    setAiPromptNationalityCustom('');
    setAiPromptGenderCustom('');
    setAiPromptHairCustom('');
    setAiPromptSkinCustom('');
    setAiPromptClothingCustom('');
    setAiPromptClothingColorCustom('');
    setAiPromptCameraAngleCustom('');
    setAiPromptBackgroundCustom('');
    setAiPromptLightingCustom('');
    setAiPromptCameraCustom('');
    setAiPromptPhotoStyleCustom('');

    const userInput: UserInput = {
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
      aspectRatio: randomAspect,
      aiPromptType: AI_PROMPT_TYPES[0],
      aiPromptNationality: nationality,
      aiPromptGender: gender,
      aiPromptAge: age,
      aiPromptHair: hair,
      aiPromptSkin: skin,
      aiPromptClothing: clothing,
      aiPromptClothingColor: clothingColor,
      aiPromptActionPose: actionPose,
      aiPromptCameraAngle: cameraAngle,
      aiPromptBackground: background,
      aiPromptLighting: lighting,
      aiPromptCamera: cameraLens,
      aiPromptPhotoStyle: photoStyle,
      aiPromptAdditionalOptions: additional,
      aiPromptRemoveAiEffect: removeAiEffect,
      aiPromptCustomInput: undefined,
    };
    onGenerate(userInput);
  };

  const commonInputClass = "w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#004B49] focus:border-[#004B49] transition-colors placeholder:text-gray-400";
  const selectInputClass = "w-full bg-gray-100 border border-gray-300 rounded-md py-2 pl-3 pr-10 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#004B49] focus:border-[#004B49] transition-colors cursor-pointer";
  const commonLabelClass = "block text-sm font-medium text-gray-600";
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
      <label htmlFor={id} className={`${commonLabelClass} mb-1`}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectInputClass}>
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">컨텐츠 생성 옵션</h2>
      
      <div>
        <label className={`${commonLabelClass} mb-2 flex items-center justify-between cursor-pointer`}>
            <span>골프 관련 컨텐츠</span>
            <div
              role="switch"
              aria-checked={isGolfRelated}
              onClick={() => setIsGolfRelated(!isGolfRelated)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isGolfRelated ? 'bg-[#004B49]' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isGolfRelated ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </div>
          </label>
      </div>

      <div>
        <label className={`${commonLabelClass} mb-2`}>포맷</label>
        <div className="grid grid-cols-5 gap-2">
          {FORMATS.map(f => {
            const Icon = formatIcons[f];
            
            // 포맷별 색상 정의
            const formatColors = {
              'INSTAGRAM-CARD': {
                selected: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white shadow-lg',
                unselected: 'bg-gradient-to-br from-purple-50 to-pink-50 text-purple-600 hover:from-purple-100 hover:to-pink-100'
              },
              'NAVER-BLOG/BAND': {
                selected: 'bg-[#03C75A] text-white shadow-lg',
                unselected: 'bg-green-50 text-[#03C75A] hover:bg-green-100'
              },
              'YOUTUBE-SHORTFORM': {
                selected: 'bg-[#FF0000] text-white shadow-lg',
                unselected: 'bg-red-50 text-[#FF0000] hover:bg-red-100'
              },
              'ETC-BANNER': {
                selected: 'bg-[#FF9500] text-white shadow-lg',
                unselected: 'bg-orange-50 text-[#FF9500] hover:bg-orange-100'
              },
              'AI-PROMPT': {
                selected: 'bg-[#004B49] text-white shadow-lg',
                unselected: 'bg-teal-50 text-[#004B49] hover:bg-teal-100'
              }
            };
            
            const colorClass = format === f 
              ? formatColors[f].selected 
              : formatColors[f].unselected;
            
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`flex flex-col items-center justify-center gap-1.5 p-2 text-sm font-medium rounded-lg text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 aspect-square ${colorClass} ${
                  format === f ? 'scale-105 ring-2 ring-white ring-offset-2' : 'scale-100'
                }`}
              >
                {Icon && <Icon className="w-6 h-6 flex-shrink-0" />}
                <span className="text-xs font-semibold leading-tight">{FORMAT_LABELS[f]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {format === 'AI-PROMPT' && (
        <div className="space-y-5 rounded-xl border border-teal-100 bg-teal-50/40 p-4">
          <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={aiPromptRemoveAiEffect}
              onChange={(e) => setAiPromptRemoveAiEffect(e.target.checked)}
              className="mt-0.5 accent-[#004B49]"
            />
            <span>
              <span className="block font-medium text-gray-800">AI 효과 제거</span>
              <span className="block text-xs text-gray-500 mt-1">
                선택 시 리얼한 피부·렌즈·빛 왜곡을 강화하는 Positive Suffix와 AI 느낌을 줄이는 Negative Prompt를 필수 추가합니다.
              </span>
            </span>
          </label>

          <div>
            <label htmlFor="aiPromptAspectRatio" className={`${commonLabelClass} mb-1`}>
              이미지 비율 <span className="text-gray-400 text-xs font-normal">(이미지 생성 시)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              통합 프롬프트와 세부 항목에 반영됩니다. 나노바나나 등 외부 이미지 툴에 붙여 넣을 때 종횡비를 맞출 때 참고하세요.
            </p>
            <select
              id="aiPromptAspectRatio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className={selectInputClass}
            >
              {ASPECT_RATIOS.map((ratio) => (
                <option key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="aiPromptType" className={`${commonLabelClass} mb-1`}>AI 유형</label>
            <select
              id="aiPromptType"
              value={aiPromptType}
              onChange={(e) => setAiPromptType(e.target.value as UserInput['aiPromptType'])}
              className={selectInputClass}
            >
              {AI_PROMPT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {aiPromptType === 'AI 인물' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderAiPromptSelect('aiPromptNationality', '국적', aiPromptNationality, setAiPromptNationality, AI_PROMPT_NATIONALITY_OPTIONS, aiPromptNationalityCustom, setAiPromptNationalityCustom, '예: Korean-American, Brazilian')}
                {renderAiPromptSelect('aiPromptGender', '성별', aiPromptGender, setAiPromptGender, AI_PROMPT_GENDER_OPTIONS, aiPromptGenderCustom, setAiPromptGenderCustom, '예: androgynous subject')}
                {renderAiPromptSelect('aiPromptHair', '머리', aiPromptHair, setAiPromptHair, AI_PROMPT_HAIR_OPTIONS, aiPromptHairCustom, setAiPromptHairCustom, '예: messy short layered hair')}
                {renderAiPromptSelect('aiPromptSkin', '피부', aiPromptSkin, setAiPromptSkin, AI_PROMPT_SKIN_OPTIONS, aiPromptSkinCustom, setAiPromptSkinCustom, '예: sun-kissed skin with visible pores')}
                <div>
                  <label htmlFor="aiPromptAge" className={`${commonLabelClass} mb-1`}>나이</label>
                  <input
                    id="aiPromptAge"
                    type="text"
                    value={aiPromptAge}
                    onChange={(e) => setAiPromptAge(e.target.value)}
                    className={commonInputClass}
                    placeholder="예: 34, 39, 45"
                  />
                </div>
                {renderAiPromptSelect('aiPromptClothing', '의상', aiPromptClothing, setAiPromptClothing, AI_PROMPT_CLOTHING_OPTIONS, aiPromptClothingCustom, setAiPromptClothingCustom, '예: oversized rugby shirt with golf skirt')}
                {renderAiPromptSelect('aiPromptClothingColor', '의상 컬러', aiPromptClothingColor, setAiPromptClothingColor, AI_PROMPT_CLOTHING_COLOR_OPTIONS, aiPromptClothingColorCustom, setAiPromptClothingColorCustom, '예: cream and forest green accents')}
                {renderAiPromptSelect('aiPromptCameraAngle', '카메라 앵글', aiPromptCameraAngle, setAiPromptCameraAngle, AI_PROMPT_CAMERA_ANGLE_OPTIONS, aiPromptCameraAngleCustom, setAiPromptCameraAngleCustom, '예: candid mirror selfie angle')}
                {renderAiPromptSelect('aiPromptBackground', '배경', aiPromptBackground, setAiPromptBackground, AI_PROMPT_BACKGROUND_OPTIONS, aiPromptBackgroundCustom, setAiPromptBackgroundCustom, '예: golf cart parking area after rain')}
                {renderAiPromptSelect('aiPromptLighting', '조명효과', aiPromptLighting, setAiPromptLighting, AI_PROMPT_LIGHTING_OPTIONS, aiPromptLightingCustom, setAiPromptLightingCustom, '예: golden hour backlight')}
                {renderAiPromptSelect('aiPromptCamera', '카메라 렌즈', aiPromptCamera, setAiPromptCamera, AI_PROMPT_CAMERA_LENS_OPTIONS, aiPromptCameraCustom, setAiPromptCameraCustom, '예: iPhone 15 Pro, Sony FE 35mm f/1.4 GM')}
                {renderAiPromptSelect('aiPromptPhotoStyle', '사진 품질 및 스타일', aiPromptPhotoStyle, setAiPromptPhotoStyle, AI_PROMPT_PHOTO_STYLE_OPTIONS, aiPromptPhotoStyleCustom, setAiPromptPhotoStyleCustom, '예: disposable camera look, raw candid photo')}
              </div>

              <div>
                <label htmlFor="aiPromptActionPose" className={`${commonLabelClass} mb-1`}>
                  포즈 및 액션 <span className="text-gray-400 text-xs font-normal">(직접 입력)</span>
                </label>
                <textarea
                  id="aiPromptActionPose"
                  value={aiPromptActionPose}
                  onChange={(e) => setAiPromptActionPose(e.target.value)}
                  className={`${commonInputClass} h-24`}
                  placeholder="예: 티박스에서 드라이버를 들고 자연스럽게 웃는 모습, 카트 거울을 보며 모자를 고치는 모습"
                />
              </div>

              <div>
                <span className={`${commonLabelClass} mb-2`}>추가 옵션</span>
                <div className="space-y-2">
                  {AI_PROMPT_ADDITIONAL_OPTIONS.map((option) => {
                    const checked = aiPromptAdditionalOptions.includes(option.id);
                    return (
                      <label
                        key={option.id}
                        className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                          checked ? 'border-[#004B49] bg-white text-[#004B49]' : 'border-gray-200 bg-white/70 text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAiPromptAdditionalOption(option.id)}
                          className="mt-0.5 accent-[#004B49]"
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="aiPromptCustomInput" className={`${commonLabelClass} mb-1`}>
                  직접 입력란 <span className="text-gray-400 text-xs font-normal">(선택)</span>
                </label>
                <textarea
                  id="aiPromptCustomInput"
                  value={aiPromptCustomInput}
                  onChange={(e) => setAiPromptCustomInput(e.target.value)}
                  className={`${commonInputClass} h-28`}
                  placeholder="추가로 반영할 인물 특징, 분위기, 금지 요소 등을 한글로 입력하세요."
                />
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
                className={`block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#004B49] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-[#003a38] disabled:opacity-50 disabled:cursor-not-allowed`}
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
                                      <strong className="text-[#004B49] font-semibold w-28 flex-shrink-0">{c.name}:</strong>
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
              <span className="ml-2 text-lg font-bold text-[#004B49]">{videoLength}초</span>
            </label>
            <input
              type="range"
              id="videoLength"
              min="5"
              max="15"
              step="5"
              value={videoLength}
              onChange={(e) => setVideoLength(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#004B49] hover:accent-[#003A38] transition-colors"
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
              <span className="ml-2 text-lg font-bold text-[#004B49]">{cutCount}개</span>
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
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#004B49] hover:accent-[#003A38] transition-colors"
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
            <span className="ml-2 text-lg font-bold text-[#004B49]">{cardCount}장</span>
          </label>
          <input
            type="range"
            id="cardCount"
            min="3"
            max="10"
            step="1"
            value={cardCount}
            onChange={(e) => setCardCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#004B49] hover:accent-[#003A38] transition-colors"
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
            <span className="ml-2 text-lg font-bold text-[#004B49]">{blogLength.toLocaleString()}자</span>
          </label>
          <input
            type="range"
            id="blogLength"
            min="500"
            max="4000"
            step="500"
            value={blogLength}
            onChange={(e) => setBlogLength(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#004B49] hover:accent-[#003A38] transition-colors"
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
            <span className="ml-2 text-lg font-bold text-[#004B49]">{sectionCount}개</span>
          </label>
          <input
            type="range"
            id="sectionCount"
            min="1"
            max="10"
            step="1"
            value={sectionCount}
            onChange={(e) => setSectionCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#004B49] hover:accent-[#003A38] transition-colors"
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
              <span className={`text-xs ${headline.length > 8 ? 'text-blue-600 font-medium' : headline.length > 0 ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
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
              <p className={`mt-1 text-xs ${headline.length > 8 ? 'text-blue-600' : 'text-orange-600'}`}>
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
                <span className={`text-xs ${subheadline.length > 8 ? 'text-blue-600 font-medium' : 'text-orange-600 font-medium'}`}>
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
              <p className={`mt-1 text-xs ${subheadline.length > 8 ? 'text-blue-600' : 'text-orange-600'}`}>
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
                <span className={`text-xs ${cta.length > 8 ? 'text-blue-600 font-medium' : 'text-orange-600 font-medium'}`}>
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
              <p className={`mt-1 text-xs ${cta.length > 8 ? 'text-blue-600' : 'text-orange-600'}`}>
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

          <div className="rounded-xl border-2 border-[#004B49]/20 bg-[#004B49]/10 p-4 mt-2">
            <button
              type="button"
              onClick={() => setBannerAutoFillEmptyFields((v) => !v)}
              className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all border-2 ${
                bannerAutoFillEmptyFields
                  ? 'border-[#004B49] bg-white text-[#004B49] shadow-sm'
                  : 'border-transparent bg-white/70 text-gray-800 hover:border-[#004B49]/40'
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                    bannerAutoFillEmptyFields ? 'bg-[#004B49]' : 'bg-gray-300'
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
                  <strong className="text-[#004B49]">켜짐:</strong> 미입력·짧은 입력이 있어도 AI가 문구·섹션을 보완합니다.{' '}
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
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-[#004B49] transition-colors focus:outline-none"
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
        <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-gradient-to-r from-[#004B49] via-[#005855] to-[#004B49] hover:from-[#003A38] hover:via-[#004640] hover:to-[#003A38] text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl">
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
            className="w-full flex items-center justify-center bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 hover:from-orange-600 hover:via-orange-500 hover:to-orange-600 text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl"
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
            className="w-full flex items-center justify-center bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 hover:from-orange-600 hover:via-orange-500 hover:to-orange-600 text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl"
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

