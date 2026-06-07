// 업로드 전 브라우저에서 이미지 압축/리사이즈.
// 폰 원본(수 MB) -> 긴 변 maxSize 이하, JPEG로 재인코딩해 수백 KB로 축소.
// 새 라이브러리 없이 canvas만 사용.

interface CompressOptions {
  maxSize?: number; // 긴 변 최대 픽셀
  quality?: number; // 0~1 JPEG 품질
}

export async function compressImage(
  file: File,
  { maxSize = 1600, quality = 0.8 }: CompressOptions = {}
): Promise<File> {
  // 이미지가 아니면 원본 그대로
  if (!file.type.startsWith('image/')) return file;

  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  // 리사이즈 비율 계산 (확대는 안 함)
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  );

  // 압축 실패 or 오히려 커졌으면 원본 사용
  if (!blob || blob.size >= file.size) return file;

  const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
