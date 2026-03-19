import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";

type ProjectRow = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  "id" | "team_leader_id" | "status"
>;

/**
 * POST: 상호 평가 제출
 * - peer_evaluations에 저장 (중복 방지: UNIQUE)
 * - evaluatee의 manner_temp 업데이트 (36.5 + sum(모든 리뷰 score))
 * - manner_temp > 40이면 '열정적인 협업자' 배지 부여
 */
const QUICK_FEEDBACK_SCORES: Record<string, number> = {
  "시간을 잘 지켜요": 0.3,
  "답장이 빨라요": 0.2,
  "연락이 안 돼요": -0.3,
  "중도 하차했어요": -0.5,
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: "Project ID required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { evaluatee_id: string; quick_feedback?: string[]; additional_feedback?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const evaluateeId = body.evaluatee_id?.trim();
  if (!evaluateeId) {
    return NextResponse.json({ error: "evaluatee_id가 필요합니다." }, { status: 400 });
  }

  if (evaluateeId === user.id) {
    return NextResponse.json({ error: "자기 자신을 평가할 수 없습니다." }, { status: 400 });
  }

  const quickFeedback = Array.isArray(body.quick_feedback) ? body.quick_feedback : [];
  const additionalFeedback = typeof body.additional_feedback === "string" ? body.additional_feedback.trim() : null;

  let score = 0;
  quickFeedback.forEach((key) => {
    const delta = QUICK_FEEDBACK_SCORES[key];
    if (typeof delta === "number") score += delta;
  });
  score = Math.max(-0.5, Math.min(0.5, score));

  const { data } = await supabase
    .from("projects")
    .select("id, team_leader_id, status")
    .eq("id", projectId)
    .single();

  const project = data as ProjectRow | null;
  if (!project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  if (project.status !== "completed") {
    return NextResponse.json({ error: "종료된 프로젝트만 평가할 수 있습니다." }, { status: 400 });
  }

  const isLeader = project.team_leader_id === user.id;
  const { data: acceptedApp } = await supabase
    .from("applications")
    .select("id")
    .eq("project_id", projectId)
    .eq("applicant_id", user.id)
    .eq("status", "accepted")
    .maybeSingle();

  if (!isLeader && !acceptedApp) {
    return NextResponse.json({ error: "이 프로젝트의 팀원만 평가할 수 있습니다." }, { status: 403 });
  }

  const isEvaluateeLeader = evaluateeId === project.team_leader_id;
  const { data: evalApp } = await supabase
    .from("applications")
    .select("id")
    .eq("project_id", projectId)
    .eq("applicant_id", evaluateeId)
    .eq("status", "accepted")
    .maybeSingle();
  const isEvaluateeMember = isEvaluateeLeader || !!evalApp;
  if (!isEvaluateeMember) {
    return NextResponse.json({ error: "피평가는 이 프로젝트 팀원이어야 합니다." }, { status: 400 });
  }

  // @ts-expect-error Supabase client infers 'never' for peer_evaluations.insert with custom Database type
  const { error: insertError } = await supabase.from("peer_evaluations").insert({
    project_id: projectId,
    evaluator_id: user.id,
    evaluatee_id: evaluateeId,
    score,
    quick_feedback: quickFeedback,
    additional_feedback: additionalFeedback || null,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "이미 평가하신 팀원입니다." }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: allReviews } = await supabase
    .from("peer_evaluations")
    .select("score")
    .eq("evaluatee_id", evaluateeId);

  const reviews = (allReviews ?? []) as Array<{ score: number }>;
  const totalScore = reviews.reduce((sum, r) => sum + Number(r.score), 0);
  const newMannerTemp = Math.round((36.5 + totalScore) * 10) / 10;
  const clampedTemp = Math.max(30, Math.min(45, newMannerTemp));

  const admin = createAdminClient();
  if (admin) {
    const { data: profileData } = await (admin as any)
      .from("profiles")
      .select("badges")
      .eq("id", evaluateeId)
      .single();
    const currentProfile = profileData as { badges?: string[] } | null;

    let badges: string[] = Array.isArray(currentProfile?.badges) ? currentProfile.badges : [];
    if (clampedTemp > 40 && !badges.includes("열정적인 협업자")) {
      badges = [...badges, "열정적인 협업자"];
    }

    await (admin as any)
      .from("profiles")
      .update({
        manner_temp: clampedTemp,
        manner_temp_target: `${clampedTemp}°C`,
        badges,
        updated_at: new Date().toISOString(),
      })
      .eq("id", evaluateeId);
  } else {
    const supabaseClient = await createClient();
    const { data: profileData } = await (supabaseClient as any)
      .from("profiles")
      .select("badges")
      .eq("id", evaluateeId)
      .single();
    const currentProfile = profileData as { badges?: string[] } | null;

    let badges: string[] = Array.isArray(currentProfile?.badges) ? currentProfile.badges : [];
    if (clampedTemp > 40 && !badges.includes("열정적인 협업자")) {
      badges = [...badges, "열정적인 협업자"];
    }

    // @ts-ignore - Supabase client infers never for profiles.update in some environments
    await (supabaseClient as any)
      .from("profiles")
      // @ts-ignore
      .update({
        manner_temp: clampedTemp,
        manner_temp_target: `${clampedTemp}°C`,
        badges,
        updated_at: new Date().toISOString(),
      })
      .eq("id", evaluateeId);
  }

  return NextResponse.json({ ok: true, manner_temp: clampedTemp });
}
