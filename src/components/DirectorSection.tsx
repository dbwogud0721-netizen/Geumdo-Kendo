import { DIRECTOR } from '@/lib/data';

export default function DirectorSection() {
  return (
    <section className="bg-white" style={{ padding: '40px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>

        {/* Mobile: stacked */}
        <div className="block md:hidden border border-gray-200 overflow-hidden">
          <div className="bg-[#0a0a10] overflow-hidden" style={{ height: 220 }}>
            <img
              src="/director.jpg"
              alt="금도검도관 관장"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="p-6 border-t border-gray-200 bg-white">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-400 mb-1">Director</p>
            <p className="text-[12px] text-gray-400 mb-1">관장 소개</p>
            <h3 className="text-[18px] font-bold text-navy-900 mb-5">{DIRECTOR.name}</h3>
            <ul className="flex flex-col gap-2.5">
              {DIRECTOR.credentials.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-navy-900 shrink-0" />
                  <span className="text-[13px] text-gray-700">{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 bg-navy-50 border-t border-gray-200">
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
          {/* Col 1: Photo */}
          <div className="bg-[#0a0a10] overflow-hidden">
            <img
              src="/director.jpg"
              alt="금도검도관 관장"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block', minHeight: 260 }}
            />
          </div>

          {/* Col 2: Credentials */}
          <div
            className="bg-white"
            style={{ padding: '28px 28px', borderLeft: '1px solid #e5e7eb' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-400 mb-1">Director</p>
            <p className="text-[12px] text-gray-400 mb-1">관장 소개</p>
            <h3 className="text-[19px] font-bold text-navy-900 mb-6">{DIRECTOR.name}</h3>
            <ul className="flex flex-col gap-3">
              {DIRECTOR.credentials.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-navy-900 shrink-0" />
                  <span className="text-[13px] text-gray-700">{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Intro text */}
          <div
            className="bg-navy-50"
            style={{ padding: '28px 28px', borderLeft: '1px solid #e5e7eb' }}
          >
            {DIRECTOR.intro.split('\n').map((line, i) => (
              <p key={i} className="text-[13px] leading-[2] text-gray-600">{line}</p>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}