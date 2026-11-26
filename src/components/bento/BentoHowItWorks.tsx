interface WorkStep {
  number: string;
  title: string;
  description: string;
}

const STEPS: WorkStep[] = [
  { number: "01", title: "시프트를 찾거나 등록합니다", description: "날짜·지역·업종·급여 조건을 확인하고 필요한 인력을 모집합니다." },
  { number: "02", title: "지원자를 확인하고 확정합니다", description: "지원자의 프로필과 평가를 확인한 뒤 근무 인원을 확정합니다." },
  { number: "03", title: "근무와 공수를 관리합니다", description: "완료된 근무를 확인하고 공수와 예상 인건비를 기록합니다." },
];

/** 단기 일자리 서비스의 핵심 이용 흐름 */
export default function BentoHowItWorks() {
  return (
    <article className="rounded-xl bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.12)] ring-1 ring-slate-200/90 md:p-7" aria-labelledby="how-it-works-heading">
      <h2 id="how-it-works-heading" className="text-lg font-bold text-slate-900 md:text-xl">이용 방법</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.number} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <span className="text-sm font-black text-[#2563EB]">{step.number}</span>
            <h3 className="mt-2 text-sm font-bold text-slate-900">{step.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{step.description}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
