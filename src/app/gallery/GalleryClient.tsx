'use client';

import { useRef, useState } from 'react';
import { useGallery, GalleryItem } from '@/hooks/useGallery';

const MAX_MB = 20;

export default function GalleryClient({ initialPhotos }: { initialPhotos?: GalleryItem[] }) {
  const { items, loading, uploading, progress, error, uploadImage, deleteImage, setError } = useGallery(initialPhotos);

  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [zoom, setZoom] = useState<GalleryItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 4000); }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) { setFile(null); setPreview(null); return; }

    console.log('[Gallery] 파일 선택:', f.name, (f.size / 1024 / 1024).toFixed(2) + 'MB', f.type);

    if (f.size > MAX_MB * 1024 * 1024) {
      flash(`파일이 너무 큽니다 (최대 ${MAX_MB}MB). 더 작은 사진을 선택해주세요.`);
      e.target.value = '';
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleUpload(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || uploading) return;

    setError(null);
    try {
      await uploadImage(file, label);
      setFile(null);
      setLabel('');
      setPreview(null);
      setShowUpload(false);
      if (fileRef.current) fileRef.current.value = '';
      flash('사진이 업로드되었습니다.');
    } catch (e) {
      flash((e as Error).message);
    }
  }

  async function handleDelete(item: GalleryItem) {
    if (!confirm('이 사진을 삭제할까요?')) return;
    try {
      await deleteImage(item);
      flash('삭제되었습니다.');
    } catch (e) {
      flash('삭제 실패: ' + (e as Error).message);
    }
  }

  return (
    <section className="py-14 bg-white">
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-sm px-5 py-3 z-50 shadow-lg max-w-sm text-center rounded-sm">
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => { setShowUpload(!showUpload); setError(null); }}
            className="text-[13px] text-white bg-navy-900 px-4 py-2 hover:bg-navy-700 transition-colors"
          >
            {showUpload ? '✕ 취소' : '+ 사진 올리기'}
          </button>
        </div>

        {/* 업로드 폼 */}
        {showUpload && (
          <div className="bg-gray-50 border border-gray-200 p-5 mb-8">
            <h3 className="text-[14px] font-bold text-navy-900 mb-3">사진 업로드</h3>
            <form onSubmit={handleUpload} className="flex flex-col gap-3">

              {/* 파일 입력 — iOS/Android 갤러리 접근 */}
              <label className="flex flex-col gap-1 cursor-pointer">
                <span className="text-[12px] text-gray-500">사진 파일 선택 (JPG, PNG, WebP · 최대 {MAX_MB}MB)</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture={undefined}
                  onChange={onFileChange}
                  required
                  className="w-full border border-gray-200 text-[13px] px-3 py-1.5
                    file:mr-3 file:py-1.5 file:px-3 file:border-0
                    file:bg-navy-900 file:text-white file:text-[12px] file:font-medium
                    file:rounded-none file:cursor-pointer"
                />
              </label>

              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="사진 설명 (선택)"
                maxLength={50}
                className="border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
              />

              {/* 미리보기 */}
              {preview && (
                <div>
                  <p className="text-[11px] text-gray-500 mb-1">미리보기</p>
                  <img src={preview} alt="preview" className="h-32 w-auto object-cover border border-gray-200" />
                </div>
              )}

              {/* 진행률 */}
              {uploading && (
                <div>
                  <div className="flex justify-between text-[12px] text-gray-500 mb-1">
                    <span>업로드 중...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-navy-900 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Storage 오류 */}
              {error && (
                <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 p-2 rounded-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={uploading || !file}
                className="self-end bg-navy-900 text-white text-[13px] font-medium px-6 py-2 hover:bg-navy-700 transition-colors disabled:opacity-40"
              >
                {uploading ? `업로드 중 ${progress}%` : '업로드'}
              </button>

              <p className="text-[11px] text-gray-400">업로드 전 자동 압축됩니다. PC/모바일 모두 지원.</p>
            </form>
          </div>
        )}

        {/* 갤러리 목록 */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[13px] text-gray-400">불러오는 중...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-[14px]">아직 등록된 사진이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map(item => (
              <div key={item.id} className="group relative">
                <div
                  className="aspect-[4/3] overflow-hidden bg-gray-100 cursor-zoom-in"
                  onClick={() => setZoom(item)}
                >
                  <img
                    src={item.url}
                    alt={item.label ?? '사진'}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                {item.label && (
                  <p className="mt-1 text-[11px] text-gray-500 truncate">{item.label}</p>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                  className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[11px] px-2 py-1 rounded-sm hover:bg-red-600 transition-colors"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 사진 확대 보기 (라이트박스) */}
      {zoom && (
        <div
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={zoom.url}
            alt={zoom.label ?? '사진'}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setZoom(null)}
            aria-label="닫기"
            className="absolute top-4 right-5 text-white text-3xl leading-none hover:opacity-70"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}
