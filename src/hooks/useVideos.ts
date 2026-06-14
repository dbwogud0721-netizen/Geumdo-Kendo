import { useState, useEffect, useCallback } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/client';
import { uploadToCloudinary } from '@/lib/cloudinary';

export interface VideoItem {
  id: string;
  // Cloudinary 직접 업로드
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
  const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'), limit(30));
  const snap = await withTimeout(getDocs(q), 6000);
  return snap.docs.map(d => ({ id: d.id, ...d.data() as Omit<VideoItem, 'id'> }));
}

export function useVideos(initialItems?: VideoItem[]) {
  const [videos, setVideos] = useState<VideoItem[]>(() => _cache?.data ?? initialItems ?? []);
  const [loading, setLoading] = useState(!_cache && !initialItems);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialItems && !_cache) {
      _cache = { data: initialItems, ts: Date.now() };
      setVideos(initialItems);
      return;
    }
    const age = _cache ? Date.now() - _cache.ts : Infinity;
    if (_cache && age < STALE_TTL) {
      setVideos(_cache.data);
      setLoading(false);
      if (age > FRESH_TTL) {
        fetchFromFirestore()
          .then(fresh => {
            if (fresh.length === 0 && _cache && _cache.data.length > 0) return;
            _cache = { data: fresh, ts: Date.now() };
            setVideos(fresh);
          })
          .catch(() => {});
      }
    } else if (!initialItems) {
      setLoading(true);
      fetchFromFirestore()
        .then(data => { _cache = { data, ts: Date.now() }; setVideos(data); })
        .catch(e => { if (_cache) setVideos(_cache.data); console.error('[useVideos] fetch 실패:', e.message); })
        .finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const uploadVideo = useCallback(async (
    file: File,
    meta: { title: string; description?: string; nickname: string; ip: string; pwHash: string; }
  ): Promise<void> => {
    if (file.size > 100 * 1024 * 1024) throw new Error('파일이 너무 큽니다 (최대 100MB)');

    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      const { url, publicId } = await uploadToCloudinary(file, setProgress);

      const docRef = await withTimeout(addDoc(collection(db, 'videos'), {
        url,
        storagePath: publicId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        ...meta,
        createdAt: serverTimestamp(),
      }), 30000);
      const id = docRef.id;

      const newVideo: VideoItem = {
        id, url, storagePath: publicId,
        fileName: file.name, fileType: file.type, fileSize: file.size, ...meta,
      };
      setVideos(prev => {
        const next = [newVideo, ...prev];
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

  // YouTube 링크 등록 (파일 업로드 없음, 용량 무제한)
  const addYoutube = useCallback(async (meta: {
    videoId: string; youtubeUrl: string; title: string; description?: string; nickname: string; ip: string;
  }): Promise<void> => {
    const docRef = await withTimeout(addDoc(collection(db, 'videos'), {
      videoId: meta.videoId,
      youtubeUrl: meta.youtubeUrl,
      title: meta.title,
      description: meta.description || '',
      nickname: meta.nickname,
      ip: meta.ip,
      secret: false,
      pwHash: '',
      createdAt: serverTimestamp(),
    }), 30000);
    setVideos(prev => {
      const next = [{ id: docRef.id, secret: false, pwHash: '', ...meta }, ...prev];
      _cache = { data: next, ts: Date.now() };
      return next;
    });
  }, []);

  const deleteVideo = useCallback(async (video: VideoItem): Promise<void> => {
    await withTimeout(deleteDoc(doc(db, 'videos', video.id)), 30000);
    setVideos(prev => {
      const next = prev.filter(v => v.id !== video.id);
      _cache = { data: next, ts: Date.now() };
      return next;
    });
  }, []);

  return { videos, loading, uploading, progress, error, uploadVideo, addYoutube, deleteVideo, setError };
}
