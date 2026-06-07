'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { listBoard } from '@/lib/board';

interface GalleryItem { id: string; url: string; label: string; }

export default function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    listBoard<GalleryItem>('gallery', { limit: 60 })
      .then((items) => { if (alive) setPhotos(items); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <>
      <PageHeader label="Gallery" title="갤러리" description="금도검도관의 수련 모습을 담았습니다." />
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-[1200px] px-10">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-6 h-6 border-2 border-navy-900 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-[13px] text-gray-400">사진을 불러오는 중...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-[14px] mb-3">아직 등록된 사진이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((item) => (
                <div key={item.id} className="group cursor-pointer">
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={item.url}
                      alt={item.label}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
