import Header from "@/components/Header";
import ProjectAreaChrome from "@/components/ProjectAreaChrome";
import { createClient } from "@/lib/supabase/server";

interface ProjectIdLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
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
