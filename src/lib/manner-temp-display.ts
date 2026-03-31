import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { coerceDisplayString } from "@/lib/project-row-normalize";
import { coerceMannerTempFromDb } from "@/lib/manner-temp-coerce";

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
    const r = row as { id: string; manner_temp: unknown; manner_temp_target: string | null };
    const mt = coerceMannerTempFromDb(r.manner_temp);
    map.set(r.id, {
      manner_temp: mt,
      manner_temp_target: r.manner_temp_target,
    });
  }
  return map;
}

/**
 * 목록 카드용: 세션으로 읽은 맵이 비어 있거나 불완전할 때(비로그인 RLS 등),
 * `/api/projects/leader-manner`로 실제 팀 리더 매너만 보강합니다.
 */
export async function fetchLeaderMannerMapForProjectCards(
  supabase: SupabaseClient<Database>,
  leaderIds: (string | null | undefined)[]
): Promise<Map<string, LeaderMannerRow>> {
  const map = await fetchLeaderMannerMap(supabase, leaderIds);
  const unique = [...new Set(leaderIds.filter((id): id is string => typeof id === "string" && id.length > 0))];
  const missing = unique.filter((id) => !map.has(id));
  if (missing.length === 0) return map;

  if (typeof window === "undefined") {
    return map;
  }

  try {
    const res = await fetch("/api/projects/leader-manner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: missing }),
    });
    if (!res.ok) return map;
    const json = (await res.json()) as Record<string, LeaderMannerRow | undefined>;
    for (const id of missing) {
      const row = json[id];
      if (row && (row.manner_temp != null || row.manner_temp_target != null)) {
        map.set(id, row);
      }
    }
  } catch {
    /* 네트워크 오류 시 기존 맵 유지 */
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
  const mt = row ? coerceMannerTempFromDb(row.manner_temp) : null;
  if (mt != null) {
    return `${mt.toFixed(1)}°C`;
  }
  const leaderTarget = coerceDisplayString(row?.manner_temp_target ?? null);
  if (leaderTarget) {
    return leaderTarget.includes("°") ? leaderTarget : `${leaderTarget}°C`;
  }
  return fallback;
}

/**
 * 프로필 한 건(상세 팀원·팀장) — manner_temp 숫자 우선, 없으면 manner_temp_target, 없으면 프로젝트 폴백.
 * 목록 카드의 formatMannerTemperatureForCard와 동일한 우선순위 개념.
 */
export function formatProfileMannerDisplay(
  profile: { manner_temp?: number | null; manner_temp_target?: string | number | null } | null | undefined,
  projectFallback: string | number | null | undefined
): string {
  if (profile && typeof profile.manner_temp === "number" && Number.isFinite(profile.manner_temp)) {
    return `${profile.manner_temp.toFixed(1)}°C`;
  }
  const fromProfile = coerceDisplayString(profile?.manner_temp_target ?? null);
  if (fromProfile) {
    return fromProfile.includes("°") ? fromProfile : `${fromProfile}°C`;
  }
  return formatMannerTemperatureForCard(null, new Map(), projectFallback);
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
