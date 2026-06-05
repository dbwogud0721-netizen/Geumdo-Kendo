'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PageHeader from '@/components/PageHeader';
import Link from 'next/link';

interface GalleryItem { id: string; url: string; label: string; }

export default function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const snap = await getDocs(query(collection(db, 'gallery'), orderBy('createdAt', 'desc')));
        setPhotos(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryItem, 'id'>) })));
      } catch {}
      setLoading(false);
    }
    fetchGallery();
  }, []);

  return (
    <>
      <PageHeader label="Gallery" title="갤러리" description="금도검도관의 수련 모습을 담았습니다." />
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-[1200px] px-10">
          {loading ? (
            <div className="py-20 text-center text-[13px] text-gray-400">로딩 중...</div>
          ) : photos.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-[14px] mb-3">아직 등록된 사진이 없습니다.</p>
              <Link href="/admin" className="text-[13px] text-navy-900 underline">
                관리자 패널에서 사진을 업로드하세요
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((item) => (
                <div key={item.id} className="group cursor-pointer">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="mt-1.5 text-[12px] text-gray-600">{item.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}