import { useState, useEffect, useCallback } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/client';

export interface Comment {
  id: string;
  nickname: string;
  text: string;
}

const COL = 'videos';

// videos/{id}/comments
export function useVideoComments(videoId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const snap = await withTimeout(
        getDocs(query(collection(db, COL, videoId, 'comments'), orderBy('createdAt', 'asc'))),
        8000
      );
      setComments(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Comment, 'id'>) })));
    } catch {}
    setLoading(false);
  }, [videoId]);

  useEffect(() => { load(); }, [load]);

  const addComment = useCallback(async (nickname: string, text: string) => {
    const ref = await withTimeout(addDoc(collection(db, COL, videoId, 'comments'), {
      nickname, text, createdAt: serverTimestamp(),
    }), 30000);
    setComments(prev => {
      const next = [...prev, { id: ref.id, nickname, text }];
      updateDoc(doc(db, COL, videoId), { commentCount: next.length }).catch(() => {});
      return next;
    });
  }, [videoId]);

  const removeComment = useCallback(async (id: string) => {
    await withTimeout(deleteDoc(doc(db, COL, videoId, 'comments', id)), 30000);
    setComments(prev => {
      const next = prev.filter(c => c.id !== id);
      updateDoc(doc(db, COL, videoId), { commentCount: next.length }).catch(() => {});
      return next;
    });
  }, [videoId]);

  return { comments, loading, addComment, removeComment };
}
