'use client';

import { useRef, useState } from 'react';
import { useVideos, VideoItem } from '@/hooks/useVideos';
import { sha256 } from '@/lib/hash';
import { fetchIp, maskIp } from '@/lib/client';

const MAX_MB = 200;

export default function ResourcesClient({ initialVideos }: { initialVideos?: VideoItem[] }) {
  const { videos, loading, uploading, progress, error, uploadVideo, deleteVideo, setError } = useVideos(initialVideos);

  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [nickname, setNickname] = useState('');
  const [toast, setToast] = useState('');
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 4000); }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) { setFile(null); return; }

    console.log('[Resources] 파일 선택:', f.name, (f.size / 1024 / 1024).toFixed(1) + 'MB', f.type);

    if (f.size > MAX_MB * 1024 * 1024) {
      flash(`파일이 너무 큽니다 (최대 ${MAX_MB}MB)`);
      e.target.value = '';
      return;
    }
    setFile(f);
  }

  async function handleUpload(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || uploading) return;
    if (!nickname.trim() || !title.trim()) { flash('닉네임과 제목을 입력해주세요.'); return; }

    setError(null);
    try {
      const ip = await fetchIp();
      await uploadVideo(file, {
        title: title.trim(),
        description: desc.trim(),
        nickname: nickname.trim(),
        ip,
        pwHash: '',
      });
      setFile(null); setTitle(''); setDesc(''); setNickname('');
      setShowForm(false);
      if (fileRef.current) fileRef.current.value = '';
      flash('동영상이 업로드되었습니다.');
    } catch (e) {
      flash((e as Error).message);
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

        {/* 업로드 폼 */}
        {showForm && (
          <div className="bg-gray-50 border border-gray-200 p-5 mb-8">
            <h3 className="text-[14px] font-bold text-navy-900 mb-4">동영상 업로드</h3>
            <form onSubmit={handleUpload} className="flex flex-col gap-3">

              {/* 파일 입력 — iOS/Android 지원 */}
              <label className="flex flex-col gap-1 cursor-pointer">
                <span className="text-[12px] text-gray-500">동영상 파일 선택 (MP4, MOV, WebM · 최대 {MAX_MB}MB)</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*"
                  onChange={onFileChange}
                  required
                  className="w-full border border-gray-200 text-[13px] px-3 py-1.5
                    file:mr-3 file:py-1.5 file:px-3 file:border-0
                    file:bg-navy-900 file:text-white file:text-[12px] file:font-medium
                    file:rounded-none file:cursor-pointer"
                />
              </label>

              {file && (
                <p className="text-[12px] text-gray-600">
                  선택됨: {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                </p>
              )}

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
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="설명 (선택)"
                maxLength={200}
                className="border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
              />

              {/* 진행률 */}
              {uploading && (
                <div>
                  <div className="flex justify-between text-[12px] text-gray-500 mb-1">
                    <span>업로드 중... (페이지를 닫지 마세요)</span>
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

              <p className="text-[11px] text-gray-400">
                동영상은 크기가 클 수 있습니다. 업로드 중 페이지를 닫지 마세요. PC/모바일 모두 지원.
              </p>
            </form>
          </div>
        )}

        {/* 동영상 목록 */}
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

// Cloudinary 동영상을 데스크탑 호환 코덱(H.264 MP4)으로 변환 전송.
// 아이폰 .mov(H.265/HEVC)는 크롬에서 검정화면 → f_mp4,vc_h264 로 강제 변환.
function playableVideoUrl(url?: string): string {
  if (!url || !url.includes('/video/upload/')) return url || '';
  return url
    .replace('/video/upload/', '/video/upload/f_mp4,vc_h264,q_auto/')
    .replace(/\.(mov|hevc|mkv|avi|m4v|webm)$/i, '.mp4');
}

// ── 개별 동영상 카드 ────────────────────────────────────────────────────────

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
  const isYoutube = !!v.videoId;  // 구 형식 하위 호환

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
        // 구 형식: YouTube 썸네일 + 링크
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
        // 새 형식: 직접 업로드 동영상
        // preload="none": 페이지 진입 시 영상 파일 로드 안 함
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
          {!isYoutube && v.fileSize && (
            <p className="text-[10px] text-gray-300 mt-0.5">
              {(v.fileSize / 1024 / 1024).toFixed(1)}MB
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
