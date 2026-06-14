'use client';

import { useState, useEffect } from 'react';
import { useCommunity, Post } from '@/hooks/useCommunity';
import { useCommunityComments } from '@/hooks/useCommunityComments';
import { sha256 } from '@/lib/hash';
import { fetchIp, maskIp } from '@/lib/client';

const CATEGORY_STYLES: Record<string, string> = {
  공지: 'bg-navy-900 text-white',
  안내: 'bg-[#5c7a8a] text-white',
  질문: 'bg-[#7a8a5c] text-white',
  자유: 'bg-[#8a6a5c] text-white',
};

const CATEGORIES = ['자유', '질문', '안내', '공지'];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function BoardClient() {
  const { posts, loading, error, addPost, deletePost, likePost } = useCommunity();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  const [category, setCategory] = useState('자유');
  const [nickname, setNickname] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [liked, setLiked] = useState<Set<string>>(new Set());
  useEffect(() => {
    try { setLiked(new Set(JSON.parse(localStorage.getItem('liked_community') || '[]'))); } catch {}
  }, []);
  function persistLiked(set: Set<string>) {
    setLiked(set);
    try { localStorage.setItem('liked_community', JSON.stringify([...set])); } catch {}
  }
  async function handleLike(id: string) {
    const isLiked = liked.has(id);
    const delta: 1 | -1 = isLiked ? -1 : 1;
    const next = new Set(liked);
    if (isLiked) next.delete(id); else next.add(id);
    persistLiked(next);
    try {
      await likePost(id, delta);
    } catch (e) {
      persistLiked(new Set(liked)); // 되돌리기
      flash('좋아요 실패: ' + ((e as Error).message || '오류'));
    }
  }

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    if (!nickname.trim() || !title.trim()) return;
    setSubmitting(true);
    try {
      const ip = await fetchIp();
      await addPost({
        category, title: title.trim(), content: content.trim(),
        nickname: nickname.trim(), ip, secret: false, pwHash: '', date: todayStr(),
      });
      setNickname(''); setTitle(''); setContent('');
      setShowForm(false);
      flash('등록되었습니다.');
    } catch (e) {
      flash('등록 실패: ' + ((e as Error).message || '알 수 없는 오류'));
    } finally {
      setSubmitting(false);
    }
  }

  function toggleOpen(id: string) {
    setOpenId(openId === id ? null : id);
  }

  async function handleDelete(id: string) {
    if (!confirm('이 글을 삭제할까요?')) return;
    try {
      await deletePost(id);
      flash('삭제되었습니다.');
    } catch (e) {
      flash('삭제 실패: ' + ((e as Error).message || '오류'));
    }
  }

  return (
    <section className="py-14 bg-white">
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-sm px-5 py-2.5 z-50 shadow-lg rounded-sm max-w-sm text-center">
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-4xl px-6">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-[13px] text-white bg-navy-900 px-4 py-2 hover:bg-navy-700 transition-colors"
          >
            {showForm ? '✕ 취소' : '+ 글쓰기'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 p-5 mb-6 flex flex-col gap-3">
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="border border-gray-200 text-[13px] px-2 py-2 focus:outline-none focus:border-navy-900"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="닉네임 *"
                required
                maxLength={20}
                className="border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
              />
            </div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목 *"
              required
              maxLength={100}
              className="border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
            />
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="내용"
              rows={5}
              maxLength={2000}
              className="border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900 resize-y"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-navy-900 text-white text-[13px] px-5 py-2 hover:bg-navy-700 transition-colors disabled:opacity-50"
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">작성 시 IP가 함께 기록됩니다.</p>
          </form>
        )}

        {error && !loading && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-[13px] text-red-600">
            불러오기 실패: {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[13px] text-gray-400">불러오는 중...</p>
          </div>
        ) : (
          <div className="border border-gray-200">
            <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 px-5 py-3 text-xs font-semibold text-gray-500">
              <span className="col-span-2 text-center">분류</span>
              <span className="col-span-6">제목</span>
              <span className="col-span-2 text-center">작성자</span>
              <span className="col-span-2 text-right">관리</span>
            </div>

            {posts.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-gray-400">등록된 글이 없습니다.</div>
            ) : posts.map((p, i) => (
              <div key={p.id} className={i < posts.length - 1 ? 'border-b border-gray-100' : ''}>
                <div className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <span className="col-span-2 flex justify-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 ${CATEGORY_STYLES[p.category] ?? 'bg-gray-200 text-gray-700'}`}>
                      {p.category}
                    </span>
                  </span>
                  <button
                    onClick={() => toggleOpen(p.id)}
                    className="col-span-6 text-left text-[13px] text-gray-800 truncate hover:underline"
                  >
                    {p.id.startsWith('temp-') ? <em className="opacity-50">{p.title}</em> : p.title}
                    <span className="ml-2 text-[11px] text-red-400">❤️{p.likes || 0}</span>
                    <span className="ml-1.5 text-[11px] text-gray-400">💬{p.commentCount || 0}</span>
                  </button>
                  <span className="col-span-2 text-center text-[12px] text-gray-600 truncate">
                    {p.nickname}
                    <span className="block text-[10px] text-gray-400">{maskIp(p.ip)}</span>
                  </span>
                  <span className="col-span-2 text-right">
                    {!p.id.startsWith('temp-') && (
                      <button onClick={() => handleDelete(p.id)} className="text-[11px] text-red-400 hover:text-red-600">삭제</button>
                    )}
                  </span>
                </div>

                {openId === p.id && (
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="text-[13px] text-gray-700 whitespace-pre-wrap mb-4">
                      {p.content || '(내용 없음)'}
                    </div>

                    <button
                      onClick={() => handleLike(p.id)}
                      className={`inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 border rounded-full transition-colors ${
                        liked.has(p.id)
                          ? 'border-red-300 text-red-500 bg-red-50'
                          : 'border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-500'
                      }`}
                    >
                      {liked.has(p.id) ? '❤️ 좋아요 취소' : '🤍 좋아요'} {p.likes || 0}
                    </button>

                    <CommentSection postId={p.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── 댓글 ──
function CommentSection({ postId }: { postId: string }) {
  const { comments, loading, addComment, removeComment } = useCommunityComments(postId);
  const [nickname, setNickname] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nickname.trim() || !text.trim() || busy) return;
    setBusy(true);
    try { await addComment(nickname.trim(), text.trim()); setText(''); } catch {}
    setBusy(false);
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <p className="text-[12px] font-semibold text-gray-600 mb-2">댓글 {comments.length}</p>

      {loading ? (
        <p className="text-[12px] text-gray-400 mb-3">불러오는 중...</p>
      ) : comments.length === 0 ? (
        <p className="text-[12px] text-gray-400 mb-3">첫 댓글을 남겨보세요.</p>
      ) : (
        <ul className="flex flex-col gap-2 mb-3">
          {comments.map(c => (
            <li key={c.id} className="flex items-start justify-between gap-2 bg-white border border-gray-100 px-3 py-2">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-navy-900">{c.nickname}</span>
                <p className="text-[12px] text-gray-700 whitespace-pre-wrap break-words">{c.text}</p>
              </div>
              <button
                onClick={() => { if (confirm('댓글을 삭제할까요?')) removeComment(c.id); }}
                className="shrink-0 text-[10px] text-red-400 hover:text-red-600"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          placeholder="닉네임"
          maxLength={20}
          className="sm:w-28 border border-gray-200 text-[12px] px-2 py-1.5 focus:outline-none focus:border-navy-900"
        />
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="댓글 입력"
          maxLength={300}
          className="flex-1 border border-gray-200 text-[12px] px-2 py-1.5 focus:outline-none focus:border-navy-900"
        />
        <button
          type="submit"
          disabled={busy}
          className="bg-navy-900 text-white text-[12px] px-3 py-1.5 hover:bg-navy-700 transition-colors disabled:opacity-50"
        >
          {busy ? '등록 중' : '등록'}
        </button>
      </form>
    </div>
  );
}
