import Link from "next/link";

/**
 * 랜딩 히어로: 근무자·고용주가 바로 다음 행동을 선택하도록 안내
 * (시안 image_5: PROFILE/ONBOARDING, synergy access, BUILD YOUR SYNERGY.)
 */
export default function BentoProfileOnboarding() {
  return (
    <article
      className="flex h-full flex-col rounded-xl bg-gradient-to-br from-[#8eb4e3] via-[#6b9bd9] to-[#4f83c9] p-7 text-white shadow-[0_4px_24px_rgba(15,39,68,0.12)] ring-1 ring-white/20 md:p-8"
      aria-labelledby="bento-profile-heading"
    >
      <h2
        id="bento-profile-heading"
        className="text-xs font-bold uppercase tracking-[0.2em] text-white md:text-sm"
      >
        단기 일자리 플랫폼
      </h2>
      <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-white/95">
        오늘 필요한 인력을 빠르게 구하고, 근무 공수와 인건비를 한눈에 관리하세요.
      </p>
      <Link
        href="/signup"
        className="mt-6 flex flex-1 flex-col items-start justify-end rounded-xl border-2 border-white/90 bg-white/15 px-5 py-5 text-left shadow-[0_4px_20px_rgba(0,0,0,0.12)] backdrop-blur-md transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span className="text-sm font-semibold text-white/85">무엇을 하시겠어요?</span>
        <span className="mt-1 text-xl font-bold tracking-tight text-white md:text-2xl">일자리 찾기 또는 공고 올리기</span>
        <span className="mt-3 text-xs font-medium text-white/80">시프트 등록부터 지원자 관리까지 간편하게 시작하세요.</span>
      </Link>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/explore" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#1e40af] transition hover:bg-blue-50">일자리 찾기</Link>
        <Link href="/projects/create" className="rounded-xl border border-white/60 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/15">공고 올리기</Link>
      </div>
    </article>
  );
}
