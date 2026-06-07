import 'server-only';
import crypto from 'crypto';
import { NextRequest } from 'next/server';

// 허용 컬렉션 화이트리스트 (임의 컬렉션 접근 차단).
export const COLLECTIONS = ['notices', 'videos', 'gallery'] as const;
export type Collection = (typeof COLLECTIONS)[number];

export function isCollection(v: string | null): v is Collection {
  return v != null && (COLLECTIONS as readonly string[]).includes(v);
}

// 솔트 + SHA-256 (서버에서만 수행, pwHash/pwSalt는 클라로 절대 안 나감).
export function genSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}
export function hashPw(salt: string, pw: string): string {
  return crypto.createHash('sha256').update(salt + pw).digest('hex');
}

// 타이밍 안전 비교.
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// 요청에서 클라이언트 IP 추출 (Vercel: x-forwarded-for).
export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

// IP 마스킹 (목록에 노출되는 값).
export function maskIp(ip?: string): string {
  if (!ip || ip === 'unknown') return 'unknown';
  if (ip.includes(':')) {
    const parts = ip.split(':').filter(Boolean);
    return parts.slice(0, 2).join(':') + ':*';
  }
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
  return ip;
}

// 관리자 비번 검증 (헤더 x-admin-pw).
export function isAdminReq(req: NextRequest, adminPassword: string): boolean {
  if (!adminPassword) return false;
  const pw = req.headers.get('x-admin-pw');
  return pw != null && safeEqual(pw, adminPassword);
}

// Firestore 문서 -> 클라이언트로 보낼 안전한 형태로 변환.
// pwHash/pwSalt 제거, IP 마스킹(관리자는 원본), 비밀글은 본문/미디어 숨김.
interface RawDoc {
  [k: string]: unknown;
  ip?: string;
  pwHash?: string;
  pwSalt?: string;
  secret?: boolean;
  createdAt?: { toMillis?: () => number };
}

export function sanitize(
  col: Collection,
  id: string,
  data: RawDoc,
  isAdmin: boolean
) {
  const secret = !!data.secret;
  const locked = secret && !isAdmin;
  const createdAt = data.createdAt?.toMillis?.() ?? 0;

  if (col === 'gallery') {
    return {
      id,
      url: data.url ?? '',
      label: data.label ?? '',
      createdAt,
    };
  }

  const base = {
    id,
    nickname: (data.nickname as string) ?? '익명',
    ip: isAdmin ? (data.ip ?? 'unknown') : maskIp(data.ip),
    secret,
    locked,
    createdAt,
  };

  if (col === 'notices') {
    return {
      ...base,
      category: (data.category as string) ?? '자유',
      date: (data.date as string) ?? '',
      title: (data.title as string) ?? '',
      content: locked ? '' : ((data.content as string) ?? ''),
    };
  }

  // videos
  return {
    ...base,
    title: locked ? '' : ((data.title as string) ?? ''),
    videoId: locked ? '' : ((data.videoId as string) ?? ''),
    youtubeUrl: locked ? '' : ((data.youtubeUrl as string) ?? ''),
    description: locked ? '' : ((data.description as string) ?? ''),
  };
}
