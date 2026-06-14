import { useState, useEffect, useCallback } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, increment,
  query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/client';

export interface Post {
  id: string;
  category: string;
  title: string;
  content: string;
  nickname: string;
  ip: string;
  secret: boolean;
  pwHash: string;
  date?: string;
  likes?: number;
  commentCount?: number;
}

const COL = 'community';
let _cache: { data: Post[]; ts: number } | null = null;
const FRESH_TTL = 30_000;
const STALE_TTL = 5 * 60_000;

async function fetchFromFirestore(): Promise<Post[]> {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'), limit(30));
  const snap = await withTimeout(getDocs(q), 6000);
  return snap.docs.map(d => ({ id: d.id, ...d.data() as Omit<Post, 'id'> }));
}

export function useCommunity(initialItems?: Post[]) {
  const [posts, setPosts] = useState<Post[]>(_cache?.data ?? initialItems ?? []);
  const [loading, setLoading] = useState(_cache == null && !initialItems);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialItems && !_cache) {
      _cache = { data: initialItems, ts: Date.now() };
      setPosts(initialItems);
      return;
    }
    const age = _cache ? Date.now() - _cache.ts : Infinity;
    if (_cache && age < STALE_TTL) {
      setPosts(_cache.data);
      setLoading(false);
      if (age > FRESH_TTL) {
        fetchFromFirestore()
          .then(fresh => {
            if (fresh.length === 0 && _cache && _cache.data.length > 0) return;
            _cache = { data: fresh, ts: Date.now() };
            setPosts(fresh);
          })
          .catch(() => {});
      }
    } else if (!initialItems) {
      setLoading(true);
      setError(null);
      fetchFromFirestore()
        .then(data => { _cache = { data, ts: Date.now() }; setPosts(data); })
        .catch(e => { setError(e.message); if (_cache) setPosts(_cache.data); })
        .finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addPost = useCallback(async (data: Omit<Post, 'id'>) => {
    const tempId = `temp-${Date.now()}`;
    setPosts(prev => [{ id: tempId, ...data }, ...prev]);
    try {
      const ref = await withTimeout(addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() }), 30000);
      setPosts(prev => {
        const next = prev.map(p => p.id === tempId ? { ...p, id: ref.id } : p);
        _cache = { data: next, ts: Date.now() };
        return next;
      });
      return ref.id;
    } catch (e) {
      setPosts(prev => prev.filter(p => p.id !== tempId));
      throw e;
    }
  }, []);

  const deletePost = useCallback(async (id: string) => {
    await withTimeout(deleteDoc(doc(db, COL, id)), 30000);
    setPosts(prev => {
      const next = prev.filter(p => p.id !== id);
      _cache = { data: next, ts: Date.now() };
      return next;
    });
  }, []);

  const likePost = useCallback(async (id: string) => {
    setPosts(prev => {
      const next = prev.map(p => p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p);
      _cache = { data: next, ts: Date.now() };
      return next;
    });
    try { await withTimeout(updateDoc(doc(db, COL, id), { likes: increment(1) }), 30000); }
    catch (e) { console.warn('[useCommunity] 좋아요 실패:', (e as Error).message); }
  }, []);

  return { posts, loading, error, addPost, deletePost, likePost };
}
