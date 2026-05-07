import Link from "next/link";

function SparkleCluster({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M48 8l1 6 6 1-6 1-1 6-1-6-6-1 6-1 1-6z" className="fill-white/50" />
      <path d="M52 44l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5 1.5-4z" className="fill-white/35" />
      <circle cx="12" cy="48" r="2" className="fill-white/40" />
    </svg>
  );
}

/**
 * 벤토: Start Project CTA — 상단 밝은 블루 → 하단 진한 블루, 글로우 버튼
 */
export default function BentoStartProject() {
  return (
    <article
      className="relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-b from-[#38bdf8] via-[#0ea5e9] to-[#0369a1] p-6 text-white shadow-[0_4px_24px_rgba(3,105,161,0.35)] ring-1 ring-white/20"
      aria-labelledby="bento-start-heading"
    >
      <SparkleCluster className="pointer-events-none absolute bottom-3 right-3 h-14 w-14" />
      <div className="relative">
        <h2 id="bento-start-heading" className="text-2xl font-bold tracking-tight text-white drop-shadow-sm md:text-3xl">
          Start Project
        </h2>
      </div>
      <div className="relative mt-auto pt-6">
        <Link
          href="/signup"
          className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-300 to-blue-500 py-3.5 text-base font-bold text-white shadow-[0_0_28px_rgba(56,189,248,0.65),0_4px_14px_rgba(0,0,0,0.2)] transition hover:from-sky-200 hover:to-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Start Project
        </Link>
        <p className="mt-3 text-center text-xs font-medium text-white/90">
          Turn your Idea into a Career
        </p>
      </div>
    </article>
  );
}
