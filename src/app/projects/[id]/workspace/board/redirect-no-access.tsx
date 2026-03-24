"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BoardAccessDeniedRedirect({ projectId }: { projectId: string }) {
  const router = useRouter();

  useEffect(() => {
    window.alert("워크스페이스 게시판 접근 권한이 없습니다.");
    router.replace(`/projects/${projectId}`);
  }, [projectId, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-600">
      권한 확인 중입니다...
    </div>
  );
}
