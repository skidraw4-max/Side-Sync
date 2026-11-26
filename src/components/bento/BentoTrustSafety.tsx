const TRUST_ITEMS = ["근무 시간·급여·장소 사전 확인", "근무 완료 이력과 상호 평가", "안전한 거래와 개인정보 보호"];

/** 근무자와 고용주가 확인할 신뢰·안전 안내 */
export default function BentoTrustSafety() {
  return (
    <article className="rounded-xl bg-[#0f2744] p-6 text-white shadow-[0_4px_16px_rgba(15,39,68,0.2)] md:p-7" aria-labelledby="trust-safety-heading">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">Trust & Safety</p>
      <h2 id="trust-safety-heading" className="mt-2 text-xl font-bold tracking-tight">조건은 명확하게, 근무는 더 안전하게.</h2>
      <ul className="mt-5 space-y-3">
        {TRUST_ITEMS.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-white/85">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold">✓</span>
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
