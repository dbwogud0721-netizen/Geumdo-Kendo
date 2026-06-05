'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex items-center justify-center bg-gray-50"
      style={{ paddingTop: 52, minHeight: '100vh' }}
    >
      <div className="w-full max-w-sm bg-white border border-gray-200 p-8">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900">
            <span className="text-[12px] font-bold text-gold-400">금</span>
          </div>
          <div>
            <p className="text-[14px] font-bold text-navy-900">금도검도관</p>
            <p className="text-[11px] text-gray-400">로그인</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
              className="w-full border border-gray-200 px-3 py-2 text-[13px] focus:outline-none focus:border-navy-900"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 px-3 py-2 text-[13px] focus:outline-none focus:border-navy-900"
            />
          </div>
          {error && <p className="text-[12px] text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-navy-900 text-white text-[13px] font-medium py-2.5 hover:bg-navy-700 transition-colors disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-gray-400">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-navy-900 hover:underline font-medium">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}