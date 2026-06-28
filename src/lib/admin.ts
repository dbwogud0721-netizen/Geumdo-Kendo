import { useState, useEffect } from 'react';

// 마스터 비밀번호 (Vercel env). BOM/공백 제거.
const clean = (v?: string) => (v || '').replace(/[^\x20-\x7E]/g, '').trim();
export const MASTER_PASSWORD = clean(process.env.NEXT_PUBLIC_ADMIN_PASSWORD);

const KEY = 'geumdo_admin';

// 관리자 모드 (브라우저 localStorage 기반 UI 게이트).
// 공지·갤러리·동영상 "올리기/삭제"는 관리자만 보이게 하는 용도.
export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try { setIsAdmin(localStorage.getItem(KEY) === '1'); } catch {}
  }, []);

  function login(pw: string): boolean {
    if (MASTER_PASSWORD && pw === MASTER_PASSWORD) {
      try { localStorage.setItem(KEY, '1'); } catch {}
      setIsAdmin(true);
      return true;
    }
    return false;
  }

  function logout() {
    try { localStorage.removeItem(KEY); } catch {}
    setIsAdmin(false);
  }

  return { isAdmin, login, logout, configured: MASTER_PASSWORD !== '' };
}
