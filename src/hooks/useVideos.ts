import { useState, useEffect, useCallback } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from 'firebase/storage';
import { db, app } from '@/lib/firebase';
import { withTimeout } from '@/lib/client';

export interface VideoItem {
  id: string;
  // 새 형식 (Firebase Storage 직접 업로드)
  url?: string;
  storagePath?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  // 구 형식 (YouTube URL) — 하위 호환
  videoId?: string;
  youtubeUrl?: string;
  // 공통
  title?: string;
  description?: string;
  nickname?: string;
  ip?: string;
  secret?: boolean;
  pwHash?: string;
}

let _cache: { data: VideoItem[]; ts: number } | null = null;
const FRESH_TTL = 30_000;
const STALE_TTL = 5 * 60_000;

async function fetchFromFirestore(): Promise<VideoItem[]> {
  console.log('[useVideos] Firestore 동영상 불러오기 시작');
  const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'), limit(30));
  const snap = await withTimeout(getDocs(q), 6000);
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() as Omit<VideoItem, 'id'> }));
  console.log('[useVideos] 불러오기 완료:', data.length, '개');
  return data;
}

export function useVideos() {
  const [videos, setVideos] = useState<VideoItem[]>(_cache?.data ?? []);
  const [loading, setLoading] = useState(_cache == null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = Date.now();
    const age = _cache ? now - _cache.ts : Infinity;

    if (_cache && age < STALE_TTL) {
      console.log('[useVideos] 캐시 히트:', _cache.data.length, '개, age', Math.round(age / 1000) + 's');
      setVideos(_cache.data);
      setLoading(false);

      if (age > FRESH_TTL) {
        fetchFromFirestore()
          .then(fresh => {
            if (fresh.length === 0 && _cache && _cache.data.length > 0) {
              console.warn('[useVideos] 백그라운드 갱신이 빈 결과 → 기존 유지');
              return;
            }
            _cache = { data: fresh, ts: Date.now() };
            setVideos(fresh);
          })
          .catch(e => console.warn('[useVideos] 백그라운드 갱신 실패:', e.message));
      }
    } else {
      setLoading(true);
      fetchFromFirestore()
        .then(data => {
          _cache = { data, ts: Date.now() };
          setVideos(data);
        })
        .catch(e => {
          console.error('[useVideos] fetch 실패:', e.message);
          if (_cache) setVideos(_cache.data);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const uploadVideo = useCallback(async (
    file: File,
    meta: { title: string; description?: string; nickname: string; ip: string; pwHash: string; }
  ): Promise<void> => {
    console.log('[useVideos] 업로드 시작:', file.name, (file.size / 1024 / 1024).toFixed(1) + 'MB', file.type);

    // 파일 크기 제한 (200MB)
    if (file.size > 200 * 1024 * 1024) {
      throw new Error('파일 크기가 너무 큽니다 (최대 200MB)');
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    const storage = getStorage(app);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `videos/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, storagePath);
    const task = uploadBytesResumable(storageRef, file);

    return new Promise<void>((resolve, reject) => {
      task.on(
        'state_changed',
        snap => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          console.log('[useVideos] 업로드 진행:', pct + '%');
          setProgress(pct);
        },
        err => {
          const isPermission =
            err.code === 'storage/unauthorized' ||
            err.message.includes('permission') ||
            err.message.includes('unauthorized');
          const msg = isPermission
            ? 'Firebase Storage 권한 없음 — Firebase Console → Storage → Rules에서 allow write: if true; 로 변경 필요'
            : '업로드 실패: ' + err.message;
          console.error('[useVideos] Storage 업로드 실패:', err.code, err.message);
          setError(msg);
          setUploading(false);
          reject(new Error(msg));
        },
        async () => {
          try {
            console.log('[useVideos] 업로드 완료, URL 획득 중...');
            const url = await getDownloadURL(task.snapshot.ref);
            console.log('[useVideos] downloadURL 획득 완료');

            console.log('[useVideos] Firestore 저장 중...');
            const docRef = await addDoc(collection(db, 'videos'), {
              url,
              storagePath,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              ...meta,
              createdAt: serverTimestamp(),
            });
            console.log('[useVideos] Firestore 저장 완료:', docRef.id);

            const newVideo: VideoItem = {
              id: docRef.id,
              url,
              storagePath,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              ...meta,
            };

            setVideos(prev => {
              const next = [newVideo, ...prev];
              _cache = { data: next, ts: Date.now() };
              return next;
            });
            setUploading(false);
            resolve();
          } catch (e) {
            const msg = '저장 실패: ' + (e as Error).message;
            console.error('[useVideos] 업로드 후 저장 실패:', (e as Error).message);
            setError(msg);
            setUploading(false);
            reject(new Error(msg));
          }
        }
      );
    });
  }, []);

  const deleteVideo = useCallback(async (video: VideoItem): Promise<void> => {
    console.log('[useVideos] 삭제 시작:', video.id);
    try {
      if (video.storagePath) {
        const storage = getStorage(app);
        await deleteObject(ref(storage, video.storagePath));
        console.log('[useVideos] Storage 삭제 완료');
      }
    } catch (e) {
      console.warn('[useVideos] Storage 삭제 실패 (Firestore 삭제 계속):', (e as Error).message);
    }
    await deleteDoc(doc(db, 'videos', video.id));
    console.log('[useVideos] Firestore 삭제 완료');
    setVideos(prev => {
      const next = prev.filter(v => v.id !== video.id);
      _cache = { data: next, ts: Date.now() };
      return next;
    });
  }, []);

  return { videos, loading, uploading, progress, error, uploadVideo, deleteVideo, setError };
}
