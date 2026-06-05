import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'public/data/notices.json');

function readNotices() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
}

export async function GET() {
  return NextResponse.json(readNotices());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const notices = readNotices();
  const newNotice = {
    id: Date.now(),
    category: body.category || '공지',
    title: body.title,
    date: body.date,
  };
  const updated = [newNotice, ...notices];
  fs.writeFileSync(FILE, JSON.stringify(updated, null, 2));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const notices = readNotices();
  const updated = notices.filter((n: { id: number }) => n.id !== id);
  fs.writeFileSync(FILE, JSON.stringify(updated, null, 2));
  return NextResponse.json({ ok: true });
}