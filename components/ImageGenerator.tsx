import React, { useState, useEffect, useCallback } from 'react';
import { generateImage } from '../services/geminiService';
import { uploadImageToS3, deleteImageFromS3 } from '../services/s3Service';
import { SparklesIcon, CopyIcon, CheckIcon, MailIcon } from './icons';
import { IMAGE_MODELS, GEMINI_NATIVE_IMAGE_MODEL_ID } from '../constants';

interface ImageGeneratorProps {
  initialPrompt?: string;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ initialPrompt }) => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [s3ImageUrl, setS3ImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);


  const handleGenerate = useCallback(async (p: string) => {
    if (!p.trim()) return;

    setIsLoading(true);
    setError(null);
    setImageUrl(null);
    setIsCopied(false);
    setEmail('');
    setSendSuccess(false);
    setSendError(null);
    setS3ImageUrl(null);
    setUploadError(null);

    try {
      const base64Image = await generateImage(p);
      setImageUrl(`data:image/jpeg;base64,${base64Image}`);
      
      // 이미지 생성 후 자동으로 S3에 업로드 (프롬프트 전달)
      try {
        setIsUploading(true);
        const uploadedUrl = await uploadImageToS3(base64Image, p);
        setS3ImageUrl(uploadedUrl);
        setUploadError(null);
      } catch (uploadErr) {
        console.error('S3 업로드 오류:', uploadErr);
        setUploadError(uploadErr instanceof Error ? uploadErr.message : 'S3 업로드 중 오류가 발생했습니다.');
      } finally {
        setIsUploading(false);
      }
    } catch (err) {
      console.error(err);
      setError('이미지 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      handleGenerate(initialPrompt);
    }
  }, [initialPrompt, handleGenerate]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleGenerate(prompt);
  };

  const handleCopyImage = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const jpegBlob = await response.blob();
      
      const image = await createImageBitmap(jpegBlob);
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      ctx.drawImage(image, 0, 0);

      const pngBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      if (!pngBlob) {
        throw new Error('Failed to convert canvas to blob');
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': pngBlob,
        }),
      ]);

      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy image: ', err);
      const copyError = '이미지를 클립보드에 복사하는데 실패했습니다.';
      setError(copyError);
      setTimeout(() => {
        setError(currentError => (currentError === copyError ? null : currentError));
      }, 3000);
    }
  };

  const handleCopyS3Url = async () => {
    if (!s3ImageUrl) return;

    try {
      await navigator.clipboard.writeText(s3ImageUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL: ', err);
      setUploadError('URL 복사에 실패했습니다.');
      setTimeout(() => {
        setUploadError(null);
      }, 3000);
    }
  };

  const handleDeleteImage = async () => {
    if (!s3ImageUrl) return;

    if (!confirm('정말로 이 이미지를 S3에서 삭제하시겠습니까?')) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteImageFromS3(s3ImageUrl);
      setS3ImageUrl(null);
      setDeleteError(null);
    } catch (err) {
      console.error('Failed to delete image: ', err);
      setDeleteError(err instanceof Error ? err.message : '이미지 삭제에 실패했습니다.');
      setTimeout(() => {
        setDeleteError(null);
      }, 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);
    setSendSuccess(false);

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setSendError('유효한 이메일 주소를 입력해주세요.');
      return;
    }

    setIsSending(true);

    // Simulate sending email as there is no backend
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log(`Simulating sending image to ${email}.`);

    setIsSending(false);
    setSendSuccess(true);

    setTimeout(() => {
        setSendSuccess(false);
    }, 3000);
  };


  const commonInputClass = "w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006B68] focus:border-[#006B68] transition-colors placeholder:text-gray-400";

  return (
    <div className="bg-white p-6 rounded-b-xl rounded-r-xl shadow-lg border border-gray-200 border-t-0 min-h-[calc(100vh-13rem)] flex flex-col">
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
            <label htmlFor="imagePrompt" className="block text-sm font-medium text-gray-600 mb-1">이미지 프롬프트</label>
            <textarea 
            id="imagePrompt" 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)} 
            className={`${commonInputClass} h-24 resize-none`} 
            placeholder="생성하고 싶은 이미지에 대해 자세히 설명해주세요. 예: a minimal silhouette of an Asian golfer at sunset, natural light, no text, no logo" 
            required 
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">이미지 생성 모델</label>
            <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 font-mono">
              {GEMINI_NATIVE_IMAGE_MODEL_ID}
            </p>
            <p className="mt-1 text-xs text-gray-500">{IMAGE_MODELS[0]?.label}</p>
        </div>
        <button type="submit" disabled={isLoading || !prompt.trim()} className="w-full flex items-center justify-center bg-[#006B68] hover:bg-[#005552] text-white font-bold py-2.5 px-4 rounded-md transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              이미지 생성 중...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              이미지 생성하기
            </>
          )}
        </button>
      </form>
      <div className="flex-grow flex items-center justify-center bg-gray-50 rounded-lg p-4">
        {isLoading && (
           <div className="flex flex-col items-center justify-center h-full">
                <svg className="animate-spin h-10 w-10 text-[#006B68]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-gray-600">AI가 이미지를 그리고 있습니다...</p>
            </div>
        )}
        {error && <div className="text-red-600 text-center p-4">{error}</div>}
        {!isLoading && !error && !imageUrl && (
            <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">🖼️</div>
                <h3 className="text-lg font-semibold text-gray-800">이미지 생성</h3>
                <p className="max-w-md mt-1">프롬프트를 입력하여 멋진 이미지를 생성하거나, 콘텐츠 생성 탭에서 제안된 프롬프트를 사용해보세요.</p>
            </div>
        )}
        {!isLoading && imageUrl && (
          <div className="w-full flex flex-col items-center gap-6">
            <div className="relative group">
              <img src={imageUrl} alt={prompt} className="max-w-full max-h-[55vh] object-contain rounded-md shadow-lg" />
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button 
                      onClick={handleCopyImage}
                      className="flex items-center text-sm bg-white/70 backdrop-blur-sm hover:bg-white/90 text-gray-800 font-medium py-2 px-3 rounded-md transition-colors"
                  >
                      {isCopied ? <CheckIcon className="w-4 h-4 mr-2 text-green-400" /> : <CopyIcon className="w-4 h-4 mr-2" />}
                      {isCopied ? '복사 완료!' : '이미지 복사'}
                  </button>
              </div>
            </div>

            {/* S3 업로드 상태 및 URL 표시 */}
            <div className="w-full max-w-md border-t border-gray-200 pt-4 space-y-4">
              {isUploading && (
                <div className="flex items-center justify-center text-gray-600 text-sm">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  S3에 업로드 중...
                </div>
              )}
              
              {uploadError && (
                <div className="text-red-600 text-sm p-2 bg-red-50 rounded-md">
                  {uploadError}
                </div>
              )}

              {s3ImageUrl && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    S3 이미지 URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={s3ImageUrl}
                      readOnly
                      className={`${commonInputClass} flex-1 text-xs`}
                    />
                    <button
                      onClick={handleCopyS3Url}
                      className="flex items-center justify-center bg-[#006B68] hover:bg-[#005552] text-white font-medium py-2 px-3 rounded-md transition-colors whitespace-nowrap"
                    >
                      {isCopied ? <CheckIcon className="w-4 h-4 mr-1 text-green-300" /> : <CopyIcon className="w-4 h-4 mr-1" />}
                      {isCopied ? '복사됨' : '복사'}
                    </button>
                    <button
                      onClick={handleDeleteImage}
                      disabled={isDeleting}
                      className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isDeleting ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <span>삭제</span>
                      )}
                    </button>
                  </div>
                  {deleteError && (
                    <p className="text-red-600 text-sm">{deleteError}</p>
                  )}
                </div>
              )}

              <form onSubmit={handleSendEmail} className="space-y-2">
                <label htmlFor="emailInput" className="block text-sm font-medium text-gray-600">
                  이미지를 이메일로 받기
                </label>
                <div className="flex gap-2">
                  <input
                    id="emailInput"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setSendError(null); }}
                    className={commonInputClass}
                    placeholder="your@email.com"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSending || sendSuccess}
                    className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isSending ? (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : sendSuccess ? (
                      <CheckIcon className="w-5 h-5 text-green-400" />
                    ) : (
                      <MailIcon className="w-5 h-5" />
                    )}
                    <span className="ml-2">
                      {isSending ? '전송 중...' : sendSuccess ? '전송 완료!' : '전송'}
                    </span>
                  </button>
                </div>
                {sendError && <p className="text-red-500 text-sm">{sendError}</p>}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};