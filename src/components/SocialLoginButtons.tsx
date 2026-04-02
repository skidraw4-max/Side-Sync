"use client";

import { useCallback, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AUTH, COMMON } from "@/lib/constants/contents";
import { getOAuthRedirectOrigin } from "@/lib/public-site-url";
import { isLikelyInAppBrowserBlockingGoogleOAuth } from "@/lib/in-app-browser";

interface SocialLoginButtonsProps {
  className?: string;
}

export default function SocialLoginButtons({ className = "mt-8" }: SocialLoginButtonsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showInAppModal, setShowInAppModal] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  const inAppLikely = useMemo(() => isLikelyInAppBrowserBlockingGoogleOAuth(), []);

  const startGoogleOAuth = useCallback(async () => {
    setIsLoading("google");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${getOAuthRedirectOrigin()}/auth/callback`,
        },
      });
      if (error) {
        console.error("Google sign in error:", error);
        setIsLoading(null);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      setIsLoading(null);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    if (inAppLikely) {
      setShowInAppModal(true);
      return;
    }
    await startGoogleOAuth();
  };

  const copyPageUrl = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2500);
    } catch {
      setCopyDone(false);
    }
  };

  const sharePageUrl = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = "Side-Sync 로그인";
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: AUTH.googleInAppModalBody.slice(0, 80) + "…",
          url,
        });
      }
    } catch {
      // 사용자 취소 등 — 무시
    }
  };

  const proceedFromModal = async () => {
    setShowInAppModal(false);
    await startGoogleOAuth();
  };

  return (
    <div className={className}>
      {inAppLikely ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900"
        >
          {AUTH.googleInAppBanner}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading !== null}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-70"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading === "google" ? "연결 중..." : "Google"}
        </button>
        <button
          type="button"
          disabled
          className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#03C75A] py-3 text-sm font-medium text-white opacity-60"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded bg-white font-bold text-[#03C75A] text-xs">
            N
          </span>
          Naver (준비 중)
        </button>
      </div>

      {showInAppModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="in-app-oauth-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 id="in-app-oauth-title" className="text-lg font-semibold text-gray-900">
              {AUTH.googleInAppModalTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{AUTH.googleInAppModalBody}</p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={copyPageUrl}
                className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8]"
              >
                {copyDone ? AUTH.copiedLoginUrl : AUTH.copyLoginUrl}
              </button>
              {typeof navigator !== "undefined" && typeof navigator.share === "function" ? (
                <button
                  type="button"
                  onClick={sharePageUrl}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  {AUTH.shareOpenInBrowser}
                </button>
              ) : null}
              <button
                type="button"
                onClick={proceedFromModal}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                {AUTH.tryGoogleAnyway}
              </button>
              <button
                type="button"
                onClick={() => setShowInAppModal(false)}
                className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-800"
              >
                {COMMON.close}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
