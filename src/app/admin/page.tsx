'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { compressImage } from '@/lib/image';
import { useAuth } from '@/contexts/AuthContext';

interface Notice {
  id: string;
  category: string;
  title: string;
  date: string;
  authorId?: string;
  authorEmail?: string;
}
interface GalleryItem {
  id: string;
  url: string;
  label: string;
  storagePath: string;
  authorId?: string;
  authorEmail?: string;
}

export default function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'notices' | 'gallery'>('notices');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const [nCategory, setNCategory] = useState('공지');
  const [nTitle, setNTitle] = useState('');
  const [nDate, setNDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  });

  const [gFile, setGFile] = useState<File | null>(null);
  const [gLabel, setGLabel] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  async function fetchAll() {
    try {
      const [nSnap, gSnap] = await Promise.all([
        getDocs(query(collection(db, 'notices'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'gallery'), orderBy('createdAt', 'desc'))),
      ]);
      setNotices(nSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Notice, 'id'>) })));
      setGallery(gSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryItem, 'id'>) })));
    } catch {}
  }

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(''), 2500);
  }

  // 삭제 권한: 관리자 OR 본인이 작성한 글
  function canDelete(authorId?: string) {
    if (!user) return false;
    return isAdmin || user.uid === authorId;
  }

  async function addNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!nTitle.trim() || !user) return;
    setBusy(true);
    await addDoc(collection(db, 'notices'), {
      category: nCategory,
      title: nTitle.trim(),
      date: nDate,
      authorId: user.uid,
      authorEmail: user.email,
      authorName: user.displayName || user.email,
      createdAt: serverTimestamp(),
    });
    setNTitle('');
    await fetchAll();
    setBusy(false);
    flash('공지사항이 추가되었습니다.');
  }

  async function deleteNotice(id: string) {
    if (!confirm('이 공지사항을 삭제할까요?')) return;
    await deleteDoc(doc(db, 'notices', id));
    await fetchAll();
    flash('삭제되었습니다.');
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setGFile(f);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  async function uploadPhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!gFile || !user) return;
    setBusy(true);
    // 업로드 전 압축/리사이즈 (원본 수 MB -> 수백 KB)
    const compressed = await compressImage(gFile, { maxSize: 1600, quality: 0.8 });
    const storagePath = `gallery/${Date.now()}-${compressed.name}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, compressed);
    const url = await getDownloadURL(storageRef);
    await addDoc(collection(db, 'gallery'), {
      url,
      label: gLabel.trim() || '사진',
      storagePath,
      authorId: user.uid,
      authorEmail: user.email,
      createdAt: serverTimestamp(),
    });
    setGFile(null);
    setGLabel('');
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
    await fetchAll();
    setBusy(false);
    flash('사진이 업로드되었습니다.');
  }

  async function deletePhoto(item: GalleryItem) {
    if (!confirm('이 사진을 삭제할까요?')) return;
    try { await deleteObject(ref(storage, item.storagePath)); } catch {}
    await deleteDoc(doc(db, 'gallery', item.id));
    await fetchAll();
    flash('삭제되었습니다.');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">
        로딩 중...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ paddingTop: 52, minHeight: '100vh', background: '#f9fafb' }}>
      {/* Top bar */}
      <div className="bg-navy-900 text-white px-8 py-4 flex items-center justify-between">
        <h1 className="text-[15px] font-bold">
          {isAdmin ? '관리자 패널' : '게시물 관리'}
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-[12px] text-gray-300">
            {user.displayName || user.email}
            {isAdmin && <span className="ml-2 text-gold-400">(관리자)</span>}
          </span>
          <Link href="/" className="text-[12px] text-gray-300 hover:text-white transition-colors">
            ← 홈으로
          </Link>
          <button
            onClick={() => signOut(auth)}
            className="text-[12px] text-gray-300 hover:text-white border border-white/20 px-3 py-1 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* Flash */}
      {msg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-sm px-5 py-2.5 z-50 shadow-lg">
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-8">
        {(['notices', 'gallery'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3.5 text-[13px] font-medium border-b-2 transition-colors ${
              tab === t ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'notices' ? '공지사항' : '갤러리'}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px' }}>

        {/* ── NOTICES ── */}
        {tab === 'notices' && (
          <div>
            {/* Add form */}
            <div className="bg-white border border-gray-200 p-6 mb-5">
              <h2 className="text-[14px] font-bold text-navy-900 mb-4">공지사항 추가</h2>
              <form onSubmit={addNotice}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[120px_1fr_150px_90px] md:items-end">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">카테고리</label>
                    <select
                      value={nCategory}
                      onChange={(e) => setNCategory(e.target.value)}
                      className="w-full border border-gray-200 text-[13px] px-2 py-2 focus:outline-none focus:border-navy-900"
                    >
                      {['공지', '안내', '갤러리', '행사'].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">제목 *</label>
                    <input
                      type="text"
                      value={nTitle}
                      onChange={(e) => setNTitle(e.target.value)}
                      placeholder="공지사항 제목"
                      required
                      className="w-full border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">날짜</label>
                    <input
                      type="text"
                      value={nDate}
                      onChange={(e) => setNDate(e.target.value)}
                      className="w-full border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="bg-navy-900 text-white text-[13px] font-medium px-4 py-2 hover:bg-navy-700 transition-colors disabled:opacity-50"
                  >
                    추가
                  </button>
                </div>
              </form>
            </div>

            {/* List */}
            <div className="bg-white border border-gray-200">
              <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                <span className="text-[13px] font-semibold text-navy-900">공지사항 목록</span>
                <span className="text-[12px] text-gray-400">총 {notices.length}건</span>
              </div>
              {notices.length === 0 ? (
                <div className="py-10 text-center text-[13px] text-gray-400">등록된 공지사항이 없습니다.</div>
              ) : notices.map((n, i) => (
                <div key={n.id} className={`flex items-center gap-3 px-5 py-3 ${i < notices.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 bg-navy-900 text-white">{n.category}</span>
                  <span className="flex-1 text-[13px] text-gray-800 truncate">{n.title}</span>
                  <span className="shrink-0 text-[11px] text-gray-400">{n.date}</span>
                  {canDelete(n.authorId) && (
                    <button
                      onClick={() => deleteNotice(n.id)}
                      className="shrink-0 text-[11px] text-red-500 hover:text-red-700 px-2 py-1"
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GALLERY ── */}
        {tab === 'gallery' && (
          <div>
            <div className="bg-white border border-gray-200 p-6 mb-5">
              <h2 className="text-[14px] font-bold text-navy-900 mb-4">사진 업로드</h2>
              <form onSubmit={uploadPhoto}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_90px] md:items-end">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">사진 파일 * (jpg, png)</label>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={onFileChange}
                      required
                      className="w-full border border-gray-200 text-[13px] px-3 py-1.5 file:mr-3 file:py-1 file:px-3 file:border-0 file:bg-navy-50 file:text-navy-900 file:text-[12px] file:font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">사진 설명</label>
                    <input
                      type="text"
                      value={gLabel}
                      onChange={(e) => setGLabel(e.target.value)}
                      placeholder="예: 수련 모습"
                      className="w-full border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy || !gFile}
                    className="bg-navy-900 text-white text-[13px] font-medium px-4 py-2 hover:bg-navy-700 transition-colors disabled:opacity-40"
                  >
                    {busy ? '업로드 중...' : '업로드'}
                  </button>
                </div>
                {preview && (
                  <div className="mt-4">
                    <p className="text-[11px] text-gray-500 mb-2">미리보기</p>
                    <img src={preview} alt="preview" className="h-32 object-cover border border-gray-200" />
                  </div>
                )}
              </form>
            </div>

            <div className="bg-white border border-gray-200">
              <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                <span className="text-[13px] font-semibold text-navy-900">갤러리 목록</span>
                <span className="text-[12px] text-gray-400">총 {gallery.length}장</span>
              </div>
              {gallery.length === 0 ? (
                <div className="py-10 text-center text-[13px] text-gray-400">업로드된 사진이 없습니다.</div>
              ) : (
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {gallery.map((item) => (
                    <div key={item.id}>
                      <img src={item.url} alt={item.label} loading="lazy" decoding="async" className="w-full aspect-[4/3] object-cover" />
                      <div className="mt-1 flex items-center justify-between gap-1">
                        <span className="text-[11px] text-gray-600 truncate">{item.label}</span>
                        {canDelete(item.authorId) && (
                          <button
                            onClick={() => deletePhoto(item)}
                            className="shrink-0 text-[10px] text-red-500 hover:text-red-700"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}