'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/lib/admin';

export default function AdminPage() {
  const { isAdmin, login, logout, configured } = useAdmin();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!configured) { setErr('관리자 비밀번호가 설정되지 않았습니다. (NEXT_PUBLIC_ADMIN_PASSWORD)'); return; }
    if (login(pw)) { setErr(''); setPw(''); }
    else setErr('비밀번호가 올바르지 않습니다.');
  }

  return (
    <div className="flex items-center justify-center bg-gray-50" style={{ paddingTop: 52, minHeight: '100vh' }}>
      <div className="w-full max-w-xs bg-white border border-gray-200 p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900">
            <span className="text-[12px] font-bold text-gold-400">금</span>
          </div>
          <div>
            <p className="text-[14px] font-bold text-navy-900">관리자</p>
            <p className="text-[11px] text-gray-400">{isAdmin ? '관리자 모드 ON' : '마스터 비밀번호'}</p>
          </div>
        </div>

        {isAdmin ? (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-gray-600">
              관리자 모드가 켜졌습니다. 공지·갤러리·동영상에서 올리기/삭제가 가능합니다.
            </p>
            <div className="flex flex-col gap-1.5 text-[13px]">
              <Link href="/community" className="text-navy-900 underline">→ 공지사항 관리</Link>
              <Link href="/gallery" className="text-navy-900 underline">→ 갤러리 관리</Link>
              <Link href="/resources" className="text-navy-900 underline">→ 동영상 관리</Link>
            </div>
            <button onClick={logout} className="mt-2 bg-gray-100 text-gray-700 text-[13px] py-2 hover:bg-gray-200 transition-colors">
              관리자 모드 끄기
            </button>
            <Link href="/" className="text-center text-[12px] text-gray-400 hover:text-navy-900 mt-1">← 홈으로</Link>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input
              type="password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setErr(''); }}
              placeholder="비밀번호"
              autoFocus
              className="w-full border border-gray-200 px-3 py-2 text-[13px] focus:outline-none focus:border-navy-900"
            />
            {err && <p className="text-[12px] text-red-500">{err}</p>}
            <button type="submit" className="w-full bg-navy-900 text-white text-[13px] font-medium py-2.5 hover:bg-navy-700 transition-colors">
              관리자 로그인
            </button>
            <Link href="/" className="text-center text-[12px] text-gray-400 hover:text-navy-900">← 홈으로</Link>
          </form>
        )}
      </div>
    </div>
  );
}
