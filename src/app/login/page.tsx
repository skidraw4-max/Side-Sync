import Link from "next/link";
import Header from "@/components/Header";
import LoginForm from "@/components/LoginForm";
import SocialLoginButtons from "@/components/SocialLoginButtons";

type LoginPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message } = await searchParams;
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex flex-col items-center px-6 pt-20 pb-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="m7 17 5-5-5-5" />
                  <path d="m17 7-5 5 5 5" />
                </svg>
              </div>
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
          <LoginForm />

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
