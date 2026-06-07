import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_PASSWORD } from '@/lib/firebaseAdmin';
import { safeEqual } from '@/lib/server/board';

export const runtime = 'nodejs';

// 관리자 마스터 비번 검증. 비번은 서버 환경변수(ADMIN_PASSWORD)에만 존재.
export async function POST(req: NextRequest) {
  let body: { password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  if (!ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD 미설정' }, { status: 500 });
  }
  const ok = typeof body.password === 'string' && safeEqual(body.password, ADMIN_PASSWORD);
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 });
}
