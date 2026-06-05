'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function getErrorMsg(code: string | undefined): string {
  switch (code) {
    case 'auth/email-already-in-use': return '이미 사용 중인 이메일입니다.';
    case 'auth/invalid-email': return '올바른 이메일 형식이 아닙니다.';
    case 'auth/weak-password': return '비밀번호는 6자 이상이어야 합니다.';
    case 'auth/operation-not-allowed': return 'Firebase Console에서 이메일/비밀번호 로그인을 활성화해주세요.';
    case 'auth/network-request-failed': return '네트워크 오류. 인터넷 연결을 확인해주세요.';
    case 'auth/too-many-requests': return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    case 'auth/configuration-not-found': return 'Firebase 설정 오류. 환경변수를 확인해주세요.';
    case 'auth/invalid-api-key': return 'Firebase API 키가 올바르지 않습니다.';
    default: return `오류가 발생했습니다. (${code ?? 'unknown'})`;
  }
}

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.SyntheticEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      router.push('/');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      setError(getErrorMsg(code));
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
        <div className="flex items-center gap-2 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900">
            <span className="text-[12px] font-bold text-gold-400">금</span>
          </div>
          <div>
            <p className="text-[14px] font-bold text-navy-900">금도검도관</p>
            <p className="text-[11px] text-gray-400">회원가입</p>
          </div>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full border border-gray-200 px-3 py-2 text-[13px] focus:outline-none focus:border-navy-900"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">이메일 *</label>
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
            <label className="block text-[11px] text-gray-500 mb-1">비밀번호 *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="6자 이상"
              className="w-full border border-gray-200 px-3 py-2 text-[13px] focus:outline-none focus:border-navy-900"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">비밀번호 확인 *</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full border border-gray-200 px-3 py-2 text-[13px] focus:outline-none focus:border-navy-900"
            />
          </div>
          {error && (
            <p className="text-[12px] text-red-500 bg-red-50 border border-red-100 px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-navy-900 text-white text-[13px] font-medium py-2.5 hover:bg-navy-700 transition-colors disabled:opacity-50"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-gray-400">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-navy-900 hover:underline font-medium">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}