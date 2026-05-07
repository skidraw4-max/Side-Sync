import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "공지사항",
  description:
    "Side-Sync 서비스 업데이트, 이용 가이드, 정책 안내 등 공식 공지와 샘플 가이드 글을 확인하세요.",
};

export default function AnnouncementsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="page-content-scale pt-[calc(3.5rem/var(--page-content-scale))] md:pt-[calc(6rem/var(--page-content-scale))]">{children}</div>
      <Footer />
    </div>
  );
}
