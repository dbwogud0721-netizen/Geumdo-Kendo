import { DIRECTOR } from '@/lib/data';

const PHILOSOPHY = [
  '기본기와 안전을 바탕으로 차근차근 지도',
  '아이부터 성인까지 각자의 속도에 맞춘 수련',
  '부담 없이 오래 즐길 수 있는 편안한 분위기',
];

export default function DirectorSection() {
  return (
    <section className="bg-white" style={{ padding: '40px 0' }}>
      <div className="mx-auto max-w-[1200px] px-5 md:px-10">

        {/* Mobile */}
        <div className="block md:hidden border border-gray-200 overflow-hidden">
          <div className="bg-[#0a0a10] overflow-hidden" style={{ height: 200 }}>
            <img
              src="/director.jpg"
              alt="금도검도관 관장"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="p-5 border-t border-gray-200 bg-white">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-400 mb-1">Philosophy</p>
            <p className="text-[11px] text-gray-400 mb-1">지도 철학</p>
            <h3 className="text-[17px] font-bold text-navy-900 mb-4">금도검도관이 추구하는 수련</h3>
            <ul className="flex flex-col gap-2">
              {PHILOSOPHY.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-navy-900 shrink-0" />
                  <span className="text-[13px] text-gray-700">{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5 bg-navy-50 border-t border-gray-200">
            {DIRECTOR.intro.split('\n').map((line, i) => (
              <p key={i} className="text-[13px] leading-[2] text-gray-600">{line}</p>
            ))}
          </div>
        </div>

        {/* PC: 3-column grid (300px | 1fr | 1.2fr) */}
        <div
          className="hidden md:grid border border-gray-200 overflow-hidden"
          style={{ gridTemplateColumns: '300px 1fr 1.2fr', minHeight: 260 }}
        >
          <div className="bg-[#0a0a10] overflow-hidden">
            <img
              src="/director.jpg"
              alt="금도검도관 관장"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block', minHeight: 260 }}
            />
          </div>
          <div className="bg-white" style={{ padding: '28px', borderLeft: '1px solid #e5e7eb' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-400 mb-1">Philosophy</p>
            <p className="text-[12px] text-gray-400 mb-1">지도 철학</p>
            <h3 className="text-[19px] font-bold text-navy-900 mb-6">금도검도관이 추구하는 수련</h3>
            <ul className="flex flex-col gap-3">
              {PHILOSOPHY.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-navy-900 shrink-0" />
                  <span className="text-[13px] text-gray-700">{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-navy-50" style={{ padding: '28px', borderLeft: '1px solid #e5e7eb' }}>
            {DIRECTOR.intro.split('\n').map((line, i) => (
              <p key={i} className="text-[13px] leading-[2] text-gray-600">{line}</p>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}