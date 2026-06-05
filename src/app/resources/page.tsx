import PageHeader from '@/components/PageHeader';

export const metadata = { title: '자료실 | 금도검도관' };

const RESOURCES = [
  { title: '검도 기본 예절 안내', category: '교육자료', date: '2024.05.10', size: '1.2MB' },
  { title: '검도 급 심사 기준표', category: '심사자료', date: '2024.04.20', size: '0.8MB' },
  { title: '수련생 준비물 체크리스트', category: '안내자료', date: '2024.03.15', size: '0.5MB' },
  { title: '검도 호구 관리 방법', category: '교육자료', date: '2024.02.28', size: '2.1MB' },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHeader label="Resources" title="자료실" description="수련에 필요한 자료를 제공합니다." />

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-6">
          <div className="border border-gray-200 overflow-hidden">
            <div className="bg-navy-50 border-b border-gray-200 grid grid-cols-12 px-5 py-3 text-xs font-semibold text-gray-500">
              <span className="col-span-2 text-center">분류</span>
              <span className="col-span-6">제목</span>
              <span className="col-span-2 text-center">크기</span>
              <span className="col-span-2 text-right">날짜</span>
            </div>

            {RESOURCES.map((r, i) => (
              <div
                key={i}
                className={`grid grid-cols-12 items-center px-5 py-4 cursor-pointer hover:bg-navy-50 transition-colors ${
                  i !== RESOURCES.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <span className="col-span-2 flex justify-center">
                  <span className="bg-navy-100 text-navy-900 text-[10px] font-semibold px-2 py-0.5">
                    {r.category}
                  </span>
                </span>
                <span className="col-span-6 text-[13px] text-gray-700 flex items-center gap-2">
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L10 2z" />
                    <path d="M10 2v4h4" />
                  </svg>
                  {r.title}
                </span>
                <span className="col-span-2 text-[11px] text-gray-400 text-center">{r.size}</span>
                <span className="col-span-2 text-[11px] text-gray-400 text-right">{r.date}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-gray-400 text-center">
            자료 다운로드는 회원 로그인 후 이용 가능합니다.
          </p>
        </div>
      </section>
    </>
  );
}