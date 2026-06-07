'use client';

import { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, getDocs, getDocsFromCache,
  query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PageHeader from '@/components/PageHeader';
import { withTimeout } from '@/lib/client';
import { compressImage } from '@/lib/image';
import { uploadToCloudinary, cloudinaryConfigured } from '@/lib/cloudinary';

interface GalleryItem { id: string; url: string; label: string; storagePath?: string; }

export default function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [gFile, setGFile] = useState<File | null>(null);
  const [gLabel, setGLabel] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'), limit(60));
    const toItem = (d: import('firebase/firestore').QueryDocumentSnapshot) =>
      ({ id: d.id, ...(d.data() as Omit<GalleryItem, 'id'>) });

    getDocsFromCache(q)
      .then(snap => { if (alive && snap.docs.length > 0) { setPhotos(snap.docs.map(toItem)); setLoading(false); } })
      .catch(() => {});

    withTimeout(getDocs(q))
      .then(snap => { if (alive) setPhotos(snap.docs.map(toItem)); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, []);

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 2500); }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setGFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function uploadPhoto(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!gFile) return;
    if (!cloudinaryConfigured()) { flash('Cloudinary 환경변수가 설정되지 않았습니다.'); return; }
    setBusy(true);
    try {
      const compressed = await compressImage(gFile, { maxSize: 1600, quality: 0.8 });
      const { url, publicId } = await uploadToCloudinary(compressed);
      const docRef = await addDoc(collection(db, 'gallery'), {
        url, label: gLabel.trim() || '사진', storagePath: publicId, createdAt: serverTimestamp(),
      });
      setPhotos(prev => [{ id: docRef.id, url, label: gLabel.trim() || '사진', storagePath: publicId }, ...prev]);
      setGFile(null); setGLabel(''); setPreview(null); setShowUpload(false);
      if (fileRef.current) fileRef.current.value = '';
      flash('사진이 업로드되었습니다.');
    } catch (err) {
      flash((err as Error).message || '업로드 실패.');
    }
    setBusy(false);
  }

  return (
    <>
      <PageHeader label="Gallery" title="갤러리" description="금도검도관의 수련 모습을 담았습니다." />

      {msg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-sm px-5 py-2.5 z-50 shadow-lg">
          {msg}
        </div>
      )}

      <section className="py-14 bg-white">
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
                    {busy ? '업로드 중...' : '업로드'}
                  </button>
                </div>
                {preview && (
                  <div className="mt-2">
                    <p className="text-[11px] text-gray-500 mb-1">미리보기</p>
                    <img src={preview} alt="preview" className="h-28 object-cover border border-gray-200" />
                  </div>
                )}
                <p className="text-[11px] text-gray-400">업로드 전 자동 압축됩니다.</p>
              </form>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-[13px] text-gray-400">사진을 불러오는 중...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-[14px] mb-3">아직 등록된 사진이 없습니다.</p>
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
    </>
  );
}
