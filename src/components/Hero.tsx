export default function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ paddingTop: 52, minHeight: 500, background: '#08080e' }}
    >
      <div className="absolute inset-0">
        <img
          src="/hero.jpg"
          alt="금도검도관 검도 수련"
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center center' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(6,6,14,0.90) 0%, rgba(6,6,14,0.75) 38%, rgba(6,6,14,0.25) 68%, rgba(6,6,14,0.05) 100%)',
          }}
        />
      </div>

      <div className="relative z-10" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ paddingTop: 112, paddingBottom: 140, maxWidth: 560 }}>
          <p className="mb-4 text-[11px] font-semibold tracking-[0.18em] uppercase text-gold-400">
            서울 노원구 하계동 · 검도
          </p>
          <h1
            className="mb-5 font-bold text-white"
            style={{ fontSize: 'clamp(1.75rem, 2.8vw, 2.5rem)', lineHeight: 1.35 }}
          >
            바른 자세와<br />
            강한 마음을 기르는{' '}
            <span className="text-gold-400">검도</span>
          </h1>
          <p className="mb-10 text-gray-300" style={{ fontSize: 14, lineHeight: 1.95 }}>
            초등학생부터 성인까지, 각자의 속도에 맞춰<br />
            편하게 운동할 수 있는 금도검도관입니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#location"
              className="inline-flex items-center justify-center text-white text-[13px] font-medium transition-opacity hover:opacity-80"
              style={{
                height: 44,
                padding: '0 26px',
                background: 'rgba(15,28,56,0.95)',
                border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: 2,
              }}
            >
              상담 문의
            </a>
            <a
              href="/schedule"
              className="inline-flex items-center justify-center text-[13px] font-semibold transition-opacity hover:opacity-85"
              style={{
                height: 44,
                padding: '0 26px',
                background: '#d4a843',
                color: '#1a0f00',
                borderRadius: 2,
              }}
            >
              온라인 접수
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}