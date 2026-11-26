import Link from "next/link";

interface WageBenchmark {
  category: string;
  range: string;
  unit: string;
}

const BENCHMARKS: WageBenchmark[] = [
  { category: "물류·창고", range: "11,000–14,000원", unit: "시간당" },
  { category: "행사·전시", range: "12,000–18,000원", unit: "시간당" },
  { category: "매장·카페", range: "10,320–13,000원", unit: "시간당" },
  { category: "포장·검수", range: "11,000–14,000원", unit: "시간당" },
];

/** 업종별 참고 노임 밴드. 실제 지급액이 아닌 참고 정보임을 명시합니다. */
export default function BentoWageBenchmarks() {
  return (
    <article
      className="flex h-full flex-col rounded-xl bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.12)] ring-1 ring-slate-200/90"
      aria-labelledby="bento-wage-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="bento-wage-heading" className="text-lg font-bold text-slate-900 md:text-xl">
            업종별 참고 시세
          </h2>
          <p className="mt-1 text-xs text-slate-500">최근 단기 업무 기준 참고 범위</p>
        </div>
        <span className="rounded-xl bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#2563EB]">참고용</span>
      </div>
      <ul className="mt-5 divide-y divide-slate-100">
        {BENCHMARKS.map((item) => (
          <li key={item.category} className="flex items-center justify-between gap-3 py-3 first:pt-0">
            <span className="text-sm font-semibold text-slate-800">{item.category}</span>
            <span className="text-right">
              <strong className="block text-sm font-bold text-[#2563EB]">{item.range}</strong>
              <small className="text-[11px] text-slate-400">{item.unit}</small>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-4 text-[11px] leading-relaxed text-slate-400">
        참고용 범위이며 실제 지급액과 다를 수 있습니다. 지역·시간·업무 조건에 따라 달라집니다.
      </p>
      <Link href="/explore" className="mt-3 text-sm font-bold text-[#2563EB] hover:underline">
        일자리와 시세 함께 보기 →
      </Link>
    </article>
  );
}
