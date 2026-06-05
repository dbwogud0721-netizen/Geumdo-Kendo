'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { NAV_ITEMS, KAKAO_OPEN_CHAT_URL } from '@/lib/data';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleLogout() {
    await signOut(auth);
    router.push('/');
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? 'shadow-sm' : 'border-b border-gray-100'
      }`}
    >
      <div className="mx-auto flex h-[52px] max-w-[1200px] items-center justify-between px-4 md:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900">
            <span className="text-[11px] font-bold text-gold-400">금</span>
          </div>
          <span className="text-[15px] font-bold text-navy-900 tracking-tight">금도검도관</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`text-[13px] transition-colors ${
                pathname === item.href
                  ? 'text-navy-900 font-semibold'
                  : 'text-gray-600 hover:text-navy-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-[12px] text-gray-500">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <Link
                href="/admin"
                className="text-[12px] font-medium hover:opacity-80 transition-opacity"
                style={{ color: isAdmin ? '#d4a843' : '#0f1c38' }}
              >
                {isAdmin ? '관리자' : '글 올리기'}
              </Link>
              <button
                onClick={handleLogout}
                className="text-[13px] text-gray-500 hover:text-navy-900 transition-colors border border-gray-200 hover:border-navy-900 px-3 py-1.5 rounded-sm"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-navy-900 transition-colors">
                <svg viewBox="0 0 18 18" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="9" cy="6" r="3.5" /><path d="M2 16c0-3.9 3.1-7 7-7s7 3.1 7 7" />
                </svg>
                로그인
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-navy-900 transition-colors border border-gray-200 hover:border-navy-900 px-3 py-1.5 rounded-sm"
              >
                회원가입
              </Link>
            </>
          )}
          {/* KakaoTalk */}
          <a
            href={KAKAO_OPEN_CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 transition-opacity hover:opacity-85"
            style={{ background: '#FEE500', color: '#191919', borderRadius: 3 }}
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 shrink-0" fill="currentColor">
              <path d="M10 2C5.03 2 1 5.19 1 9.1c0 2.44 1.48 4.6 3.74 5.87l-.9 3.3a.3.3 0 0 0 .45.33L8.4 16.4c.52.07 1.06.1 1.6.1 4.97 0 9-3.19 9-7.1C19 5.19 14.97 2 10 2z" />
            </svg>
            1:1 문의
          </a>
        </div>

        {/* Hamburger */}
        <button
          className="flex flex-col gap-[5px] md:hidden p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴"
        >
          <span className={`block h-[1.5px] w-5 bg-gray-700 transition-all duration-200 ${menuOpen ? 'translate-y-[6.5px] rotate-45' : ''}`} />
          <span className={`block h-[1.5px] w-5 bg-gray-700 transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-[1.5px] w-5 bg-gray-700 transition-all duration-200 ${menuOpen ? '-translate-y-[6.5px] -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-6 py-5 md:hidden">
          <nav className="flex flex-col gap-5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-[14px] ${pathname === item.href ? 'text-navy-900 font-semibold' : 'text-gray-600'}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap gap-3 items-center">
            {user ? (
              <>
                <Link href="/admin" className="text-sm font-medium" style={{ color: isAdmin ? '#d4a843' : '#0f1c38' }}>
                {isAdmin ? '관리자' : '글 올리기'}
              </Link>
                <button onClick={handleLogout} className="text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-sm">로그아웃</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600" onClick={() => setMenuOpen(false)}>로그인</Link>
                <Link href="/signup" className="text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-sm" onClick={() => setMenuOpen(false)}>회원가입</Link>
              </>
            )}
            <a
              href={KAKAO_OPEN_CHAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5"
              style={{ background: '#FEE500', color: '#191919', borderRadius: 3 }}
            >
              1:1 카카오 문의
            </a>
          </div>
        </div>
      )}
    </header>
  );
}