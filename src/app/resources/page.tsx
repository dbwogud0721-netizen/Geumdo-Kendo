'use client';

import { useState, useEffect } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';

interface VideoItem {
  id: string;
  title: string;
  youtubeUrl: string;
  videoId: string;
  description?: string;
  authorId?: string;
  authorEmail?: string;
}

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function ResourcesPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const { user, isAdmin } = useAuth();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [urlErr, setUrlErr] = useState('');

  useEffect(() => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) { settled = true; setLoading(false); }
    }, 6000);

    getDocs(query(collection(db, 'videos'), orderBy('createdAt', 'desc')))
      .then((snap) => {
        if (!settled) setVideos(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VideoItem, 'id'>) })));
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer);
        if (!settled) { settled = true; setLoading(false); }
      });

    return () => { settled = true; clearTimeout(timer); };
  }, []);

  function canDelete(authorId?: string) {
    if (!user) return false;
    return isAdmin || user.uid === authorId;
  }

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(''), 2500);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const videoId = extractVideoId(url.trim());
    if (!videoId) { setUrlErr('올바른 YouTube URL을 입력해주세요.'); return; }
    if (!user) return;
    setUrlErr('');
    setBusy(true);
    await addDoc(collection(db, 'videos'), {
      title: title.trim(),
      youtubeUrl: url.trim(),
      videoId,
      description: desc.trim(),
      authorId: user.uid,
      authorEmail: user.email,
      createdAt: serverTimestamp(),
    });
    setTitle(''); setUrl(''); setDesc('');
    setShowForm(false);

    const snap = await getDocs(query(collection(db, 'videos'), orderBy('createdAt', 'desc')));
    setVideos(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VideoItem, 'id'>) })));
    setBusy(false);
    flash('동영상이 추가되었습니다.');
  }

  async function handleDelete(id: string) {
    if (!confirm('이 동영상을 삭제할까요?')) return;
    await deleteDoc(doc(db, 'videos', id));
    setVideos((prev) => prev.filter((v) => v.id !== id));
    flash('삭제되었습니다.');
  }

  return (
    <>
      <PageHeader label="Videos" title="동영상" description="수련 영상 및 검도 관련 동영상을 확인하세요." />

      {msg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-sm px-5 py-2.5 z-50 shadow-lg">
          {msg}
        </div>
      )}

      <section className="py-14 bg-white">
        <div className="mx-auto max-w-[1200px] px-10">

          {/* 추가 버튼 */}
          {user && (
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowForm(!showForm)}
                className="text-[13px] text-white bg-navy-900 px-4 py-2 hover:bg-navy-700 transition-colors"
              >
                {showForm ? '✕ 취소' : '+ 동영상 추가'}
              </button>
            </div>
          )}

          {/* 추가 폼 */}
          {showForm && user && (
            <div className="bg-gray-50 border border-gray-200 p-5 mb-8">
              <h3 className="text-[14px] font-bold text-navy-900 mb-4">YouTube 동영상 추가</h3>
              <form onSubmit={handleAdd} className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">제목 *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="동영상 제목"
                    required
                    className="w-full border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">YouTube URL *</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setUrlErr(''); }}
                    placeholder="https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
                    required
                    className={`w-full border text-[13px] px-3 py-2 focus:outline-none ${urlErr ? 'border-red-400' : 'border-gray-200 focus:border-navy-900'}`}
                  />
                  {urlErr && <p className="text-[11px] text-red-500 mt-1">{urlErr}</p>}
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">설명 (선택)</label>
                  <input
                    type="text"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="동영상 간단 설명"
                    className="w-full border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={busy}
                    className="bg-navy-900 text-white text-[13px] px-5 py-2 hover:bg-navy-700 transition-colors disabled:opacity-50"
                  >
                    {busy ? '추가 중...' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 목록 */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-[13px] text-gray-400">불러오는 중...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="py-20 text-center text-[14px] text-gray-400">
              등록된 동영상이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((v) => (
                <div key={v.id} className="group">
                  <a
                    href={`https://www.youtube.com/watch?v=${v.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="relative aspect-video overflow-hidden bg-gray-100">
                      <img
                        src={`https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`}
                        alt={v.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Play icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors duration-200">
                          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current ml-0.5">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </a>
                  <div className="mt-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-medium text-gray-800 line-clamp-2 leading-snug">{v.title}</p>
                      {v.description && (
                        <p className="text-[11px] text-gray-500 mt-0.5">{v.description}</p>
                      )}
                    </div>
                    {canDelete(v.authorId) && (
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="shrink-0 text-[11px] text-red-400 hover:text-red-600 mt-0.5"
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
      </section>
    </>
  );
}