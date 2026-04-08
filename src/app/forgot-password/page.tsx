import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import { BrandLogoMark } from "@/components/BrandLogo";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "비밀번호 찾기",
  description: "Side-Sync 계정 이메일로 비밀번호 재설정 링크를 받습니다.",
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex flex-col items-center px-6 pt-24 pb-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-8">
            <div className="flex items-center">
              <BrandLogoMark size={52} priority />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-gray-900">비밀번호 찾기</h1>
            <p className="mt-2 text-sm text-gray-500">
              가입 시 사용한 이메일을 입력하시면 재설정 링크를 보내드립니다.
            </p>
          </div>

          <ForgotPasswordForm />

          <p className="mt-8 text-center text-sm text-gray-600">
            <Link href="/login" className="font-medium text-[#2563EB] hover:underline">
              로그인으로 돌아가기
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
