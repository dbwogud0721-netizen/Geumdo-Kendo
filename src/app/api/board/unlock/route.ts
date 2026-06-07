import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, ADMIN_PASSWORD } from '@/lib/firebaseAdmin';
import { isCollection, isAdminReq, hashPw, safeEqual } from '@/lib/server/board';

export const runtime = 'nodejs';

// 비밀글 잠금해제: 비번 검증 통과 시 숨겨진 본문/미디어 반환. 실패 시 403.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad body' }, { status: 400 }); }

  const col = body.col as string;
  const id = String(body.id || '');
  if (!isCollection(col) || col === 'gallery' || !id) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const doc = await db.collection(col).doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const data = doc.data() as {
      pwHash?: string; pwSalt?: string; secret?: boolean;
      title?: string; content?: string; videoId?: string; youtubeUrl?: string; description?: string;
    };

    const password = String(body.password || '');
    const admin = isAdminReq(req, ADMIN_PASSWORD);
    const masterOk = admin || (ADMIN_PASSWORD !== '' && safeEqual(password, ADMIN_PASSWORD));
    const pwOk = !!data.pwHash && !!data.pwSalt && password !== '' && safeEqual(hashPw(data.pwSalt, password), data.pwHash);

    if (!masterOk && !pwOk) return NextResponse.json({ error: 'wrong password' }, { status: 403 });

    if (col === 'notices') {
      return NextResponse.json({ ok: true, content: data.content ?? '' });
    }
    // videos
    return NextResponse.json({
      ok: true,
      title: data.title ?? '',
      videoId: data.videoId ?? '',
      youtubeUrl: data.youtubeUrl ?? '',
      description: data.description ?? '',
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
