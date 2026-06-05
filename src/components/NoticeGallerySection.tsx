'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NOTICES } from '@/lib/data';

interface Notice { id: string; category: string; title: string; date: string; }
interface GalleryItem { id: string; url: string; label: string; }

const CATEGORY_COLORS: Record<string, string> = {
  공지: 'bg-navy-900 text-white',
  안내: 'bg-[#5b7a8c] text-white',
  갤러리: 'bg-[#6a7a5a] text-white',
  행사: 'bg-[#7a6a3a] text-white',
};

const STATIC_NOTICES = NOTICES.map((n, i) => ({ ...n, id: String(i) }));

export default function NoticeGallerySection() {
  const [notices, setNotices] = useState<Notice[]>(STATIC_NOTICES);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  useEffect(() => {
    async function fetchData() {
      try {
        const [nSnap, gSnap] = await Promise.all([
          getDocs(query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(5))),
          getDocs(query(collection(db, 'gallery'), orderBy('createdAt', 'desc'), limit(3))),
        ]);
        if (!nSnap.empty) {
          setNotices(nSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Notice, 'id'>) })));
        }
        if (!gSnap.empty) {
          setGallery(gSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryItem, 'id'>) })));
        }
      } catch {}
    }
    fetchData();
  }, []);

  const hasPhotos = gallery.length > 0;

  return (
    <section className="bg-white border-t border-gray-100" style={{ padding: '40px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>

        {/* Mobile */}
        <div className="block md:hidden">
          <div className="mb-10">
            <NoticeHeader />
            <NoticeList notices={notices} />
          </div>
          <div>
            <GalleryHeader />
            {hasPhotos
              ? <RealGallery items={gallery} />
              : <PlaceholderGallery />}
          </div>
        </div>

        {/* PC: 1fr 1fr */}
        <div className="hidden md:grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div>
            <NoticeHeader />
            <NoticeList notices={notices} />
          </div>
          <div>
            <GalleryHeader />
            {hasPhotos
              ? <RealGallery items={gallery} />
              : <PlaceholderGallery />}
          </div>
        </div>

      </div>
    </section>
  );
}

function NoticeHeader() {
  return (
    <div className="flex justify-between items-center border-b border-gray-200 pb-2.5 mb-0">
      <h2 className="text-[15px] font-bold text-navy-900">공지사항</h2>
      <Link href="/community" className="text-[11px] text-gray-400 hover:text-navy-900 transition-colors">더보기 &rsaquo;</Link>
    </div>
  );
}

function GalleryHeader() {
  return (
    <div className="flex justify-between items-center border-b border-gray-200 pb-2.5 mb-3">
      <h2 className="text-[15px] font-bold text-navy-900">갤러리</h2>
      <Link href="/gallery" className="text-[11px] text-gray-400 hover:text-navy-900 transition-colors">더보기 &rsaquo;</Link>
    </div>
  );
}

function NoticeList({ notices }: { notices: Notice[] }) {
  return (
    <>
      {notices.map((item, i) => (
        <div
          key={item.id}
          className={`flex items-center justify-between gap-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${i < notices.length - 1 ? 'border-b border-gray-100' : ''}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-[10px] font-semibold px-2 py-0.5 shrink-0 ${CATEGORY_COLORS[item.category] ?? 'bg-gray-200 text-gray-700'}`}>
              {item.category}
            </span>
            <span className="text-[13px] text-gray-700 truncate">{item.title}</span>
          </div>
          <span className="text-[11px] text-gray-400 shrink-0 ml-2">{item.date}</span>
        </div>
      ))}
    </>
  );
}

function RealGallery({ items }: { items: GalleryItem[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {items.map((item) => (
        <Link href="/gallery" key={item.id} className="block group">
          <div className="overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <img src={item.url} alt={item.label}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <p className="mt-1.5 text-[10.5px] text-center text-gray-500">{item.label}</p>
        </Link>
      ))}
    </div>
  );
}

function PlaceholderGallery() {
  const items = [{ label: '수련 모습' }, { label: '도장 내부' }, { label: '예절 교육' }];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {items.map((item, i) => (
        <Link href="/gallery" key={i} className="block group">
          <div
            className={`overflow-hidden group-hover:brightness-110 transition-all ${
              i === 0 ? 'bg-gradient-to-br from-slate-600 to-slate-900'
              : i === 1 ? 'bg-gradient-to-br from-[#1a2232] to-[#0c1422]'
              : 'bg-gradient-to-br from-slate-700 to-[#181826]'
            }`}
            style={{ aspectRatio: '4/3' }}
          />
          <p className="mt-1.5 text-[10.5px] text-center text-gray-500">{item.label}</p>
        </Link>
      ))}
    </div>
  );
}