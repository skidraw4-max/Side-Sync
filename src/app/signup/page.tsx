import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import SignupForm from "@/components/SignupForm";
import SocialLoginButtons from "@/components/SocialLoginButtons";

export const metadata: Metadata = {
  title: "회원가입",
  description:
    "Side-Sync에 가입하고 사이드 프로젝트 팀 빌딩, 전용 워크스페이스, 링크드인 연동 활동 확인서 기능을 시작하세요.",
  robots: { index: true, follow: true },
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex flex-col items-center px-6 pt-24 pb-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-2 text-sm text-gray-500">
            Join Side-Sync today to start syncing your workflow
          </p>

          <SignupForm />

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Or sign up with
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <SocialLoginButtons />

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#2563EB] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
      <footer className="py-8 text-center">
        <p className="text-sm text-gray-400">
          © 2024 Side-Sync Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
