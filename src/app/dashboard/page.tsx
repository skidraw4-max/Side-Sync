"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import MyProjectsSection from "@/components/MyProjectsSection";

/**
 * 참여 중인 프로젝트: `MyProjectsSection` → `useMyProjects` →
 * `applications`: `.eq("applicant_id", userId)` + `.eq("status", APPLICATION_STATUS.ACCEPTED)` (소문자, user_id 컬럼 없음)
 */
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />
      <main className="px-6 py-12 md:px-12 lg:px-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-2 text-gray-500">
            프로필 등록이 완료되었습니다. 프로젝트를 둘러보거나 새로 만들어보세요.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/projects"
              className="rounded-lg bg-[#2563EB] px-6 py-3 font-medium text-white transition-colors hover:bg-[#1d4ed8]"
            >
              프로젝트 둘러보기
            </Link>
            <Link
              href="/projects/create"
              className="rounded-lg border-2 border-[#2563EB] bg-white px-6 py-3 font-medium text-[#2563EB] transition-colors hover:bg-[#2563EB]/5"
            >
              새 프로젝트 만들기
            </Link>
            <Link
              href="/dashboard/applicants"
              className="rounded-lg border-2 border-emerald-500 bg-white px-6 py-3 font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
            >
              지원자 관리 대시보드
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-gray-200 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              메인으로
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-6xl">
          <MyProjectsSection />
        </div>
      </main>
      <Footer variant="stitch" />
    </div>
  );
}
