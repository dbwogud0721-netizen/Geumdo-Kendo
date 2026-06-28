'use client';

import { ADDRESS, CONTACT } from '@/lib/data';

export default function LocationSection() {
  return (
    <section id="location" className="bg-white border-t border-gray-100" style={{ padding: '40px 0' }}>
      <div className="mx-auto max-w-[1200px] px-5 md:px-10">

        {/* Mobile: stacked */}
        <div className="block md:hidden space-y-6">
          <AddressCol />
          <div className="border border-gray-200 overflow-hidden" style={{ height: 200 }}>
            <MapImage />
          </div>
          <ContactCol />
        </div>

        {/* PC: 3-column (260px | 1fr | 300px) */}
        <div
          className="hidden md:grid"
          style={{ gridTemplateColumns: '260px 1fr 300px', gap: 40, alignItems: 'start' }}
        >
          <AddressCol />
          <div className="border border-gray-200 overflow-hidden" style={{ minHeight: 200 }}>
            <MapImage />
          </div>
          <ContactCol />
        </div>

      </div>
    </section>
  );
}

function MapImage() {
  const q = encodeURIComponent('서울 노원구 공릉로58길 127');
  return (
    <iframe
      title="금도검도관 위치"
      src={`https://maps.google.com/maps?q=${q}&z=16&hl=ko&output=embed`}
      className="w-full"
      style={{ border: 0, display: 'block', height: '100%', minHeight: 200 }}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}

function AddressCol() {
  return (
    <div>
      <h3 className="text-[15px] font-bold text-navy-900 border-b border-gray-200 pb-2.5 mb-4">오시는 길</h3>
      <div className="flex items-start gap-2.5 mb-5">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
          className="w-4 h-4 shrink-0 mt-0.5 text-gold-500">
          <path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z" />
          <circle cx="10" cy="8" r="2" />
        </svg>
        <div>
          <p className="text-[13.5px] font-medium text-gray-800">{ADDRESS.jibun}</p>
          <p className="mt-0.5 text-[12px] text-gray-500 leading-relaxed">{ADDRESS.road}</p>
        </div>
      </div>
      <a
        href={ADDRESS.mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium border border-navy-900 text-navy-900 px-4 py-2 hover:bg-navy-900 hover:text-white transition-colors"
      >
        네이버 지도 보기
        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 10L10 2M10 2H5M10 2v5" />
        </svg>
      </a>
    </div>
  );
}

function ContactCol() {
  return (
    <div>
      <h3 className="text-[15px] font-bold text-navy-900 border-b border-gray-200 pb-2.5 mb-4">문의 안내</h3>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="w-4 h-4 shrink-0 mt-0.5 text-gold-500">
            <path d="M2 3a2 2 0 012-2h2.153l.553 3.5L5.29 5.918A15.3 15.3 0 0014.08 14.71l1.418-1.416 3.5.553V16a2 2 0 01-2 2A17 17 0 012 3z" />
          </svg>
          <div>
            <p className="text-[11px] text-gray-400 mb-0.5">전화</p>
            <p className="text-[13.5px] font-medium text-gray-800">{CONTACT.phone}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="w-4 h-4 shrink-0 mt-0.5 text-gold-500">
            <rect x="5" y="1" width="10" height="18" rx="2" />
            <circle cx="10" cy="16" r="0.8" fill="currentColor" stroke="none" />
          </svg>
          <div>
            <p className="text-[11px] text-gray-400 mb-0.5">관장님 연락처</p>
            <p className="text-[13.5px] font-medium text-gray-800">{CONTACT.mobile}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="w-4 h-4 shrink-0 mt-0.5 text-gold-500">
            <circle cx="10" cy="10" r="8" />
            <path d="M10 5v5l3 3" />
          </svg>
          <div>
            <p className="text-[11px] text-gray-400 mb-1">운영시간</p>
            {CONTACT.hours.map((h) => (
              <p key={h} className="text-[13px] text-gray-700">{h}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}