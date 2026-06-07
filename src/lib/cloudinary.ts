// Cloudinary unsigned 업로드 (카드 불필요, 무료 25GB).
// cloud name + unsigned preset은 공개돼도 안전(쓰기만, 삭제는 서명 필요).
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

export interface CloudinaryResult {
  url: string;       // secure_url (https)
  publicId: string;  // 삭제/관리용 식별자
}

export function cloudinaryConfigured(): boolean {
  return CLOUD !== '' && PRESET !== '';
}

export async function uploadToCloudinary(file: File): Promise<CloudinaryResult> {
  if (!cloudinaryConfigured()) {
    throw new Error('Cloudinary 환경변수 미설정 (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / _UPLOAD_PRESET)');
  }
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || 'Cloudinary 업로드 실패');
  }
  const data = await res.json();
  return { url: data.secure_url as string, publicId: data.public_id as string };
}
