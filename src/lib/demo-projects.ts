/**
 * 홈 트렌딩 등에서 Supabase 조회 실패·빈 결과 시 사용하는 샘플 프로젝트.
 * ID는 DB에 없으므로 상세 페이지(`/projects/[id]`)에서 별도 분기 필요.
 */
export interface DemoProject {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  mannerTemperature: string;
  gradient: string;
}

export const DEMO_PROJECTS: DemoProject[] = [
  {
    id: "fallback-1",
    title: "AI Travel Planner",
    description:
      "A smart itinerary generator that uses LLMs to plan personalized trips based on your preferences and budget.",
    gradient: "from-blue-200 via-indigo-200 to-purple-200",
    mannerTemperature: "36.5°C",
    techStack: ["FRONTEND", "UI DESIGNER"],
  },
  {
    id: "fallback-2",
    title: "Eco-Tracker App",
    description:
      "Track your carbon footprint and discover sustainable alternatives for everyday choices.",
    gradient: "from-emerald-200 via-teal-200 to-cyan-200",
    mannerTemperature: "42.0°C",
    techStack: ["MOBILE", "BACKEND"],
  },
  {
    id: "fallback-3",
    title: "SkillSwap Network",
    description:
      "A peer-to-peer platform for developers to exchange skills and collaborate on learning projects.",
    gradient: "from-violet-200 via-purple-200 to-pink-200",
    mannerTemperature: "38.2°C",
    techStack: ["FULL-STACK", "DESIGN"],
  },
];

export function getDemoProjectById(id: string): DemoProject | null {
  return DEMO_PROJECTS.find((p) => p.id === id) ?? null;
}

export function isDemoProjectId(id: string): boolean {
  return getDemoProjectById(id) !== null;
}
