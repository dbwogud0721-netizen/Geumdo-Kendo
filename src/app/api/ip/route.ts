import { NextRequest, NextResponse } from 'next/server';

// 클라이언트 IP 반환. Vercel은 x-forwarded-for 헤더로 실제 IP 전달.
export async function GET(req: NextRequest) {
  const fwd = req.headers.get('x-forwarded-for');
  const ip = fwd ? fwd.split(',')[0].trim() : (req.headers.get('x-real-ip') || 'unknown');
  return NextResponse.json({ ip });
}
