// 작성자 식별용 클라이언트 헬퍼.

// 서버에서 IP 조회 (api/ip).
export async function fetchIp(): Promise<string> {
  try {
    const res = await fetch('/api/ip', { cache: 'no-store' });
    const data = await res.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}

// IP 일부 마스킹해서 표시 (123.45.67.89 -> 123.45.*.*, IPv6 -> 앞 2블록).
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

// 관리자 마스터 비밀번호 (환경변수). 모든 글 열람/삭제 가능.
export const MASTER_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';

// 안전장치: 프로미스가 ms 안에 안 끝나면 거부. Firestore 연결 hang 시 무한 로딩 방지.
export function withTimeout<T>(p: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}
