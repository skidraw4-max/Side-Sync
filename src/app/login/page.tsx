import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import LoginForm from "@/components/LoginForm";
import SocialLoginButtons from "@/components/SocialLoginButtons";

export const metadata: Metadata = {
  title: "로그인",
  description:
    "Side-Sync에 로그인하여 사이드 프로젝트 탐색, 팀 지원, 워크스페이스 협업 및 활동 확인서를 이용하세요.",
  robots: { index: false, follow: true },
};

type LoginPageProps = {
  searchParams: Promise<{ message?: string; next?: string; redirectTo?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message, next, redirectTo } = await searchParams;
  const afterLogin = next || redirectTo;
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex flex-col items-center px-6 pt-24 pb-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
            <p className="mt-2 text-sm text-gray-500">
              Side-Sync 계정으로 로그인하고 사이드 프로젝트를 이어가세요.
            </p>
          </div>

          {message && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {message}
            </p>
          )}
          <LoginForm redirectTo={afterLogin} />

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium tracking-wide text-gray-500">
              또는 다음으로 로그인
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <SocialLoginButtons />

          <p className="mt-8 text-center text-sm text-gray-600">
            아직 계정이 없으신가요?{" "}
            <Link href="/signup" className="font-medium text-[#2563EB] hover:underline">
              회원 가입
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
