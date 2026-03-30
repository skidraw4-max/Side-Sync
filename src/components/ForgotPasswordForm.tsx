"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getOAuthRedirectOrigin } from "@/lib/public-site-url";

const COOLDOWN_SEC = 60;

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN_SEC);
  }, []);

  const sendReset = useCallback(async () => {
    const origin = getOAuthRedirectOrigin();
    const redirectTo =
      origin && origin.length > 0
        ? `${origin}/reset-password`
        : "https://sidesync.io/reset-password";

    try {
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    } catch {
      /* 성공/실패와 관계없이 동일 UI */
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    await sendReset();
    setSent(true);
    setIsLoading(false);
    startCooldown();
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email.trim()) return;
    setIsLoading(true);
    await sendReset();
    setIsLoading(false);
    startCooldown();
  };

  if (sent) {
    return (
      <div className="mt-8 space-y-5">
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-5 text-sm leading-relaxed text-gray-800">
          <p className="text-gray-700">가입된 계정이라면 메일을 보냈습니다.</p>
          <p className="mt-3 font-medium text-gray-900">
            가입하신 이메일로 재설정 링크를 보내드렸습니다.
          </p>
          <p className="mt-3 text-gray-700">
            5분 내로 메일이 오지 않는다면 스팸 메일함을 확인하거나 다시 시도해 주세요.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={cooldown > 0 || isLoading}
            className="rounded-xl border border-[#1e293b] bg-white px-4 py-3 text-sm font-medium text-[#1e293b] transition-colors hover:bg-[#1e293b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#1e293b]"
          >
            {isLoading ? "전송 중..." : cooldown > 0 ? `${cooldown}초 후 재전송 가능` : "재전송"}
          </button>
          <Link
            href="/login"
            className="text-center text-sm font-medium text-[#2563EB] hover:underline sm:text-right"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-5">
      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">
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
            id="forgot-email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </div>
      <p className="text-xs leading-relaxed text-gray-500">
        입력하신 주소로 비밀번호 재설정 링크를 보냅니다. 가입 시 사용한 이메일을 입력해 주세요.
      </p>
      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full rounded-xl bg-[#2563EB] py-3.5 text-base font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-70"
      >
        {isLoading ? "처리 중..." : "재설정 링크 보내기"}
      </button>
    </form>
  );
}
