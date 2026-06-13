// Cloudinary unsigned 업로드 (카드 불필요, 무료). 이미지·동영상 모두 지원.
// cloud name + unsigned preset 은 공개돼도 안전(쓰기 전용).
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

export interface CloudinaryResult {
  url: string;       // secure_url (https)
  publicId: string;  // 관리용 식별자
}

export function cloudinaryConfigured(): boolean {
  return CLOUD !== '' && PRESET !== '';
}

// /auto/upload : 파일 타입(이미지/동영상) 자동 감지. XHR로 업로드 진행률 보고.
export function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void
): Promise<CloudinaryResult> {
  return new Promise((resolve, reject) => {
    if (!cloudinaryConfigured()) {
      reject(new Error('Cloudinary 환경변수 미설정 (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / _UPLOAD_PRESET). Vercel 환경변수 + 재배포 확인.'));
      return;
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD}/auto/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ url: data.secure_url as string, publicId: data.public_id as string });
        } catch {
          reject(new Error('Cloudinary 응답 파싱 실패'));
        }
      } else {
        let msg = `Cloudinary 업로드 실패 (HTTP ${xhr.status})`;
        try {
          const err = JSON.parse(xhr.responseText)?.error?.message;
          if (err) msg = 'Cloudinary: ' + err;
        } catch {}
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error('네트워크 오류 (Cloudinary 연결 실패)'));
    xhr.send(fd);
  });
}
