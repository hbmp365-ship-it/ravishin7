import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// S3 클라이언트 초기화
const getS3Client = (): S3Client => {
  if (!process.env.AWS_S3_ACCESSKEYID || !process.env.AWS_S3_SECRETACCESSKEY || !process.env.AWS_S3_REGION) {
    throw new Error('AWS S3 credentials are not set in environment variables.');
  }

  return new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_S3_ACCESSKEYID,
      secretAccessKey: process.env.AWS_S3_SECRETACCESSKEY,
    },
  });
};

/**
 * 프롬프트를 파일명으로 변환 (백엔드와 동일한 형식)
 */
const generateFileNameFromPrompt = (prompt: string): string => {
  // 프롬프트를 파일명으로 변환
  let fileName = prompt
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')  // 공백을 언더스코어로
    .replace(/[^a-z0-9_]/g, '')  // 영문, 숫자, 언더스코어만 허용
    .replace(/_+/g, '_')  // 연속된 언더스코어를 하나로
    .replace(/^_|_$/g, '');  // 앞뒤 언더스코어 제거
  
  // 최대 길이 제한 (확장자 제외 50자)
  if (fileName.length > 50) {
    fileName = fileName.substring(0, 50);
  }
  
  // 빈 문자열이면 기본값 사용
  if (!fileName) {
    fileName = 'image';
  }
  
  return `${fileName}.jpeg`;
};

/**
 * Base64 이미지를 S3에 업로드하고 URL을 반환합니다.
 * 백엔드 형식: images/1/파일명.jpeg
 * @param base64Image - Base64 인코딩된 이미지 데이터 (data:image/jpeg;base64, 접두사 포함 또는 제외 가능)
 * @param prompt - 이미지 프롬프트 (파일명 생성용)
 * @param fileName - 저장할 파일명 (확장자 포함, 제공되면 이걸 사용)
 * @returns 업로드된 이미지의 S3 URL
 */
export const uploadImageToS3 = async (base64Image: string, prompt?: string, fileName?: string): Promise<string> => {
  try {
    const s3Client = getS3Client();
    
    // Base64 데이터에서 실제 이미지 데이터 추출
    let imageData: string = base64Image;
    if (base64Image.includes(',')) {
      imageData = base64Image.split(',')[1];
    }

    // Base64를 Uint8Array로 변환 (브라우저 환경)
    const binaryString = atob(imageData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 파일명 생성 (백엔드 형식: 프롬프트 기반 또는 제공된 파일명)
    // 중복 방지를 위해 날짜 + 타임스탬프 추가
    const now = new Date();
    const timestamp = Date.now();
    // 날짜 형식: YYYYMMDD
    const dateStr = now.getFullYear().toString() + 
                   (now.getMonth() + 1).toString().padStart(2, '0') + 
                   now.getDate().toString().padStart(2, '0');
    
    let finalFileName: string;
    
    if (fileName) {
      // 제공된 파일명이 있으면 그대로 사용 (중복 가능성 있음)
      finalFileName = fileName;
    } else if (prompt) {
      // 프롬프트 기반 파일명 + 날짜 + 타임스탬프로 중복 방지
      const baseFileName = generateFileNameFromPrompt(prompt);
      // 확장자 제거 후 날짜와 타임스탬프 추가
      const nameWithoutExt = baseFileName.replace(/\.jpeg$/, '');
      finalFileName = `${nameWithoutExt}_${dateStr}_${timestamp}.jpeg`;
    } else {
      finalFileName = `image_${dateStr}_${timestamp}.jpeg`;
    }

    // S3 버킷 및 경로 설정 (백엔드 형식: images/1/파일명.jpeg)
    const bucketName = process.env.AWS_S3_IMAGE_ROOT;
    const folder = process.env.AWS_S3_IMAGE_WHERE2USE || 'images';
  
    const key = `${folder}/${finalFileName}`;

    if (!bucketName) {
      throw new Error('AWS_S3_IMAGE_ROOT is not set in environment variables.');
    }

    // S3에 업로드
    // 주의: ACL은 최신 AWS에서는 기본적으로 비활성화되어 있을 수 있습니다.
    // 버킷 정책에서 퍼블릭 읽기 권한을 설정해야 합니다.
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: bytes,
      ContentType: 'image/jpeg',
      // ACL 제거 - 버킷 정책으로 권한 관리
    });

    try {
      await s3Client.send(command);
    } catch (error: any) {
      // ACL 관련 에러인 경우 ACL 없이 재시도
      if (error?.name === 'InvalidRequest' || error?.message?.includes('ACL')) {
        console.warn('ACL 설정 실패, ACL 없이 재시도...');
        const commandWithoutAcl = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: bytes,
          ContentType: 'image/jpeg',
        });
        await s3Client.send(commandWithoutAcl);
      } else {
        throw error;
      }
    }

    // S3 URL 생성
    // 올바른 형식: https://bucket-name.s3.region.amazonaws.com/key
    const region = process.env.AWS_S3_REGION;
    
    // AWS_BASE_URL이 '.amazonaws.com/' 형식이므로 올바르게 처리
    // 최종 URL: https://teeshot-photonew.s3.ap-northeast-2.amazonaws.com/images/image_timestamp.jpg
    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    // 저장된 이미지 URL 로그 출력
    console.log('✅ S3 이미지 업로드 완료:');
    console.log('📁 저장 경로:', key);
    console.log('🔗 전체 URL:', s3Url);

    return s3Url;
  } catch (error) {
    console.error('Error uploading image to S3:', error);
    throw new Error(`이미지 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

/**
 * S3에서 이미지를 삭제합니다.
 * @param imageUrl - 삭제할 이미지의 S3 URL
 * @returns 삭제 성공 여부
 */
export const deleteImageFromS3 = async (imageUrl: string): Promise<boolean> => {
  try {
    const s3Client = getS3Client();
    
    // URL에서 버킷명과 키 추출
    const urlPattern = /https?:\/\/([^\.]+)\.s3\.([^\/]+)\/(.+)/;
    const match = imageUrl.match(urlPattern);
    
    if (!match) {
      throw new Error('Invalid S3 URL format.');
    }

    const bucketName = match[1];
    const key = match[3];

    // S3에서 삭제
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting image from S3:', error);
    throw new Error(`이미지 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

