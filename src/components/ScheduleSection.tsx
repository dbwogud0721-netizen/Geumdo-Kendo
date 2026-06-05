import { SCHEDULE } from '@/lib/data';

export default function ScheduleSection() {
  return (
    <section className="border-t border-b border-gray-100 bg-navy-50 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">

          {/* Label */}
          <div className="shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-400 mb-0.5">
              Schedule
            </p>
            <h2 className="text-[14px] font-bold text-navy-900 whitespace-nowrap">검도장 시간표</h2>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-10 bg-gray-200" />

          {/* Time slots */}
          <div className="flex flex-wrap gap-2.5">
            {SCHEDULE.map((time) => (
              <div
                key={time}
                className="flex items-center justify-center border border-navy-100 bg-white px-4 py-2"
              >
                <span className="text-[12.5px] font-medium text-navy-900 whitespace-nowrap">{time}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}