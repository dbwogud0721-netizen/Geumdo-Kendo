import { FEATURES } from '@/lib/data';

function StartIcon() {
  return (
    <svg viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-11 h-11">
      <circle cx="22" cy="22" r="20" />
      <circle cx="22" cy="16" r="4" />
      <path d="M13 34v-2a9 9 0 0118 0v2" />
      <path d="M16 27l3-2M28 27l-3-2" />
    </svg>
  );
}

function AtmosphereIcon() {
  return (
    <svg viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-11 h-11">
      <circle cx="22" cy="22" r="20" />
      <circle cx="22" cy="22" r="7" />
      <circle cx="22" cy="22" r="2" fill="currentColor" stroke="none" />
      <line x1="22" y1="3" x2="22" y2="9" />
      <line x1="22" y1="35" x2="22" y2="41" />
      <line x1="3" y1="22" x2="9" y2="22" />
      <line x1="35" y1="22" x2="41" y2="22" />
    </svg>
  );
}

function StrengthIcon() {
  return (
    <svg viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-11 h-11">
      <circle cx="22" cy="22" r="20" />
      <path d="M10 24h4M30 24h4" />
      <rect x="14" y="20" width="16" height="8" rx="2" />
      <path d="M10 20v8M34 20v8" />
    </svg>
  );
}

const ICONS = [StartIcon, AtmosphereIcon, StrengthIcon];

export default function IntroSection() {
  return (
    <section id="intro" className="bg-white border-b border-gray-100" style={{ padding: '40px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        {/* grid: 1fr 2fr */}
        <div
          className="grid grid-cols-1"
          style={{ gap: 40 }}
        >
          {/* PC: side by side via inline style override at md */}
          <div className="block md:hidden">
            {/* Mobile: stacked */}
            <div className="mb-8">
              <h2 className="text-[17px] font-bold text-navy-900 mb-3">검도장 소개</h2>
              <div className="w-7 h-0.5 bg-gold-400 mb-4" />
              <p className="text-[13.5px] leading-[2] text-gray-600">
                금도검도관은 딱딱하고 부담스러운 분위기보다,<br />
                즐겁게 꾸준히 운동할 수 있는 수련 환경을 중요하게 생각합니다.<br />
                기본 예절과 안전은 지키되, 처음 시작하는 분들도<br />
                각자의 속도에 맞춰 차근차근 배울 수 있습니다.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {FEATURES.map((f, i) => {
                const Icon = ICONS[i];
                return (
                  <div key={f.title} className="flex flex-col items-center text-center gap-3">
                    <div className="text-navy-900"><Icon /></div>
                    <h3 className="text-[13px] font-bold text-navy-900">{f.title}</h3>
                    <p className="text-[12px] text-gray-500 leading-relaxed">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PC: 2-column grid */}
          <div
            className="hidden md:grid"
            style={{ gridTemplateColumns: '1fr 2fr', gap: 40, alignItems: 'start' }}
          >
            <div>
              <h2 className="text-[17px] font-bold text-navy-900 mb-3">검도장 소개</h2>
              <div className="w-7 h-0.5 bg-gold-400 mb-4" />
              <p className="text-[13.5px] leading-[2] text-gray-600">
                금도검도관은 딱딱하고 부담스러운 분위기보다,<br />
                즐겁게 꾸준히 운동할 수 있는 수련 환경을 중요하게 생각합니다.<br />
                기본 예절과 안전은 지키되, 처음 시작하는 분들도<br />
                각자의 속도에 맞춰 차근차근 배울 수 있습니다.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
              {FEATURES.map((f, i) => {
                const Icon = ICONS[i];
                return (
                  <div key={f.title} className="flex flex-col items-center text-center gap-3">
                    <div className="text-navy-900"><Icon /></div>
                    <h3 className="text-[13px] font-bold text-navy-900">{f.title}</h3>
                    <p className="text-[12px] text-gray-500 leading-relaxed">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}