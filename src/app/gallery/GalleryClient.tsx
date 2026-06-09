'use client';

import { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { compressImage } from '@/lib/image';
import { uploadToCloudinary, cloudinaryConfigured } from '@/lib/cloudinary';

interface GalleryItem { id: string; url: string; label: string; storagePath?: string; }

export default function GalleryClient({ initialPhotos }: { initialPhotos: GalleryItem[] }) {
  const [photos, setPhotos] = useState<GalleryItem[]>(initialPhotos);
  const [showUpload, setShowUpload] = useState(false);
  const [gFile, setGFile] = useState<File | null>(null);
  const [gLabel, setGLabel] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 4000); }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    console.log('[Gallery] 파일 선택:', f ? `${f.name} (${(f.size / 1024).toFixed(1)}KB, ${f.type})` : '없음');
    setGFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function uploadPhoto(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!gFile) { flash('파일을 선택해주세요.'); return; }

    // 파일 형식 검사
    if (!gFile.type.startsWith('image/')) {
      flash('이미지 파일만 업로드 가능합니다 (JPG, PNG, WebP).');
      return;
    }

    if (!cloudinaryConfigured()) { flash('스토리지 설정 오류. 관리자에게 문의하세요.'); return; }

    console.log('[Gallery] 업로드 시작:', gFile.name, '크기:', (gFile.size / 1024).toFixed(1), 'KB');
    setBusy(true);
    setProgress(0);

    try {
      // 1. 압축
      console.log('[Gallery] 이미지 압축 중...');
      const compressed = await compressImage(gFile, { maxSize: 1600, quality: 0.8 });
      console.log('[Gallery] 압축 완료, 압축 후:', (compressed.size / 1024).toFixed(1), 'KB');

      // 2. 업로드 (진행률 콜백)
      console.log('[Gallery] Firebase Storage 업로드 시작...');
      const { url, publicId } = await uploadToCloudinary(compressed, (pct) => {
        console.log('[Gallery] 업로드 진행:', pct, '%');
        setProgress(pct);
      });
      console.log('[Gallery] 업로드 완료, URL:', url, '경로:', publicId);

      // 3. Firestore 저장
      console.log('[Gallery] Firestore에 이미지 정보 저장 중...');
      const docRef = await addDoc(collection(db, 'gallery'), {
        url,
        label: gLabel.trim() || '사진',
        storagePath: publicId,
        createdAt: serverTimestamp(),
      });
      console.log('[Gallery] Firestore 저장 완료, id:', docRef.id);

      // 4. 목록 갱신
      setPhotos(prev => [{ id: docRef.id, url, label: gLabel.trim() || '사진', storagePath: publicId }, ...prev]);
      setGFile(null);
      setGLabel('');
      setPreview(null);
      setShowUpload(false);
      if (fileRef.current) fileRef.current.value = '';
      flash('사진이 업로드되었습니다.');
    } catch (err) {
      const error = err as Error & { code?: string };
      console.error('[Gallery] 업로드 실패:', error.message, '코드:', error.code);

      // Firebase Storage 권한 에러 감지
      if (
        error.code === 'storage/unauthorized' ||
        error.message?.includes('does not have permission') ||
        error.message?.includes('unauthorized') ||
        error.message?.includes('permission-denied')
      ) {
        flash(
          '업로드 권한 없음. Firebase Console → Storage → Rules에서 ' +
          '"allow write: if true;" 로 변경해야 합니다.'
        );
        console.error(
          '[Gallery] Firebase Storage 규칙 문제!\n' +
          'Firebase Console → Storage → Rules 에서 아래 규칙으로 변경하세요:\n\n' +
          'rules_version = \'2\';\n' +
          'service firebase.storage {\n' +
          '  match /b/{bucket}/o {\n' +
          '    match /{allPaths=**} {\n' +
          '      allow read, write: if true;\n' +
          '    }\n' +
          '  }\n' +
          '}'
        );
      } else {
        flash('업로드 실패: ' + (error.message || '알 수 없는 오류'));
      }
    }

    setBusy(false);
  }

  return (
    <section className="py-14 bg-white">
      {msg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-sm px-5 py-3 z-50 shadow-lg max-w-sm text-center">
          {msg}
        </div>
      )}

      <div className="mx-auto max-w-[1200px] px-10">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="text-[13px] text-white bg-navy-900 px-4 py-2 hover:bg-navy-700 transition-colors"
          >
            {showUpload ? '✕ 취소' : '+ 사진 올리기'}
          </button>
        </div>

        {showUpload && (
          <div className="bg-gray-50 border border-gray-200 p-5 mb-8">
            <h3 className="text-[14px] font-bold text-navy-900 mb-3">사진 업로드</h3>
            <form onSubmit={uploadPhoto} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_90px] gap-3 items-end">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onFileChange}
                  required
                  className="w-full border border-gray-200 text-[13px] px-3 py-1.5 file:mr-3 file:py-1 file:px-3 file:border-0 file:bg-navy-50 file:text-navy-900 file:text-[12px] file:font-medium"
                />
                <input
                  type="text"
                  value={gLabel}
                  onChange={(e) => setGLabel(e.target.value)}
                  placeholder="사진 설명 (선택)"
                  className="w-full border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
                />
                <button
                  type="submit"
                  disabled={busy || !gFile}
                  className="bg-navy-900 text-white text-[13px] font-medium px-4 py-2 hover:bg-navy-700 transition-colors disabled:opacity-40"
                >
                  {busy ? `${progress}%` : '업로드'}
                </button>
              </div>
              {preview && (
                <div className="mt-2">
                  <p className="text-[11px] text-gray-500 mb-1">미리보기</p>
                  <img src={preview} alt="preview" className="h-28 object-cover border border-gray-200" />
                </div>
              )}
              {busy && (
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-navy-900 h-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              <p className="text-[11px] text-gray-400">업로드 전 자동 압축됩니다.</p>
            </form>
          </div>
        )}

        {photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-[14px]">아직 등록된 사진이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((item) => (
              <div key={item.id} className="group cursor-pointer">
                <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={item.url}
                    alt={item.label}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
