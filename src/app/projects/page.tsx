import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import Header from "@/components/Header";
import ProjectList from "@/components/ProjectList";
import Footer from "@/components/Footer";
import CreateProjectFloatingButton from "@/components/CreateProjectFloatingButton";
import { createClient } from "@/lib/supabase/server";

// Server Component 캐시 방지: cookies() 참조로 동적 렌더링, revalidate = 0
export const revalidate = 0;

export default async function ProjectsPage() {
  // 캐시 무효화: cookies() 읽기로 이 페이지를 항상 동적으로 렌더링
  await cookies();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <CreateProjectFloatingButton />
      <main className="pt-[100px]">
        <div className="px-6 md:px-12 lg:px-24">
          <nav className="mb-8 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900">Projects</span>
          </nav>
        </div>
        <div className="mt-24">
          <ProjectList userId={user.id} />
        </div>
      </main>
      <Footer variant="compact" />
    </div>
  );
}
