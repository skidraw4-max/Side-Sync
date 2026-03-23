"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import ProjectSubNav from "@/components/Navigation/ProjectSubNav";
import { createClient } from "@/lib/supabase/client";
import { getDemoProjectById } from "@/lib/demo-projects";

interface ProjectAreaChromeProps {
  projectId: string;
  initialProjectTitle: string;
  children: React.ReactNode;
}

export default function ProjectAreaChrome({
  projectId,
  initialProjectTitle,
  children,
}: ProjectAreaChromeProps) {
  const pathname = usePathname() ?? "";
  const [projectTitle, setProjectTitle] = useState(initialProjectTitle);

  useEffect(() => {
    setProjectTitle(initialProjectTitle);
  }, [initialProjectTitle]);

  useEffect(() => {
    if (initialProjectTitle.trim()) return;

    let cancelled = false;
    (async () => {
      const demo = getDemoProjectById(projectId);
      if (demo?.title) {
        if (!cancelled) setProjectTitle(demo.title);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase.from("projects").select("title").eq("id", projectId).maybeSingle();
      const t = (data as { title?: string } | null)?.title;
      if (!cancelled && t) setProjectTitle(t);
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, initialProjectTitle]);

  const isWorkspace = pathname.includes("/workspace");

  return (
    <div className="project-area-chrome">
      <div className="sticky top-14 z-40 border-b border-slate-200 bg-slate-50/95 px-4 py-2.5 backdrop-blur-sm md:px-8 lg:px-12">
        <Breadcrumb projectId={projectId} projectTitle={projectTitle} />
      </div>
      {!isWorkspace ? <ProjectSubNav projectId={projectId} /> : null}
      {children}
    </div>
  );
}
