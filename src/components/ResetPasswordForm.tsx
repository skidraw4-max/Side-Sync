"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [fatal, setFatal] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const markReady = () => {
      if (cancelled || doneRef.current) return;
      doneRef.current = true;
      setReady(true);
      setChecking(false);
      subRef.current?.unsubscribe();
      subRef.current = null;
    };

    doneRef.current = false;
    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (exchangeError) {
          setFatal("링크가 유효하지 않거나 만료되었습니다.");
          setChecking(false);
          return;
        }
        url.searchParams.delete("code");
        window.history.replaceState({}, "", `${url.pathname}${url.hash}`);
        markReady();
        return;
      }

      const { data: first } = await supabase.auth.getSession();
      if (cancelled) return;
      if (first.session) {
        markReady();
        return;
      }

      const { data: subData } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled || !session) return;
        if (event === "PASSWORD_RECOVERY") {
          markReady();
        }
        if (event === "SIGNED_IN") {
          const hash = window.location.hash;
          if (hash.includes("type=recovery")) {
            markReady();
          }
        }
      });
      subRef.current = subData.subscription;

      await new Promise((r) => setTimeout(r, 2000));
      if (cancelled || doneRef.current) return;
      const { data: second } = await supabase.auth.getSession();
      if (second.session) {
        markReady();
        return;
      }

      await new Promise((r) => setTimeout(r, 2000));
      if (cancelled || doneRef.current) return;
      const { data: third } = await supabase.auth.getSession();
      if (third.session) {
        markReady();
        return;
      }

      if (!cancelled && !doneRef.current) {
        setFatal("유효하지 않거나 만료된 링크입니다. 비밀번호 찾기를 다시 시도해 주세요.");
        setChecking(false);
        subRef.current?.unsubscribe();
        subRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
      subRef.current?.unsubscribe();
      subRef.current = null;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }
      await supabase.auth.signOut();
      window.alert("비밀번호가 변경되었습니다.");
      router.push("/login");
      router.refresh();
    } catch {
      setError("비밀번호 변경 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <p className="mt-8 text-center text-sm text-gray-500">링크를 확인하는 중입니다…</p>
    );
  }

  if (fatal) {
    return (
      <div className="mt-8 space-y-4 text-center">
        <p className="text-sm text-red-600">{fatal}</p>
        <Link
          href="/forgot-password"
          className="inline-block text-sm font-medium text-[#2563EB] hover:underline"
        >
          비밀번호 찾기로 이동
        </Link>
      </div>
    );
  }

  if (!ready) {
    return null;
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-5">
      <div>
        <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700">
          새 비밀번호
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
            id="reset-password"
            type="password"
            placeholder="8자 이상 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label htmlFor="reset-confirm" className="block text-sm font-medium text-gray-700">
          비밀번호 확인
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
            id="reset-confirm"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={isLoading}
        className="mt-6 w-full rounded-xl bg-[#2563EB] py-3.5 text-base font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-70"
      >
        {isLoading ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
