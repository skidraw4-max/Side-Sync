import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface WikiDetailPageProps {
  params: Promise<{ id: string; wikiId: string }>;
}

export default async function TaskWikiDetailPage({ params }: WikiDetailPageProps) {
  const { id: projectId, wikiId } = await params;
  if (!projectId || !wikiId) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: project }, { data: acceptedApp }] = await Promise.all([
    supabase.from("projects").select("id, team_leader_id").eq("id", projectId).single(),
    supabase
      .from("applications")
      .select("id")
      .eq("project_id", projectId)
      .eq("applicant_id", user.id)
      .eq("status", "accepted")
      .maybeSingle(),
  ]);

  const p = project as { id: string; team_leader_id: string | null } | null;
  const allowed =
    !!p && (p.team_leader_id === user.id || !!acceptedApp);
  if (!allowed) {
    redirect("/projects");
  }

  const { data: wiki, error } = await (supabase as any)
    .from("task_wiki_pages")
    .select("id, title, body, task_id, project_id, associated_status, updated_at")
    .eq("id", wikiId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (error || !wiki) {
    notFound();
  }

  const row = wiki as {
    id: string;
    title: string;
    body: string;
    task_id: string;
    associated_status?: string;
    updated_at?: string;
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href={`/projects/${projectId}/workspace/tasks`}
        className="inline-flex items-center gap-1 text-sm font-medium text-[#2563EB] hover:underline"
      >
        ← 업무 보드
      </Link>
      <header className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">{row.title}</h1>
        <p className="mt-2 text-xs text-gray-500">
          {row.associated_status ? `단계: ${row.associated_status}` : null}
          {row.updated_at ? ` · 갱신 ${new Date(row.updated_at).toLocaleString("ko-KR")}` : null}
        </p>
      </header>
      <article className="prose prose-sm prose-gray mt-6 max-w-none rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
          {row.body}
        </pre>
      </article>
      <p className="mt-4 text-center text-xs text-gray-400">
        <Link href={`/projects/${projectId}/workspace/tasks`} className="text-[#2563EB] hover:underline">
          업무 보드로 돌아가기
        </Link>
      </p>
    </div>
  );
}
