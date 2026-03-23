import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ApplicantProfilePayload = {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  profile_role: string | null;
  tech_stack: string[];
  manner_temp_target: string | null;
};

/**
 * GET: 프로젝트 팀장만 — 지원서 목록 + 지원자 프로필(가능 시)
 * - 운영에서 `SUPABASE_SERVICE_ROLE_KEY`가 있으면 RLS와 무관하게 조회해
 *   「알림은 오는데 관리 화면 목록만 비는」 현상을 방지합니다.
 * - 서비스 롤이 없으면 세션(anon JWT)으로 동일 쿼리 → DB에 리더 SELECT 정책이 있어야 합니다.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  if (!projectId?.trim()) {
    return NextResponse.json({ error: "Project ID required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab");
  const statuses = tab === "archived" ? (["accepted", "rejected"] as const) : (["pending"] as const);

  const { data: projectRaw, error: projectError } = await supabase
    .from("projects")
    .select("id, team_leader_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !projectRaw) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  const project = projectRaw as { id: string; team_leader_id: string | null };
  if (project.team_leader_id !== user.id) {
    return NextResponse.json({ error: "팀장만 지원 목록을 조회할 수 있습니다." }, { status: 403 });
  }

  const admin = createAdminClient();
  const db = admin ?? supabase;

  const { data: appRows, error: appsError } = await db
    .from("applications")
    .select("*")
    .eq("project_id", projectId)
    .in("status", [...statuses])
    .order("created_at", { ascending: false });

  if (appsError) {
    return NextResponse.json({ error: appsError.message || "지원 목록 조회 실패" }, { status: 500 });
  }

  const rows = appRows ?? [];
  const applicantIds = [...new Set(rows.map((r) => (r as { applicant_id?: string }).applicant_id).filter(Boolean))] as string[];

  const profileClient = admin ?? supabase;
  const profileMap = new Map<string, ApplicantProfilePayload>();

  if (applicantIds.length > 0) {
    let prof = await profileClient
      .from("profiles")
      .select("id, full_name, avatar_url, email, role, tech_stack, manner_temp_target")
      .in("id", applicantIds);

    if (prof.error?.message?.toLowerCase().includes("column")) {
      prof = await profileClient
        .from("profiles")
        .select("id, full_name, avatar_url, role, tech_stack, manner_temp_target")
        .in("id", applicantIds);
    }

    if (!prof.error && prof.data) {
      for (const p of prof.data as Array<{
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        email?: string | null;
        role: string | null;
        tech_stack: unknown;
        manner_temp_target: string | null;
      }>) {
        profileMap.set(p.id, {
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          email: p.email ?? null,
          profile_role: p.role,
          tech_stack: Array.isArray(p.tech_stack) ? (p.tech_stack as string[]) : [],
          manner_temp_target: p.manner_temp_target,
        });
      }
    }
  }

  const items = rows.map((row) => {
    const r = row as Record<string, unknown>;
    const applicantId = String(r.applicant_id ?? "");
    const profile = profileMap.get(applicantId) ?? null;
    return {
      id: String(r.id),
      project_id: String(r.project_id),
      applicant_id: applicantId,
      message: (typeof r.message === "string" ? r.message : null) as string | null,
      role: typeof r.role === "string" ? r.role : null,
      tech_stack: typeof r.tech_stack === "string" ? r.tech_stack : null,
      status: r.status as "pending" | "accepted" | "rejected",
      created_at: String(r.created_at ?? ""),
      profile,
    };
  });

  return NextResponse.json({
    items,
    usedServiceRole: Boolean(admin),
  });
}
