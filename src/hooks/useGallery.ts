import { useState, useEffect, useCallback } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/client';
import { compressImage } from '@/lib/image';
import { uploadToCloudinary } from '@/lib/cloudinary';

export interface GalleryItem {
  id: string;
  url: string;
  storagePath?: string; // Cloudinary public_id
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  label?: string;
}

let _cache: { data: GalleryItem[]; ts: number } | null = null;
const FRESH_TTL = 30_000;
const STALE_TTL = 10 * 60_000;

async function fetchFromFirestore(): Promise<GalleryItem[]> {
  const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'), limit(20));
  const snap = await withTimeout(getDocs(q), 6000);
  return snap.docs.map(d => ({ id: d.id, ...d.data() as Omit<GalleryItem, 'id'> }));
}

export function useGallery(initialItems?: GalleryItem[]) {
  const [items, setItems] = useState<GalleryItem[]>(() => _cache?.data ?? initialItems ?? []);
  const [loading, setLoading] = useState(!_cache && !initialItems);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialItems && !_cache) {
      _cache = { data: initialItems, ts: Date.now() };
      setItems(initialItems);
      return;
    }
    const age = _cache ? Date.now() - _cache.ts : Infinity;
    if (_cache && age < STALE_TTL) {
      setItems(_cache.data);
      setLoading(false);
      if (age > FRESH_TTL) {
        fetchFromFirestore()
          .then(fresh => {
            if (fresh.length === 0 && _cache && _cache.data.length > 0) return;
            _cache = { data: fresh, ts: Date.now() };
            setItems(fresh);
          })
          .catch(() => {});
      }
    } else if (!initialItems) {
      setLoading(true);
      fetchFromFirestore()
        .then(data => { _cache = { data, ts: Date.now() }; setItems(data); })
        .catch(e => { if (_cache) setItems(_cache.data); console.error('[useGallery] fetch 실패:', e.message); })
        .finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const uploadImage = useCallback(async (file: File, label?: string): Promise<void> => {
    if (file.size > 25 * 1024 * 1024) throw new Error('파일이 너무 큽니다 (최대 25MB)');

    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      // 압축 (HEIC 등 canvas 미지원 포맷은 원본 사용)
      let compressed = file;
      try {
        compressed = await compressImage(file, { maxSize: 1600, quality: 0.82 });
        console.log('[useGallery] 압축:', (file.size / 1024).toFixed(0) + 'KB →', (compressed.size / 1024).toFixed(0) + 'KB');
      } catch { compressed = file; }

      const { url, publicId } = await uploadToCloudinary(compressed, setProgress);

      // Firestore 저장에도 타임아웃 (연결 hang 시 무한 대기 방지)
      const docRef = await withTimeout(addDoc(collection(db, 'gallery'), {
        url,
        storagePath: publicId,
        fileName: file.name,
        fileType: compressed.type || file.type,
        fileSize: compressed.size,
        label: label?.trim() || '사진',
        createdAt: serverTimestamp(),
      }), 15000);

      const newItem: GalleryItem = {
        id: docRef.id, url, storagePath: publicId,
        fileName: file.name, fileType: compressed.type, fileSize: compressed.size,
        label: label?.trim() || '사진',
      };
      setItems(prev => {
        const next = [newItem, ...prev];
        _cache = { data: next, ts: Date.now() };
        return next;
      });
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setUploading(false);
    }
  }, []);

  const deleteImage = useCallback(async (item: GalleryItem): Promise<void> => {
    // Cloudinary 원본은 무료 보관소에 남음(서명 삭제 필요). 목록(Firestore)에서만 제거.
    await deleteDoc(doc(db, 'gallery', item.id));
    setItems(prev => {
      const next = prev.filter(i => i.id !== item.id);
      _cache = { data: next, ts: Date.now() };
      return next;
    });
  }, []);

  return { items, loading, uploading, progress, error, uploadImage, deleteImage, setError };
}
