"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function safeInternalPath(path: string | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/projects";
  return path;
}

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
        ...(rememberMe && { options: { persistSession: true } as Record<string, unknown> }),
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      router.push(safeInternalPath(redirectTo));
      router.refresh();
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          이메일
        </label>
        <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-gray-400"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <input
            id="email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none"
            autoComplete="email"
          />
        </div>
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          비밀번호
        </label>
        <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-gray-400"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            id="password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none"
            autoComplete="current-password"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
          />
          <span className="text-sm text-gray-700">로그인 상태 유지</span>
        </label>
        <Link
          href="#"
          className="text-sm font-medium text-[#2563EB] hover:underline"
        >
          비밀번호를 잊으셨나요?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-6 w-full rounded-xl bg-[#2563EB] py-3.5 text-base font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-70"
      >
        {isLoading ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
