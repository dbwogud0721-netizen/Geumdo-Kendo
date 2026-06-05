export default function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ paddingTop: 52, minHeight: 440, background: '#08080e' }}
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
              'linear-gradient(to right, rgba(6,6,14,0.92) 0%, rgba(6,6,14,0.80) 40%, rgba(6,6,14,0.35) 70%, rgba(6,6,14,0.08) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px] px-5 md:px-10">
        <div className="pt-14 pb-16 md:pt-28 md:pb-36" style={{ maxWidth: 560 }}>
          <p className="mb-3 text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-gold-400">
            서울 노원구 하계동 · 검도
          </p>
          <h1
            className="mb-4 font-bold text-white"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', lineHeight: 1.35 }}
          >
            바른 자세와<br />
            강한 마음을 기르는{' '}
            <span className="text-gold-400">검도</span>
          </h1>
          <p className="mb-8 text-gray-300 text-[13px] md:text-[14px]" style={{ lineHeight: 1.95 }}>
            초등학생부터 성인까지, 각자의 속도에 맞춰<br />
            편하게 운동할 수 있는 금도검도관입니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#location"
              className="inline-flex items-center justify-center text-white text-[13px] font-medium transition-opacity hover:opacity-80"
              style={{
                height: 42,
                padding: '0 22px',
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
                height: 42,
                padding: '0 22px',
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