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
import { compressImage } from '@/lib/image';

export interface GalleryItem {
  id: string;
  url: string;
  storagePath?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  label?: string;
}

let _cache: { data: GalleryItem[]; ts: number } | null = null;
const FRESH_TTL = 30_000;
const STALE_TTL = 10 * 60_000;

async function fetchFromFirestore(): Promise<GalleryItem[]> {
  console.log('[useGallery] Firestore 갤러리 불러오기 시작');
  const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'), limit(20));
  const snap = await withTimeout(getDocs(q), 6000);
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() as Omit<GalleryItem, 'id'> }));
  console.log('[useGallery] 불러오기 완료:', data.length, '개');
  return data;
}

export function useGallery(initialItems?: GalleryItem[]) {
  const [items, setItems] = useState<GalleryItem[]>(() => {
    if (_cache) return _cache.data;
    return initialItems ?? [];
  });
  const [loading, setLoading] = useState(!_cache && !initialItems);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 서버에서 초기 데이터가 왔고 캐시가 없으면 캐시에 저장
    if (initialItems && !_cache) {
      _cache = { data: initialItems, ts: Date.now() };
      setItems(initialItems);
      return;
    }

    const now = Date.now();
    const age = _cache ? now - _cache.ts : Infinity;

    if (_cache && age < STALE_TTL) {
      console.log('[useGallery] 캐시 히트:', _cache.data.length, '개');
      setItems(_cache.data);
      setLoading(false);

      if (age > FRESH_TTL) {
        fetchFromFirestore()
          .then(fresh => {
            if (fresh.length === 0 && _cache && _cache.data.length > 0) return;
            _cache = { data: fresh, ts: Date.now() };
            setItems(fresh);
          })
          .catch(e => console.warn('[useGallery] 백그라운드 갱신 실패:', e.message));
      }
    } else if (!initialItems) {
      setLoading(true);
      fetchFromFirestore()
        .then(data => {
          _cache = { data, ts: Date.now() };
          setItems(data);
        })
        .catch(e => {
          console.error('[useGallery] fetch 실패:', e.message);
          if (_cache) setItems(_cache.data);
        })
        .finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const uploadImage = useCallback(async (file: File, label?: string): Promise<void> => {
    console.log('[useGallery] 업로드 시작:', file.name, (file.size / 1024 / 1024).toFixed(2) + 'MB', file.type);

    // 파일 크기 제한 (20MB)
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('파일 크기가 너무 큽니다 (최대 20MB)');
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    let compressed: File;
    try {
      console.log('[useGallery] 이미지 압축 중...');
      compressed = await compressImage(file, { maxSize: 1600, quality: 0.82 });
      console.log('[useGallery] 압축 완료:', (compressed.size / 1024).toFixed(0) + 'KB');
    } catch (e) {
      console.warn('[useGallery] 압축 실패, 원본 사용:', (e as Error).message);
      compressed = file;
    }

    const storage = getStorage(app);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `gallery/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, storagePath);
    const task = uploadBytesResumable(storageRef, compressed);

    return new Promise<void>((resolve, reject) => {
      task.on(
        'state_changed',
        snap => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          console.log('[useGallery] 업로드 진행:', pct + '%');
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
          console.error('[useGallery] Storage 업로드 실패:', err.code, err.message);
          setError(msg);
          setUploading(false);
          reject(new Error(msg));
        },
        async () => {
          try {
            console.log('[useGallery] 업로드 완료, URL 획득 중...');
            const url = await getDownloadURL(task.snapshot.ref);
            console.log('[useGallery] downloadURL 획득:', url.slice(0, 60) + '...');

            console.log('[useGallery] Firestore 저장 중...');
            const docRef = await addDoc(collection(db, 'gallery'), {
              url,
              storagePath,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              label: label?.trim() || '사진',
              createdAt: serverTimestamp(),
            });
            console.log('[useGallery] Firestore 저장 완료:', docRef.id);

            const newItem: GalleryItem = {
              id: docRef.id,
              url,
              storagePath,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              label: label?.trim() || '사진',
            };

            setItems(prev => {
              const next = [newItem, ...prev];
              _cache = { data: next, ts: Date.now() };
              return next;
            });
            setUploading(false);
            resolve();
          } catch (e) {
            const msg = '저장 실패: ' + (e as Error).message;
            console.error('[useGallery] 업로드 후 저장 실패:', (e as Error).message);
            setError(msg);
            setUploading(false);
            reject(new Error(msg));
          }
        }
      );
    });
  }, []);

  const deleteImage = useCallback(async (item: GalleryItem): Promise<void> => {
    console.log('[useGallery] 삭제 시작:', item.id, item.storagePath);
    try {
      if (item.storagePath) {
        const storage = getStorage(app);
        await deleteObject(ref(storage, item.storagePath));
        console.log('[useGallery] Storage 삭제 완료');
      }
    } catch (e) {
      // Storage 파일 없어도 Firestore는 삭제 진행
      console.warn('[useGallery] Storage 삭제 실패 (Firestore 삭제는 계속):', (e as Error).message);
    }
    await deleteDoc(doc(db, 'gallery', item.id));
    console.log('[useGallery] Firestore 삭제 완료');
    setItems(prev => {
      const next = prev.filter(i => i.id !== item.id);
      _cache = { data: next, ts: Date.now() };
      return next;
    });
  }, []);

  return { items, loading, uploading, progress, error, uploadImage, deleteImage, setError };
}
