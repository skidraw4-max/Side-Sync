import Header from "@/components/Header";
import HomeExploreSection from "@/components/HomeExploreSection";
import Footer from "@/components/Footer";
import Ads from "@/components/Ads";
import { ADSENSE_CLIENT_ID, ADSENSE_SLOTS } from "@/lib/ads-config";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-16">
        <HomeExploreSection />
      </main>
      <div className="mx-auto max-w-4xl px-4 pb-6">
        <Ads
          adClientId={ADSENSE_CLIENT_ID}
          adSlotId={ADSENSE_SLOTS.homeFooter}
        />
      </div>
      <Footer />
    </div>
  );
}
