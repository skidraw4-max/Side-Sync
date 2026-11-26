import type { Metadata } from "next";
import Header from "@/components/Header";
import HomeBentoGrid from "@/components/bento/HomeBentoGrid";
import Footer from "@/components/Footer";
import AdBanner from "@/components/AdBanner";
import { ADSENSE_CLIENT_ID, ADSENSE_SLOTS } from "@/lib/ads-config";

export const metadata: Metadata = {
  title: {
    absolute: "Side-Sync | 단기 일자리와 공수 관리",
  },
  description:
    "오늘 필요한 단기 인력을 빠르게 찾고, 시프트·공수·예상 인건비를 한 곳에서 관리하세요.",
  alternates: {
    canonical: "https://sidesync.io",
  },
  openGraph: {
    title: "Side-Sync | 단기 일자리와 공수 관리",
    description:
      "단기 시프트 매칭부터 근무 공수와 인건비 관리까지 한 곳에서 운영하세요.",
    url: "https://sidesync.io",
    siteName: "Side-Sync",
    locale: "ko_KR",
    images: [{ url: "/images/og-image.png" }],
  },
  other: {
    "jury-site-verification": "wERxahGGgIOAAeK_ZcRN0VA-pii6yUKhFD3IwekhTk0",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#e8ecf1]">
      <Header />
      <main className="page-content-scale pt-[calc(3.5rem/var(--page-content-scale))] md:pt-[calc(6rem/var(--page-content-scale))]">
        <HomeBentoGrid />
      </main>
      <div className="mx-auto max-w-4xl px-4 pb-4 md:pb-5">
        <AdBanner
          adSlotId={ADSENSE_SLOTS.homeFooter}
          adClientId={ADSENSE_CLIENT_ID || undefined}
          className="w-full"
        />
      </div>
      <Footer />
    </div>
  );
}
