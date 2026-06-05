import PageHeader from '@/components/PageHeader';
import { FEATURES, DIRECTOR, SCHEDULE } from '@/lib/data';

export const metadata = { title: '검도장 소개 | 금도검도관' };

export default function IntroPage() {
  return (
    <>
      <PageHeader label="About" title="검도장 소개" description="금도검도관을 소개합니다." />

      {/* Intro */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-xl font-bold text-navy-900 mb-6">금도검도관 소개</h2>
          <div className="w-8 h-0.5 bg-gold-400 mb-8" />
          <p className="text-[15px] leading-[2] text-gray-600 mb-5">
            금도검도관은 딱딱하고 부담스러운 분위기보다, 즐겁게 꾸준히 운동할 수 있는 수련
            환경을 중요하게 생각합니다.
          </p>
          <p className="text-[15px] leading-[2] text-gray-600">
            기본 예절과 안전은 지키되, 처음 시작하는 분들도 각자의 속도에 맞춰 차근차근 배울
            수 있습니다. 초등학생부터 성인까지 누구나 환영합니다.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-navy-50">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-xl font-bold text-navy-900 mb-8">핵심 가치</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white p-8 border border-gray-200">
                <h3 className="text-base font-bold text-navy-900 mb-3">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Director */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-xl font-bold text-navy-900 mb-2">{DIRECTOR.name}</h2>
          <div className="w-8 h-0.5 bg-gold-400 mb-8" />
          <p className="text-[15px] leading-[2] text-gray-600 mb-8">{DIRECTOR.intro}</p>
          <ul className="flex flex-col gap-3">
            {DIRECTOR.credentials.map((c) => (
              <li key={c} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-400 shrink-0" />
                <span className="text-sm text-gray-700">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}