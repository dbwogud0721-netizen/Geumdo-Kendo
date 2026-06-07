// 클라이언트 -> 서버 board API 호출 헬퍼. Firestore에 직접 접근하지 않음.
// (모든 데이터 접근은 서버 API route + firebase-admin 경유)

export type Collection = 'notices' | 'videos' | 'gallery';

async function withTimeout(input: RequestInfo, init: RequestInit = {}, ms = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function listBoard<T = Record<string, unknown>>(
  col: Collection,
  opts: { limit?: number; adminPw?: string } = {}
): Promise<T[]> {
  const params = new URLSearchParams({ col });
  if (opts.limit) params.set('limit', String(opts.limit));
  const headers: Record<string, string> = {};
  if (opts.adminPw) headers['x-admin-pw'] = opts.adminPw;
  const res = await withTimeout(`/api/board?${params.toString()}`, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error('list failed');
  const data = await res.json();
  return data.items as T[];
}

export async function createBoard(
  col: Collection,
  payload: Record<string, unknown>,
  adminPw?: string
): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (adminPw) headers['x-admin-pw'] = adminPw;
  const res = await withTimeout('/api/board', {
    method: 'POST', headers, body: JSON.stringify({ col, ...payload }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'create failed');
  }
}

export async function deleteBoard(
  col: Collection,
  id: string,
  opts: { password?: string; adminPw?: string } = {}
): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.adminPw) headers['x-admin-pw'] = opts.adminPw;
  const res = await withTimeout('/api/board', {
    method: 'DELETE', headers, body: JSON.stringify({ col, id, password: opts.password || '' }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'delete failed');
  }
}

export async function unlockBoard(
  col: Collection,
  id: string,
  password: string
): Promise<Record<string, unknown>> {
  const res = await withTimeout('/api/board/unlock', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ col, id, password }),
  });
  if (!res.ok) throw new Error('unlock failed');
  return res.json();
}

export async function verifyAdmin(password: string): Promise<boolean> {
  try {
    const res = await withTimeout('/api/admin/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
