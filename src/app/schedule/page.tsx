import PageHeader from '@/components/PageHeader';
import { SCHEDULE, CONTACT } from '@/lib/data';

export const metadata = { title: '온라인 접수실 | 금도검도관' };

export default function SchedulePage() {
  return (
    <>
      <PageHeader label="Schedule" title="온라인 접수실" description="수련 시간표와 등록 안내입니다." />

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Schedule */}
            <div>
              <h2 className="text-xl font-bold text-navy-900 mb-2">검도장 시간표</h2>
              <div className="w-8 h-0.5 bg-gold-400 mb-8" />
              <div className="border border-gray-200 overflow-hidden">
                <div className="bg-navy-900 px-6 py-3 flex justify-between">
                  <span className="text-sm font-medium text-white">수련 시간</span>
                  <span className="text-xs text-gold-400">월 ~ 토</span>
                </div>
                {SCHEDULE.map((time, i) => (
                  <div
                    key={time}
                    className={`flex items-center justify-between px-6 py-4 ${
                      i !== SCHEDULE.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-900/10 text-[11px] font-bold text-navy-900">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-800">{time}</span>
                    </div>
                    <span className="text-xs text-gray-400">50분</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Registration info */}
            <div>
              <h2 className="text-xl font-bold text-navy-900 mb-2">등록 안내</h2>
              <div className="w-8 h-0.5 bg-gold-400 mb-8" />
              <div className="bg-navy-50 border border-gray-200 p-6 space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  수련 등록은 아래 연락처로 문의하시거나 도장에 방문하시면 안내드립니다.
                </p>
                <div className="flex flex-col gap-3 pt-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-navy-900">전화</span>{' '}
                    {CONTACT.phone}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-navy-900">관장님</span>{' '}
                    {CONTACT.mobile}
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  {CONTACT.hours.map((h) => (
                    <p key={h} className="text-sm text-gray-600">{h}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}