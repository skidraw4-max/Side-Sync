import type { Metadata } from "next";
import Header from "@/components/Header";
import ProjectAreaChrome from "@/components/ProjectAreaChrome";
import { createClient } from "@/lib/supabase/server";
import { getDemoProjectById } from "@/lib/demo-projects";

interface ProjectIdLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const demo = getDemoProjectById(id);
  if (demo) {
    return {
      title: demo.title,
      description:
        demo.description.length > 155 ? `${demo.description.slice(0, 152)}…` : demo.description,
    };
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("title, description")
    .eq("id", id)
    .maybeSingle();
  const p = data as { title?: string; description?: string | null } | null;
  const title = p?.title?.trim() ? p.title : "프로젝트";
  const raw = p?.description?.trim();
  const description =
    raw && raw.length > 0
      ? raw.length > 155
        ? `${raw.slice(0, 152)}…`
        : raw
      : `${title} 모집 상세·지원 방법. Side-Sync에서 사이드 프로젝트 팀원을 만나 보세요.`;
  return { title, description };
}

export default async function ProjectIdLayout({ children, params }: ProjectIdLayoutProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("title").eq("id", id).maybeSingle();
  const title = (data as { title?: string } | null)?.title ?? "";

  return (
    <>
      <Header />
      <ProjectAreaChrome projectId={id} initialProjectTitle={title}>
        {children}
      </ProjectAreaChrome>
    </>
  );
}
