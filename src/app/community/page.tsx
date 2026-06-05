import PageHeader from '@/components/PageHeader';
import { NOTICES } from '@/lib/data';

export const metadata = { title: '커뮤니티 | 금도검도관' };

const CATEGORY_STYLES: Record<string, string> = {
  공지: 'bg-navy-900 text-white',
  안내: 'bg-[#5c7a8a] text-white',
  갤러리: 'bg-[#7a8a5c] text-white',
};

export default function CommunityPage() {
  return (
    <>
      <PageHeader label="Community" title="커뮤니티" description="공지사항 및 수련 정보를 안내합니다." />

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-6">
          <div className="border border-gray-200 overflow-hidden">
            {/* Table header */}
            <div className="bg-navy-50 border-b border-gray-200 grid grid-cols-12 px-5 py-3 text-xs font-semibold text-gray-500">
              <span className="col-span-1 text-center">번호</span>
              <span className="col-span-2 text-center">분류</span>
              <span className="col-span-6">제목</span>
              <span className="col-span-3 text-right">날짜</span>
            </div>

            {/* Rows */}
            {NOTICES.map((item, i) => (
              <div
                key={i}
                className={`grid grid-cols-12 items-center px-5 py-4 cursor-pointer hover:bg-navy-50 transition-colors ${
                  i !== NOTICES.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <span className="col-span-1 text-xs text-gray-400 text-center">
                  {NOTICES.length - i}
                </span>
                <span className="col-span-2 flex justify-center">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 ${CATEGORY_STYLES[item.category] ?? 'bg-gray-200 text-gray-700'}`}>
                    {item.category}
                  </span>
                </span>
                <span className="col-span-6 text-[13px] text-gray-700">{item.title}</span>
                <span className="col-span-3 text-[11px] text-gray-400 text-right">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}