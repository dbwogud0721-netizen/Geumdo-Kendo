'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PageHeader from '@/components/PageHeader';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { NOTICES as STATIC_NOTICES } from '@/lib/data';

interface Notice {
  id: string;
  category: string;
  title: string;
  date: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  공지: 'bg-navy-900 text-white',
  안내: 'bg-[#5c7a8a] text-white',
  갤러리: 'bg-[#7a8a5c] text-white',
  행사: 'bg-[#8a6a5c] text-white',
};

export default function NoticePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        setNotices(STATIC_NOTICES.map((n, i) => ({ ...n, id: String(i) })));
        setLoading(false);
      }
    }, 6000);

    getDocs(query(collection(db, 'notices'), orderBy('createdAt', 'desc')))
      .then((snap) => {
        if (!settled) {
          const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Notice, 'id'>) }));
          setNotices(data.length > 0 ? data : STATIC_NOTICES.map((n, i) => ({ ...n, id: String(i) })));
        }
      })
      .catch(() => {
        if (!settled) setNotices(STATIC_NOTICES.map((n, i) => ({ ...n, id: String(i) })));
      })
      .finally(() => {
        clearTimeout(timer);
        if (!settled) { settled = true; setLoading(false); }
      });

    return () => { settled = true; clearTimeout(timer); };
  }, []);

  return (
    <>
      <PageHeader label="Notice" title="공지사항" description="금도검도관 공지 및 안내사항을 확인하세요." />

      <section className="py-14 bg-white">
        <div className="mx-auto max-w-4xl px-6">

          {/* 글쓰기 버튼 (로그인한 사용자) */}
          {user && (
            <div className="flex justify-end mb-4">
              <Link
                href="/admin"
                className="text-[13px] text-white bg-navy-900 px-4 py-2 hover:bg-navy-700 transition-colors"
              >
                + 공지 올리기
              </Link>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-[13px] text-gray-400">불러오는 중...</p>
            </div>
          ) : (
            <div className="border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 px-5 py-3 text-xs font-semibold text-gray-500">
                <span className="col-span-1 text-center">번호</span>
                <span className="col-span-2 text-center">분류</span>
                <span className="col-span-6">제목</span>
                <span className="col-span-3 text-right">날짜</span>
              </div>

              {notices.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-gray-400">등록된 공지사항이 없습니다.</div>
              ) : notices.map((item, i) => (
                <div
                  key={item.id}
                  className={`grid grid-cols-12 items-center px-5 py-4 hover:bg-gray-50 transition-colors ${
                    i !== notices.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <span className="col-span-1 text-xs text-gray-400 text-center">{notices.length - i}</span>
                  <span className="col-span-2 flex justify-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 ${CATEGORY_STYLES[item.category] ?? 'bg-gray-200 text-gray-700'}`}>
                      {item.category}
                    </span>
                  </span>
                  <span className="col-span-6 text-[13px] text-gray-700">{item.title}</span>
                  <span className="col-span-3 text-[11px] text-gray-400 text-right">{item.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}