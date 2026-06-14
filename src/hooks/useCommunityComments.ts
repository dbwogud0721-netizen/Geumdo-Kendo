import { useState, useEffect, useCallback } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, increment,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/client';

export interface Comment {
  id: string;
  nickname: string;
  text: string;
}

const COL = 'community';

// community/{id}/comments
export function useCommunityComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const snap = await withTimeout(
        getDocs(query(collection(db, COL, postId, 'comments'), orderBy('createdAt', 'asc'))),
        8000
      );
      setComments(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Comment, 'id'>) })));
    } catch {}
    setLoading(false);
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const addComment = useCallback(async (nickname: string, text: string) => {
    const ref = await withTimeout(addDoc(collection(db, COL, postId, 'comments'), {
      nickname, text, createdAt: serverTimestamp(),
    }), 30000);
    setComments(prev => [...prev, { id: ref.id, nickname, text }]);
    updateDoc(doc(db, COL, postId), { commentCount: increment(1) }).catch(() => {});
  }, [postId]);

  const removeComment = useCallback(async (id: string) => {
    await withTimeout(deleteDoc(doc(db, COL, postId, 'comments', id)), 30000);
    setComments(prev => prev.filter(c => c.id !== id));
    updateDoc(doc(db, COL, postId), { commentCount: increment(-1) }).catch(() => {});
  }, [postId]);

  return { comments, loading, addComment, removeComment };
}
