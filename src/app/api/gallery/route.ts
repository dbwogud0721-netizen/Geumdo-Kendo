import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const GALLERY_DIR = path.join(process.cwd(), 'public/gallery');
const META_FILE = path.join(process.cwd(), 'public/data/gallery.json');

function readMeta() {
  if (!fs.existsSync(META_FILE)) return [];
  return JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
}

export async function GET() {
  return NextResponse.json(readMeta());
}

export async function POST(req: NextRequest) {
  if (!fs.existsSync(GALLERY_DIR)) {
    fs.mkdirSync(GALLERY_DIR, { recursive: true });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const label = (formData.get('label') as string) || '사진';

  if (!file) return NextResponse.json({ error: '파일 없음' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const id = Date.now();
  const filename = `${id}.${ext}`;

  fs.writeFileSync(path.join(GALLERY_DIR, filename), buffer);

  const meta = readMeta();
  meta.push({ id, filename, label });
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));

  return NextResponse.json({ ok: true, filename, label });
}

export async function DELETE(req: NextRequest) {
  const { id, filename } = await req.json();

  const imgPath = path.join(GALLERY_DIR, filename);
  if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);

  const meta = readMeta();
  const updated = meta.filter((m: { id: number }) => m.id !== id);
  fs.writeFileSync(META_FILE, JSON.stringify(updated, null, 2));

  return NextResponse.json({ ok: true });
}

export const config = { api: { bodyParser: false } };