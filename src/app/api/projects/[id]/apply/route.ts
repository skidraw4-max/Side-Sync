import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchApplicationCountsByPosition,
  getApplySlotsFromTechStack,
} from "@/lib/project-application-positions";

type ProjectRow = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  "id" | "team_leader_id" | "recruitment_status" | "tech_stack"
>;

/**
 * POST: 프로젝트 지원 신청
 * - applications 테이블에 저장 (tech_stack·role·message, status: pending)
 * - 팀장에게 notifications 테이블에 "새로운 지원자가 있습니다!" 알림 생성
 */
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

  let body: { motivation?: string; role?: string; techStack?: string; agreeShareProfile?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const motivation = typeof body.motivation === "string" ? body.motivation.trim() : "";
  if (!motivation) {
    return NextResponse.json({ error: "지원 동기를 입력해주세요." }, { status: 400 });
  }

  if (!body.agreeShareProfile) {
    return NextResponse.json(
      { error: "프로필·포트폴리오 공유에 동의해주세요." },
      { status: 400 }
    );
  }

  const techStackRaw =
    typeof body.techStack === "string"
      ? body.techStack.trim()
      : typeof body.role === "string"
        ? body.role.trim()
        : "";
  if (!techStackRaw) {
    return NextResponse.json({ error: "모집 중인 포지션(기술 스택)을 선택해주세요." }, { status: 400 });
  }

  // 프로젝트 및 팀장 조회
  const { data, error: projectError } = await supabase
    .from("projects")
    .select("id, team_leader_id, recruitment_status, tech_stack")
    .eq("id", projectId)
    .single();

  const project = data as ProjectRow | null;
  if (projectError || !project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  if (project.team_leader_id === user.id) {
    return NextResponse.json(
      { error: "팀장 본인은 지원할 수 없습니다." },
      { status: 403 }
    );
  }

  const techArr = Array.isArray(project.tech_stack) ? (project.tech_stack as string[]) : [];
  const slots = getApplySlotsFromTechStack(techArr, project.recruitment_status);
  const matchedSlot = slots.find((s) => s.role === techStackRaw);
  if (!matchedSlot) {
    return NextResponse.json(
      { error: "선택한 기술 스택이 프로젝트 필수 스택에 없거나 모집 정원과 맞지 않습니다." },
      { status: 400 }
    );
  }

  const statsClient = createAdminClient() ?? supabase;
  const { accepted, pending } = await fetchApplicationCountsByPosition(statsClient, projectId);
  const taken = (accepted[techStackRaw] ?? 0) + (pending[techStackRaw] ?? 0);
  if (taken >= matchedSlot.total) {
    return NextResponse.json(
      { error: "해당 포지션은 모집 정원이 찼습니다. 다른 포지션을 선택해 주세요." },
      { status: 400 }
    );
  }

  // 이미 지원했는지 확인 (거절된 경우 재신청: pending으로 갱신)
  const { data: existingRaw } = await supabase
    .from("applications")
    .select("id, status")
    .eq("project_id", projectId)
    .eq("applicant_id", user.id)
    .maybeSingle();

  const existing = existingRaw as { id: string; status: string } | null;

  if (existing) {
    if (existing.status === "pending") {
      return NextResponse.json({ error: "이미 신청이 접수되었습니다. 승인을 기다려주세요." }, { status: 409 });
    }
    if (existing.status === "accepted") {
      return NextResponse.json({ error: "이미 이 프로젝트 팀원입니다." }, { status: 409 });
    }
    if (existing.status === "rejected") {
      const updatePayload = {
        status: "pending" as const,
        message: motivation,
        role: techStackRaw,
        tech_stack: techStackRaw,
        rejection_reason: null as string | null,
        updated_at: new Date().toISOString(),
      };
      const { error: reapplyError } = await supabase
        .from("applications")
        // @ts-expect-error Supabase client incorrectly infers 'never' for applications.update()
        .update(updatePayload)
        .eq("id", existing.id);

      if (reapplyError) {
        return NextResponse.json(
          { error: reapplyError.message || "재신청 저장에 실패했습니다." },
          { status: 500 }
        );
      }
      if (project.team_leader_id) {
        const admin = createAdminClient();
        if (admin) {
          // @ts-expect-error Supabase admin client infers never for insert with custom Database type
          await admin.from("notifications").insert({
            user_id: project.team_leader_id,
            title: "지원자가 다시 신청했습니다",
            message: "거절했던 지원자가 프로젝트에 다시 지원했습니다. 검토해 주세요.",
            link: `/projects/${projectId}/manage`,
          });
        }
      }
      return NextResponse.json({ ok: true, reapplied: true });
    }
    return NextResponse.json({ error: "이미 지원했습니다." }, { status: 409 });
  }

  // applications 삽입
  const insertPayload: {
    project_id: string;
    applicant_id: string;
    message: string;
    status: "pending";
    role: string;
    tech_stack: string;
  } = {
    project_id: projectId,
    applicant_id: user.id,
    message: motivation,
    status: "pending",
    role: techStackRaw,
    tech_stack: techStackRaw,
  };

  // @ts-expect-error Supabase client incorrectly infers 'never' for applications.insert()
  const { error: insertError } = await supabase.from("applications").insert(insertPayload);

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message || "지원 저장에 실패했습니다." },
      { status: 500 }
    );
  }

  // 팀장에게 알림 생성 (Admin 클라이언트로 RLS 우회)
  if (project.team_leader_id) {
    const admin = createAdminClient();
    if (admin) {
      // @ts-expect-error Supabase admin client infers never for insert with custom Database type
      await admin.from("notifications").insert({
        user_id: project.team_leader_id,
        title: "새로운 지원자가 있습니다!",
        message: "프로젝트에 새로운 지원 요청이 들어왔습니다. 지원자를 검토해보세요.",
        link: `/projects/${projectId}/manage`,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
