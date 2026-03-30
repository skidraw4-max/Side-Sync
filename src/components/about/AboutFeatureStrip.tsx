import { Bot, Shield, Users } from "lucide-react";

const items = [
  {
    icon: Users,
    title: "EXPERT MATCHING",
    body: "프로필·스택·매너 온도를 반영해 나와 맞는 팀과 포지션을 빠르게 찾습니다.",
  },
  {
    icon: Bot,
    title: "AI GUIDANCE",
    body: "추천과 인사이트로 다음 협업과 성장 포인트를 데이터 기반으로 제안합니다.",
  },
  {
    icon: Shield,
    title: "SECURE WORKSPACE",
    body: "전용 워크스페이스에서 칸반·채팅·공지를 한곳에 모아 안전하게 실행합니다.",
  },
] as const;

export default function AboutFeatureStrip() {
  return (
    <section
      className="border-b border-gray-100 bg-white px-6 py-16 md:px-10 md:py-20 lg:px-16 lg:py-24 xl:px-24"
      aria-labelledby="about-features-heading"
    >
      <div className="mx-auto max-w-7xl">
        <h2 id="about-features-heading" className="sr-only">
          핵심 역량
        </h2>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10 lg:gap-16">
          {items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="min-w-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-gray-900 text-white shadow-sm">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="mt-5 text-xs font-bold tracking-[0.2em] text-gray-900">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500 md:text-[0.9375rem]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
