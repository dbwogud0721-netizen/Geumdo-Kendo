import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

const isNew = getApps().length === 0;
export const app = isNew ? initializeApp(firebaseConfig) : getApp();

// 롱폴링 자동감지(프록시/방화벽 연결 hang 완화). 메모리 캐시(기본) — 영구캐시는
// 쓰기 promise 가 서버 ack 까지 대기하다 hang 하는 문제 있어 사용 안 함.
export const db = isNew
  ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
  : getFirestore(app);
