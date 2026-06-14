'use client';

import { useState } from 'react';
import { useVideos, VideoItem } from '@/hooks/useVideos';
import { sha256 } from '@/lib/hash';
import { fetchIp, maskIp } from '@/lib/client';

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function ResourcesClient({ initialVideos }: { initialVideos?: VideoItem[] }) {
  const { videos, loading, error, addYoutube, deleteVideo, setError } = useVideos(initialVideos);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ytUrl, setYtUrl] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [nickname, setNickname] = useState('');
  const [toast, setToast] = useState('');
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 4000); }

  async function handleAdd(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    if (!nickname.trim() || !title.trim()) { flash('닉네임과 제목을 입력해주세요.'); return; }
    const videoId = extractVideoId(ytUrl.trim());
    if (!videoId) { flash('올바른 YouTube 링크를 입력해주세요.'); return; }

    setSubmitting(true);
    setError(null);
    try {
      const ip = await fetchIp();
      await addYoutube({
        videoId, youtubeUrl: ytUrl.trim(),
        title: title.trim(), description: desc.trim(), nickname: nickname.trim(), ip,
      });
      setYtUrl(''); setTitle(''); setDesc(''); setNickname('');
      setShowForm(false);
      flash('동영상이 등록되었습니다.');
    } catch (e) {
      flash('등록 실패: ' + (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(v: VideoItem) {
    if (!confirm('이 동영상을 삭제할까요?')) return;
    try {
      await deleteVideo(v);
      flash('삭제되었습니다.');
    } catch (e) {
      flash('삭제 실패: ' + (e as Error).message);
    }
  }

  async function tryUnlock(v: VideoItem) {
    const input = prompt('비밀 동영상입니다. 비밀번호를 입력하세요.');
    if (!input) return;
    if ((await sha256(input)) !== v.pwHash) { flash('비밀번호가 일치하지 않습니다.'); return; }
    setUnlocked(s => new Set(s).add(v.id));
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
            onClick={() => { setShowForm(!showForm); setError(null); }}
            className="text-[13px] text-white bg-navy-900 px-4 py-2 hover:bg-navy-700 transition-colors"
          >
            {showForm ? '✕ 취소' : '+ 동영상 올리기'}
          </button>
        </div>

        {/* 등록 폼 — YouTube 링크 */}
        {showForm && (
          <div className="bg-gray-50 border border-gray-200 p-5 mb-8">
            <h3 className="text-[14px] font-bold text-navy-900 mb-4">YouTube 동영상 등록</h3>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="닉네임 *"
                  required
                  maxLength={20}
                  className="border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
                />
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="제목 *"
                  required
                  maxLength={100}
                  className="border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
                />
              </div>
              <input
                value={ytUrl}
                onChange={e => setYtUrl(e.target.value)}
                placeholder="YouTube 링크 * (https://youtu.be/... 또는 watch?v=...)"
                required
                className="border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
              />
              <input
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="설명 (선택)"
                maxLength={200}
                className="border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
              />
              {error && (
                <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 p-2 rounded-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="self-end bg-navy-900 text-white text-[13px] font-medium px-6 py-2 hover:bg-navy-700 transition-colors disabled:opacity-40"
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
              <p className="text-[11px] text-gray-400">
                YouTube에 올린 영상의 링크를 붙여넣으세요. 용량 제한 없음.
              </p>
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
          <div className="py-20 text-center text-[14px] text-gray-400">등록된 동영상이 없습니다.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(v => <VideoCard key={v.id} v={v} unlocked={unlocked} onDelete={handleDelete} onUnlock={tryUnlock} />)}
          </div>
        )}
      </div>
    </section>
  );
}

// 데스크탑 호환 코덱(H.264 MP4)으로 변환 전송 (구 형식 직접업로드 영상용).
function playableVideoUrl(url?: string): string {
  if (!url || !url.includes('/video/upload/')) return url || '';
  return url
    .replace('/video/upload/', '/video/upload/f_mp4,vc_h264,q_auto/')
    .replace(/\.(mov|hevc|mkv|avi|m4v|webm)$/i, '.mp4');
}

function VideoCard({
  v,
  unlocked,
  onDelete,
  onUnlock,
}: {
  v: VideoItem;
  unlocked: Set<string>;
  onDelete: (v: VideoItem) => void;
  onUnlock: (v: VideoItem) => void;
}) {
  const isLocked = v.secret && !unlocked.has(v.id);
  const isYoutube = !!v.videoId;

  return (
    <div className="group">
      {isLocked ? (
        <button
          onClick={() => onUnlock(v)}
          className="w-full aspect-video bg-gray-100 flex items-center justify-center text-gray-500 text-[13px] hover:bg-gray-200 transition-colors"
        >
          🔒 비밀 동영상 · 클릭하여 잠금 해제
        </button>
      ) : isYoutube ? (
        <a href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer" className="block">
          <div className="relative aspect-video overflow-hidden bg-gray-100">
            <img
              src={`https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`}
              alt={v.title ?? '동영상'}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current ml-0.5"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
          </div>
        </a>
      ) : v.url ? (
        // 구 형식: 직접 업로드된 영상 (하위 호환)
        <video
          src={playableVideoUrl(v.url)}
          controls
          preload="metadata"
          playsInline
          className="w-full aspect-video bg-black object-contain"
        />
      ) : null}

      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-gray-800 line-clamp-2 leading-snug">
            {v.secret && '🔒 '}{isLocked ? '비밀 동영상' : (v.title ?? v.fileName ?? '동영상')}
          </p>
          {!isLocked && v.description && (
            <p className="text-[11px] text-gray-500 mt-0.5">{v.description}</p>
          )}
          {v.nickname && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              {v.nickname}{v.ip ? ' · ' + maskIp(v.ip) : ''}
            </p>
          )}
        </div>
        {!v.id.startsWith('temp-') && (
          <button
            onClick={() => onDelete(v)}
            className="shrink-0 text-[11px] text-red-400 hover:text-red-600 mt-0.5"
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}
