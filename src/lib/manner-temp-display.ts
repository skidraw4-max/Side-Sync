import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { coerceDisplayString } from "@/lib/project-row-normalize";

export type LeaderMannerRow = {
  manner_temp: number | null;
  /** DB/JSON에서 숫자 등 비문자열이 올 수 있음 — 표시 시 coerce */
  manner_temp_target: string | number | null;
};

/** 팀장 id → 프로필 매너 (목록 카드용 배치 조회) */
export async function fetchLeaderMannerMap(
  supabase: SupabaseClient<Database>,
  leaderIds: (string | null | undefined)[]
): Promise<Map<string, LeaderMannerRow>> {
  const unique = [...new Set(leaderIds.filter((id): id is string => typeof id === "string" && id.length > 0))];
  const map = new Map<string, LeaderMannerRow>();
  if (unique.length === 0) return map;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, manner_temp, manner_temp_target")
    .in("id", unique);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[manner-temp-display] profiles select:", error.message);
    }
    return map;
  }

  for (const row of data ?? []) {
    const r = row as { id: string; manner_temp: number | null; manner_temp_target: string | null };
    map.set(r.id, { manner_temp: r.manner_temp, manner_temp_target: r.manner_temp_target });
  }
  return map;
}

/** 카드에 표시할 문자열 — 팀장 manner_temp 우선, 없으면 프로젝트 manner_temp_target */
export function formatMannerTemperatureForCard(
  leaderId: string | null | undefined,
  leaderMap: Map<string, LeaderMannerRow>,
  projectMannerTarget: string | number | null | undefined
): string {
  const rawTarget = coerceDisplayString(projectMannerTarget);
  const fallback =
    rawTarget && rawTarget.includes("°")
      ? rawTarget
      : rawTarget
        ? `${rawTarget}°C`
        : "36.5°C";

  if (!leaderId) return fallback;

  const row = leaderMap.get(leaderId);
  if (row && typeof row.manner_temp === "number" && Number.isFinite(row.manner_temp)) {
    return `${row.manner_temp.toFixed(1)}°C`;
  }
  const leaderTarget = coerceDisplayString(row?.manner_temp_target ?? null);
  if (leaderTarget) {
    return leaderTarget.includes("°") ? leaderTarget : `${leaderTarget}°C`;
  }
  return fallback;
}

/** 숫자 온도(°C)로 매너 칭호 */
export function getMannerHonorFromTemp(temp: number): {
  name: string;
  tagline: string;
  encouragement: string;
} {
  if (temp >= 50.1) {
    return {
      name: "태양급 리더",
      tagline: "최고의 완주자",
      encouragement: "커뮤니티에서 모범이 되는 협업 온도를 유지하고 있어요.",
    };
  }
  if (temp >= 40.1) {
    return {
      name: "협업의 달인",
      tagline: "베테랑",
      encouragement: "높은 매너 온도로 신뢰받는 팀 플레이어에 가깝습니다.",
    };
  }
  if (temp >= 37.6) {
    return {
      name: "든든한 파트너",
      tagline: "신뢰 시작",
      encouragement: "꾸준한 협업으로 온도를 올리고 있어요.",
    };
  }
  return {
    name: "시작하는 열정",
    tagline: "기본",
    encouragement: "프로젝트에 참여하며 매너 온도를 쌓아 가요.",
  };
}

/** 대략적 상위 구간 안내 (통계 없이 온도 구간 기반) */
export function getMannerPercentileHint(temp: number): string | null {
  if (temp >= 50.1) return "현재 최상위 구간 매너 온도입니다.";
  if (temp >= 45) return "현재 상위권 매너 온도에 가깝습니다.";
  if (temp >= 40.1) return "평균보다 높은 매너 온도를 보이고 있어요.";
  return null;
}
