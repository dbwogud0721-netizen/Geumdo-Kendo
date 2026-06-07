import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore, getFirestore,
  persistentLocalCache, persistentSingleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

const isNew = getApps().length === 0;
const app = isNew ? initializeApp(firebaseConfig) : getApp();

// 강제 롱폴링(WebSocket 프로브 생략 → 2~3초 단축) + 단일탭 캐시(초기화 경량).
export const db = isNew
  ? initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
    })
  : getFirestore(app);
