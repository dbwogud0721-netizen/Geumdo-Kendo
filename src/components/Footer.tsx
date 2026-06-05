import { ADDRESS, CONTACT } from '@/lib/data';

export default function Footer() {
  return (
    <footer className="bg-navy-900">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-400/50">
              <span className="text-[12px] font-bold text-gold-400">금</span>
            </div>
            <span className="text-[15px] font-bold text-white tracking-tight">금도검도관</span>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-1.5 md:text-right">
            <p className="text-[12px] text-gray-400">
              {ADDRESS.jibun}&nbsp;&nbsp;|&nbsp;&nbsp;
              TEL. {CONTACT.phone}&nbsp;&nbsp;|&nbsp;&nbsp;
              H.P. {CONTACT.mobile}
            </p>
            <p className="text-[11px] text-gray-600 uppercase tracking-wide">
              COPYRIGHT &copy; 금도검도관. ALL RIGHTS RESERVED.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}