import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import LoginForm from "@/components/LoginForm";
import SocialLoginButtons from "@/components/SocialLoginButtons";

type LoginPageProps = {
  searchParams: Promise<{ message?: string; next?: string; redirectTo?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message, next, redirectTo } = await searchParams;
  const afterLogin = next || redirectTo;
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex flex-col items-center px-6 pt-20 pb-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <Image
                src="/logo-side-sync.png"
                alt="Side-Sync"
                width={40}
                height={40}
                className="rounded-2xl object-cover"
                priority
              />
              <span className="text-xl font-semibold text-[#2563EB]">Side-Sync</span>
            </div>
            <h1 className="mt-6 text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p className="mt-2 text-sm text-gray-500">
              Login to your Side-Sync account
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
            <span className="text-sm text-gray-500">Or continue with</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <SocialLoginButtons />

          <p className="mt-8 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-[#2563EB] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
