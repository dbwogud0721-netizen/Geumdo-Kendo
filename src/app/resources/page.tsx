'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { listBoard, createBoard, deleteBoard, unlockBoard } from '@/lib/board';

interface VideoItem {
  id: string;
  title: string;
  youtubeUrl: string;
  videoId: string;
  description: string;
  nickname: string;
  ip: string;
  secret: boolean;
  locked: boolean;
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

  const [nickname, setNickname] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [secret, setSecret] = useState(false);
  const [pw, setPw] = useState('');
  const [urlErr, setUrlErr] = useState('');

  async function load() {
    try {
      const items = await listBoard<VideoItem>('videos', { limit: 30 });
      setVideos(items);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(''), 2500); }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!extractVideoId(url.trim())) { setUrlErr('올바른 YouTube URL을 입력해주세요.'); return; }
    if (!nickname.trim()) return;
    if (secret && !pw.trim()) { flash('비밀글은 비밀번호를 설정해야 합니다.'); return; }
    setUrlErr('');
    setBusy(true);
    try {
      await createBoard('videos', {
        nickname: nickname.trim(), title: title.trim(), url: url.trim(),
        description: desc.trim(), secret, password: pw.trim(),
      });
      setNickname(''); setTitle(''); setUrl(''); setDesc(''); setSecret(false); setPw('');
      setShowForm(false);
      await load();
      flash('동영상이 추가되었습니다.');
    } catch {
      flash('추가 실패. 잠시 후 다시 시도해주세요.');
    }
    setBusy(false);
  }

  async function tryUnlock(v: VideoItem) {
    const input = prompt('비밀 동영상입니다. 비밀번호를 입력하세요.');
    if (input == null) return;
    try {
      const res = await unlockBoard('videos', v.id, input);
      setVideos((prev) => prev.map((x) => x.id === v.id ? {
        ...x,
        title: String(res.title || ''),
        videoId: String(res.videoId || ''),
        youtubeUrl: String(res.youtubeUrl || ''),
        description: String(res.description || ''),
        locked: false,
      } : x));
    } catch {
      flash('비밀번호가 일치하지 않습니다.');
    }
  }

  async function handleDelete(v: VideoItem) {
    const input = prompt('동영상 비밀번호를 입력하세요. (작성 시 설정한 비밀번호)');
    if (input == null) return;
    try {
      await deleteBoard('videos', v.id, { password: input });
      setVideos((prev) => prev.filter((x) => x.id !== v.id));
      flash('삭제되었습니다.');
    } catch {
      flash('비밀번호가 일치하지 않습니다.');
    }
  }

  return (
    <>
      <PageHeader label="Videos" title="동영상" description="수련 영상 및 검도 관련 동영상을 공유하세요." />

      {msg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-sm px-5 py-2.5 z-50 shadow-lg">
          {msg}
        </div>
      )}

      <section className="py-14 bg-white">
        <div className="mx-auto max-w-[1200px] px-10">

          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-[13px] text-white bg-navy-900 px-4 py-2 hover:bg-navy-700 transition-colors"
            >
              {showForm ? '✕ 취소' : '+ 동영상 추가'}
            </button>
          </div>

          {showForm && (
            <div className="bg-gray-50 border border-gray-200 p-5 mb-8">
              <h3 className="text-[14px] font-bold text-navy-900 mb-4">YouTube 동영상 추가</h3>
              <form onSubmit={handleAdd} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="닉네임 *"
                    required
                    className="border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
                  />
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="동영상 제목 *"
                    required
                    className="border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
                  />
                </div>
                <input
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setUrlErr(''); }}
                  placeholder="https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
                  required
                  className={`border text-[13px] px-3 py-2 focus:outline-none ${urlErr ? 'border-red-400' : 'border-gray-200 focus:border-navy-900'}`}
                />
                {urlErr && <p className="text-[11px] text-red-500 -mt-1">{urlErr}</p>}
                <input
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="설명 (선택)"
                  className="border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
                />
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-1.5 text-[12px] text-gray-600">
                    <input type="checkbox" checked={secret} onChange={(e) => setSecret(e.target.checked)} />
                    🔒 비밀글
                  </label>
                  <input
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder={secret ? '비밀번호 * (열람·삭제용)' : '비밀번호 (삭제용, 선택)'}
                    className="flex-1 min-w-[180px] border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="bg-navy-900 text-white text-[13px] px-5 py-2 hover:bg-navy-700 transition-colors disabled:opacity-50"
                  >
                    {busy ? '추가 중...' : '추가'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  작성 시 IP가 함께 기록·표시됩니다. 비밀번호는 비밀글 열람과 삭제에 사용됩니다.
                </p>
              </form>
            </div>
          )}

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
                  {v.locked ? (
                    <button
                      onClick={() => tryUnlock(v)}
                      className="block w-full aspect-video bg-gray-100 flex items-center justify-center text-gray-500 text-[13px] hover:bg-gray-200 transition-colors"
                    >
                      🔒 비밀 동영상 · 클릭하여 잠금 해제
                    </button>
                  ) : (
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
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors duration-200">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current ml-0.5">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </a>
                  )}
                  <div className="mt-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-gray-800 line-clamp-2 leading-snug">
                        {v.secret && '🔒 '}{v.locked ? '비밀 동영상' : v.title}
                      </p>
                      {!v.locked && v.description && (
                        <p className="text-[11px] text-gray-500 mt-0.5">{v.description}</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {v.nickname} · {v.ip}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(v)}
                      className="shrink-0 text-[11px] text-red-400 hover:text-red-600 mt-0.5"
                    >
                      삭제
                    </button>
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
