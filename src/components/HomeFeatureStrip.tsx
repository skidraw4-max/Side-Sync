import { Briefcase, Cpu, ShieldCheck } from "lucide-react";

const items = [
  {
    icon: Cpu,
    title: "스마트 매칭",
    body: "프로필·기술 스택·매너 온도를 반영해 프로젝트와 지원자를 빠르게 연결합니다.",
  },
  {
    icon: Briefcase,
    title: "전용 워크스페이스",
    body: "칸반, 채팅, 공지를 한곳에서 다루며 팀 속도를 맞추고 산출물을 쌓아 갑니다.",
  },
  {
    icon: ShieldCheck,
    title: "검증·완주 기록",
    body: "모집 정원과 역할 데이터를 바탕으로 진행 상황을 투명하게 보여 주고, 완주 시 활동 확인서로 경력을 남깁니다.",
  },
] as const;

/**
 * 3열 기능 스트립 — 소형 다크 아이콘 + 굵은 제목 + 회색 본문 (참고 레이아웃).
 */
export default function HomeFeatureStrip() {
  return (
    <section
      className="border-b border-gray-100 bg-white px-6 py-16 md:px-10 md:py-20 lg:px-16 lg:py-24 xl:px-24"
      aria-labelledby="home-feature-strip-heading"
    >
      <div className="mx-auto max-w-7xl">
        <h2 id="home-feature-strip-heading" className="sr-only">
          핵심 가치
        </h2>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10 lg:gap-16">
          {items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="min-w-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-gray-900 text-white shadow-sm">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-gray-900">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500 md:text-[0.9375rem]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
