import 'server-only';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// 서버 전용 Firebase Admin. 서비스 계정 자격증명으로 Firestore에 full 접근.
// 클라이언트 규칙은 deny-all로 잠그고, 모든 읽기/쓰기는 이 SDK(서버)로만 수행.
let cached: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (cached) return cached;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Vercel 환경변수에 \n 이 literal로 들어가므로 실제 줄바꿈으로 복원.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin 환경변수 미설정: FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY'
    );
  }

  const app = getApps().length === 0
    ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
    : getApp();

  cached = getFirestore(app);
  return cached;
}

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
