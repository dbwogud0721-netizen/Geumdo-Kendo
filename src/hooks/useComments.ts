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

// 공지 하위 댓글 (notices/{id}/comments). community 전용.
export function useComments(noticeId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const snap = await withTimeout(
        getDocs(query(collection(db, 'notices', noticeId, 'comments'), orderBy('createdAt', 'asc'))),
        8000
      );
      setComments(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Comment, 'id'>) })));
    } catch {}
    setLoading(false);
  }, [noticeId]);

  useEffect(() => { load(); }, [load]);

  const addComment = useCallback(async (nickname: string, text: string) => {
    const ref = await withTimeout(addDoc(collection(db, 'notices', noticeId, 'comments'), {
      nickname, text, createdAt: serverTimestamp(),
    }), 30000);
    setComments(prev => [...prev, { id: ref.id, nickname, text }]);
    // 목록 미리보기용 댓글 수 (부모 공지에 저장)
    updateDoc(doc(db, 'notices', noticeId), { commentCount: increment(1) }).catch(() => {});
  }, [noticeId]);

  const removeComment = useCallback(async (id: string) => {
    await withTimeout(deleteDoc(doc(db, 'notices', noticeId, 'comments', id)), 30000);
    setComments(prev => prev.filter(c => c.id !== id));
    updateDoc(doc(db, 'notices', noticeId), { commentCount: increment(-1) }).catch(() => {});
  }, [noticeId]);

  return { comments, loading, addComment, removeComment };
}
