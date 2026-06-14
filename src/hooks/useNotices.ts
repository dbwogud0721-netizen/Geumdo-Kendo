import { useState, useEffect, useCallback } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/client';

export interface Notice {
  id: string;
  category: string;
  title: string;
  content: string;
  nickname: string;
  ip: string;
  secret: boolean;
  pwHash: string;
  date?: string;
}

// ── Module-level cache (SWR pattern) ────────────────────────────────────────
// FRESH: 재요청 없음  STALE: 백그라운드 갱신  초과: 전체 fetch
let _cache: { data: Notice[]; ts: number } | null = null;
const FRESH_TTL = 30_000;
const STALE_TTL = 5 * 60_000;

async function fetchFromFirestore(): Promise<Notice[]> {
  console.log('[useNotices] Firestore에서 목록 불러오기 시작');
  const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(30));
  const snap = await withTimeout(getDocs(q), 6000);
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() as Omit<Notice, 'id'> }));
  console.log('[useNotices] 불러오기 완료:', data.length, '개');
  return data;
}

export function useNotices(initialItems?: Notice[]) {
  const [notices, setNotices] = useState<Notice[]>(_cache?.data ?? initialItems ?? []);
  const [loading, setLoading] = useState(_cache == null && !initialItems);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialItems && !_cache) {
      _cache = { data: initialItems, ts: Date.now() };
      setNotices(initialItems);
      return;
    }
    const now = Date.now();
    const age = _cache ? now - _cache.ts : Infinity;

    if (_cache && age < STALE_TTL) {
      console.log('[useNotices] 캐시 히트:', _cache.data.length, '개, age', Math.round(age / 1000) + 's');
      setNotices(_cache.data);
      setLoading(false);

      if (age > FRESH_TTL) {
        console.log('[useNotices] 캐시 낡음 → 백그라운드 갱신');
        fetchFromFirestore()
          .then(fresh => {
            if (fresh.length === 0 && _cache && _cache.data.length > 0) {
              console.warn('[useNotices] 백그라운드 갱신이 빈 결과 → 기존', _cache.data.length, '개 유지');
              return;
            }
            _cache = { data: fresh, ts: Date.now() };
            setNotices(fresh);
            console.log('[useNotices] 백그라운드 갱신 완료:', fresh.length, '개');
          })
          .catch(e => console.warn('[useNotices] 백그라운드 갱신 실패 (캐시 유지):', e.message));
      }
    } else {
      console.log('[useNotices] 전체 fetch (캐시', _cache ? '만료' : '없음', ')');
      setLoading(true);
      setError(null);
      fetchFromFirestore()
        .then(data => {
          _cache = { data, ts: Date.now() };
          setNotices(data);
          console.log('[useNotices] fetch 성공:', data.length, '개');
        })
        .catch(e => {
          console.error('[useNotices] fetch 실패:', e.message);
          setError(e.message);
          if (_cache) {
            console.log('[useNotices] 만료 캐시로 복구:', _cache.data.length, '개');
            setNotices(_cache.data);
          }
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const addNotice = useCallback(async (data: Omit<Notice, 'id'>) => {
    const tempId = `temp-${Date.now()}`;

    // 즉시 화면 반영 (optimistic)
    setNotices(prev => [{ id: tempId, ...data }, ...prev]);
    console.log('[useNotices] 작성 시작:', data.title);

    try {
      const docRef = await withTimeout(addDoc(collection(db, 'notices'), {
        ...data,
        createdAt: serverTimestamp(),
      }), 30000);
      const newId = docRef.id;
      console.log('[useNotices] Firestore 저장 성공:', newId);

      // temp → real ID
      setNotices(prev => {
        const next = prev.map(n => n.id === tempId ? { ...n, id: newId } : n);
        _cache = { data: next, ts: Date.now() };
        console.log('[useNotices] 캐시 갱신, 총', next.length, '개');
        return next;
      });
      return newId;
    } catch (e) {
      console.error('[useNotices] Firestore 저장 실패:', (e as Error).message);
      setNotices(prev => prev.filter(n => n.id !== tempId));
      throw e;
    }
  }, []);

  const deleteNotice = useCallback(async (id: string) => {
    console.log('[useNotices] 삭제 시작:', id);
    await withTimeout(deleteDoc(doc(db, 'notices', id)), 30000);
    console.log('[useNotices] 삭제 완료:', id);
    setNotices(prev => {
      const next = prev.filter(n => n.id !== id);
      _cache = { data: next, ts: Date.now() };
      return next;
    });
  }, []);

  return { notices, loading, error, addNotice, deleteNotice };
}
