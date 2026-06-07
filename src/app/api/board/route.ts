import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, ADMIN_PASSWORD } from '@/lib/firebaseAdmin';
import {
  isCollection, isAdminReq, getClientIp, sanitize,
  genSalt, hashPw, safeEqual,
} from '@/lib/server/board';

export const runtime = 'nodejs';

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── 목록 ──
export async function GET(req: NextRequest) {
  const col = req.nextUrl.searchParams.get('col');
  if (!isCollection(col)) return NextResponse.json({ error: 'invalid collection' }, { status: 400 });

  const limitRaw = parseInt(req.nextUrl.searchParams.get('limit') || '30', 10);
  const limit = Math.min(Math.max(Number.isNaN(limitRaw) ? 30 : limitRaw, 1), 100);
  const isAdmin = isAdminReq(req, ADMIN_PASSWORD);

  try {
    const snap = await getAdminDb()
      .collection(col)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    const items = snap.docs.map((d) => sanitize(col, d.id, d.data(), isAdmin));
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// ── 작성 ──
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad body' }, { status: 400 }); }

  const col = body.col as string;
  if (!isCollection(col)) return NextResponse.json({ error: 'invalid collection' }, { status: 400 });

  try {
    const db = getAdminDb();

    // 갤러리는 관리자만 작성.
    if (col === 'gallery') {
      if (!isAdminReq(req, ADMIN_PASSWORD)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      const url = String(body.url || '').trim();
      const label = String(body.label || '사진').trim();
      const storagePath = String(body.storagePath || '').trim();
      if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
      await db.collection('gallery').add({ url, label, storagePath, createdAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ ok: true });
    }

    // notices / videos — 공개 작성.
    const nickname = String(body.nickname || '').trim();
    const secret = !!body.secret;
    const password = String(body.password || '').trim();
    if (!nickname) return NextResponse.json({ error: 'nickname required' }, { status: 400 });
    if (secret && !password) return NextResponse.json({ error: 'password required for secret' }, { status: 400 });

    const ip = getClientIp(req);
    let pwSalt = '';
    let pwHash = '';
    if (password) { pwSalt = genSalt(); pwHash = hashPw(pwSalt, password); }

    const common = { nickname, ip, secret, pwSalt, pwHash, createdAt: FieldValue.serverTimestamp() };

    if (col === 'notices') {
      const title = String(body.title || '').trim();
      if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
      await db.collection('notices').add({
        ...common,
        category: String(body.category || '자유').trim(),
        title,
        content: String(body.content || '').trim(),
        date: String(body.date || '').trim(),
      });
      return NextResponse.json({ ok: true });
    }

    // videos
    const url = String(body.url || '').trim();
    const videoId = extractVideoId(url);
    const title = String(body.title || '').trim();
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
    if (!videoId) return NextResponse.json({ error: 'invalid youtube url' }, { status: 400 });
    await db.collection('videos').add({
      ...common,
      title,
      youtubeUrl: url,
      videoId,
      description: String(body.description || '').trim(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// ── 삭제 ──
export async function DELETE(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad body' }, { status: 400 }); }

  const col = body.col as string;
  const id = String(body.id || '');
  if (!isCollection(col) || !id) return NextResponse.json({ error: 'invalid request' }, { status: 400 });

  try {
    const db = getAdminDb();
    const admin = isAdminReq(req, ADMIN_PASSWORD);

    // 갤러리는 관리자만 삭제.
    if (col === 'gallery') {
      if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      await db.collection('gallery').doc(id).delete();
      return NextResponse.json({ ok: true });
    }

    const ref = db.collection(col).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const data = doc.data() as { pwHash?: string; pwSalt?: string };
    const password = String(body.password || '');
    const masterOk = admin || (ADMIN_PASSWORD !== '' && safeEqual(password, ADMIN_PASSWORD));
    const pwOk = !!data.pwHash && !!data.pwSalt && password !== '' && safeEqual(hashPw(data.pwSalt, password), data.pwHash);

    if (!masterOk && !pwOk) return NextResponse.json({ error: 'wrong password' }, { status: 403 });

    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
