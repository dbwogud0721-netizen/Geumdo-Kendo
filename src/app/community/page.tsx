'use client';

import { useState, useEffect } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PageHeader from '@/components/PageHeader';
import { sha256 } from '@/lib/hash';
import { fetchIp, maskIp, MASTER_PASSWORD } from '@/lib/client';

interface Post {
  id: string;
  category: string;
  title: string;
  content: string;
  nickname: string;
  ip: string;
  secret: boolean;
  pwHash: string;
}

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

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  // 펼친 글 + 비밀글 열람 허용된 글 id
  const [openId, setOpenId] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  // 작성 폼
  const [category, setCategory] = useState('자유');
  const [nickname, setNickname] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [secret, setSecret] = useState(false);
  const [pw, setPw] = useState('');

  async function load() {
    try {
      const snap = await getDocs(query(collection(db, 'notices'), orderBy('createdAt', 'desc')));
      setPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Post, 'id'>) })));
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(''), 2500); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim() || !title.trim()) return;
    if (secret && !pw.trim()) { flash('비밀글은 비밀번호를 설정해야 합니다.'); return; }
    setBusy(true);
    const ip = await fetchIp();
    const pwHash = pw.trim() ? await sha256(pw.trim()) : '';
    await addDoc(collection(db, 'notices'), {
      category,
      title: title.trim(),
      content: content.trim(),
      nickname: nickname.trim(),
      ip,
      secret,
      pwHash,
      date: todayStr(),
      createdAt: serverTimestamp(),
    });
    setNickname(''); setTitle(''); setContent(''); setSecret(false); setPw('');
    setShowForm(false);
    await load();
    setBusy(false);
    flash('등록되었습니다.');
  }

  // 비밀글 열람
  async function tryUnlock(p: Post) {
    if (unlocked.has(p.id)) { setOpenId(openId === p.id ? null : p.id); return; }
    const input = prompt('비밀글입니다. 비밀번호를 입력하세요.');
    if (input == null) return;
    const ok = input === MASTER_PASSWORD || (await sha256(input)) === p.pwHash;
    if (!ok) { flash('비밀번호가 일치하지 않습니다.'); return; }
    setUnlocked((s) => new Set(s).add(p.id));
    setOpenId(p.id);
  }

  function toggleOpen(p: Post) {
    if (p.secret && !unlocked.has(p.id)) { tryUnlock(p); return; }
    setOpenId(openId === p.id ? null : p.id);
  }

  async function handleDelete(p: Post) {
    const input = prompt('글 비밀번호를 입력하세요. (작성 시 설정한 비밀번호)');
    if (input == null) return;
    const ok = input === MASTER_PASSWORD || (p.pwHash && (await sha256(input)) === p.pwHash);
    if (!ok) { flash('비밀번호가 일치하지 않습니다.'); return; }
    await deleteDoc(doc(db, 'notices', p.id));
    setPosts((prev) => prev.filter((x) => x.id !== p.id));
    flash('삭제되었습니다.');
  }

  return (
    <>
      <PageHeader label="Community" title="공지사항 · 게시판" description="누구나 자유롭게 글을 남길 수 있습니다." />

      {msg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-sm px-5 py-2.5 z-50 shadow-lg">
          {msg}
        </div>
      )}

      <section className="py-14 bg-white">
        <div className="mx-auto max-w-4xl px-6">

          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-[13px] text-white bg-navy-900 px-4 py-2 hover:bg-navy-700 transition-colors"
            >
              {showForm ? '✕ 취소' : '+ 글쓰기'}
            </button>
          </div>

          {/* 작성 폼 */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 p-5 mb-6 flex flex-col gap-3">
              <div className="grid grid-cols-[110px_1fr] gap-3">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="border border-gray-200 text-[13px] px-2 py-2 focus:outline-none focus:border-navy-900"
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임 *"
                  required
                  className="border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
                />
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목 *"
                required
                className="border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용"
                rows={5}
                className="border border-gray-200 text-[13px] px-3 py-2 focus:outline-none focus:border-navy-900 resize-y"
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
                  {busy ? '등록 중...' : '등록'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                작성 시 IP가 함께 기록·표시됩니다. 비밀번호는 글 열람(비밀글)과 삭제에 사용됩니다.
              </p>
            </form>
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
                <div key={p.id} className={i !== posts.length - 1 ? 'border-b border-gray-100' : ''}>
                  <div className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <span className="col-span-2 flex justify-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 ${CATEGORY_STYLES[p.category] ?? 'bg-gray-200 text-gray-700'}`}>
                        {p.category}
                      </span>
                    </span>
                    <button onClick={() => toggleOpen(p)} className="col-span-6 text-left text-[13px] text-gray-800 truncate hover:underline">
                      {p.secret && '🔒 '}{p.title}
                    </button>
                    <span className="col-span-2 text-center text-[12px] text-gray-600 truncate">
                      {p.nickname}
                      <span className="block text-[10px] text-gray-400">{maskIp(p.ip)}</span>
                    </span>
                    <span className="col-span-2 text-right">
                      <button onClick={() => handleDelete(p)} className="text-[11px] text-red-400 hover:text-red-600">삭제</button>
                    </span>
                  </div>
                  {openId === p.id && (!p.secret || unlocked.has(p.id)) && (
                    <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 text-[13px] text-gray-700 whitespace-pre-wrap">
                      {p.content || '(내용 없음)'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
