import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NotificationsCenter from "@/components/NotificationsCenter";

export const metadata: Metadata = {
  title: "알림 | Side-Sync",
  description: "알림 및 AI 프로젝트 추천",
};

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 md:px-6">
        <h1 className="text-2xl font-bold text-gray-900">알림</h1>
        <p className="mt-1 text-sm text-gray-500">
          전체 알림과 AI 기반 프로젝트 추천을 한곳에서 확인하세요.
        </p>
        <NotificationsCenter />
      </main>
      <Footer variant="compact" />
    </div>
  );
}
