"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchApplicationCountsByPosition,
  getApplySlotsFromTechStack,
} from "@/lib/project-application-positions";
import {
  DEFAULT_AI_RECOMMENDATION_FALLBACK,
  generateStitchRecommendationComment,
} from "@/lib/stitch-llm";
import type { Database } from "@/types/database";
import {
  buildSituationSentence,
  buildStitchPrompt,
  stacksMatch,
} from "@/lib/ai-recommendation-match";

const DEDUP_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_RECOMMENDATIONS_PER_RUN = 5;

type Candidate = {
  projectId: string;
  projectTitle: string;
  slotRole: string;
  shortage: number;
  joined: number;
  pendingN: number;
  total: number;
};

export type RunAiRecommendationsResult =
  | { ok: true; created: number; skipped: string }
  | { ok: false; error: string };

/**
 * 로그인 사용자 기준으로 프로필 대표 스택과 가장 부족한 모집 포지션을 매칭해 AI 추천 알림을 생성합니다.
 * 알림 센터·헤더 드롭다운에서 "새로고침" 등으로 호출하세요.
 */
export async function runAiProjectRecommendationsAction(): Promise<RunAiRecommendationsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "로그인이 필요합니다." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "서버에서 추천 알림을 생성할 수 없습니다. (SUPABASE_SERVICE_ROLE_KEY 확인)" };
  }

  const { data: profileRaw } = await admin
    .from("profiles")
    .select("primary_stack, tech_stack")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileRaw as {
    primary_stack?: string | null;
    tech_stack?: unknown;
  } | null;

  const techArr = Array.isArray(profile?.tech_stack)
    ? (profile!.tech_stack as string[]).filter((t) => t && t !== "__skipped__")
    : [];

  const primaryStack =
    (typeof profile?.primary_stack === "string" && profile.primary_stack.trim()) ||
    techArr[0]?.trim() ||
    "";

  if (!primaryStack) {
    return {
      ok: false,
      error: "프로필에 대표 스택(primary_stack) 또는 기술 스택을 먼저 설정해 주세요.",
    };
  }

  const { data: projectsRaw, error: projErr } = await admin
    .from("projects")
    .select("id, title, team_leader_id, recruitment_status, visibility, status")
    .eq("status", "active");

  if (projErr || !projectsRaw?.length) {
    return { ok: false, error: "프로젝트 목록을 불러오지 못했습니다." };
  }

  const candidates: Candidate[] = [];

  for (const row of projectsRaw as Array<{
    id: string;
    title: string;
    team_leader_id: string | null;
    recruitment_status: unknown;
    tech_stack: unknown;
    visibility: string | null;
  }>) {
    if (row.team_leader_id === user.id) continue;
    const vis = (row.visibility ?? "Public").toLowerCase();
    if (vis === "private") continue;

    const techArr = Array.isArray(row.tech_stack) ? (row.tech_stack as string[]) : [];
    const slots = getApplySlotsFromTechStack(techArr, row.recruitment_status);
    if (slots.length === 0) continue;

    const { data: appRow } = await admin
      .from("applications")
      .select("status")
      .eq("project_id", row.id)
      .eq("applicant_id", user.id)
      .maybeSingle();

    const appSt = (appRow as { status?: string } | null)?.status;
    if (appSt === "pending" || appSt === "accepted") continue;

    const { accepted, pending } = await fetchApplicationCountsByPosition(admin, row.id);

    for (const slot of slots) {
      if (!stacksMatch(primaryStack, slot.role)) continue;
      const j = accepted[slot.role] ?? 0;
      const p = pending[slot.role] ?? 0;
      const shortage = slot.total - j - p;
      if (shortage <= 0) continue;

      candidates.push({
        projectId: row.id,
        projectTitle: row.title,
        slotRole: slot.role,
        shortage,
        joined: j,
        pendingN: p,
        total: slot.total,
      });
    }
  }

  candidates.sort((a, b) => b.shortage - a.shortage);

  const sinceIso = new Date(Date.now() - DEDUP_MS).toISOString();
  let created = 0;
  const usedProjects = new Set<string>();

  for (const c of candidates) {
    if (created >= MAX_RECOMMENDATIONS_PER_RUN) break;
    if (usedProjects.has(c.projectId)) continue;

    const { data: dup } = await admin
      .from("notifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("source_project_id", c.projectId)
      .eq("is_ai_recommendation", true)
      .gte("created_at", sinceIso)
      .limit(1);

    if (dup && dup.length > 0) continue;

    const situation = buildSituationSentence(c.slotRole, c.total, c.joined, c.pendingN, c.shortage);
    const prompt = buildStitchPrompt({
      primaryStack,
      projectTitle: c.projectTitle,
      situation,
    });

    let aiComment = await generateStitchRecommendationComment(prompt);
    if (!aiComment?.trim()) {
      aiComment = DEFAULT_AI_RECOMMENDATION_FALLBACK;
    }

    const insertRow: Database["public"]["Tables"]["notifications"]["Insert"] = {
      user_id: user.id,
      title: "✨ AI 프로젝트 추천",
      message: `「${c.projectTitle}」의 ${c.slotRole} 포지션이 당신의 스택과 잘 맞습니다.`,
      link: `/projects/${c.projectId}?apply=1`,
      read: false,
      is_ai_recommendation: true,
      ai_comment: aiComment.trim(),
      source_project_id: c.projectId,
    };

    // @ts-expect-error Supabase service client may infer never for notifications.insert
    const { error: insErr } = await admin.from("notifications").insert(insertRow);

    if (insErr) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[runAiProjectRecommendationsAction] insert:", insErr.message);
      }
      continue;
    }

    usedProjects.add(c.projectId);
    created += 1;
  }

  revalidatePath("/notifications");
  revalidatePath("/");

  return {
    ok: true,
    created,
    skipped:
      candidates.length === 0
        ? "조건에 맞는 프로젝트가 없습니다."
        : created === 0
          ? "최근에 이미 추천을 받았거나 생성에 실패했습니다."
          : "",
  };
}
