import Header from "@/components/Header";
import HomeExploreSection from "@/components/HomeExploreSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-16">
        <HomeExploreSection />
      </main>
      <Footer />
    </div>
  );
}
