"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * 클라이언트에서 직접 `auth.signOut()` 호출 시 Navigator Lock 경합으로
 * `AbortError: Lock broken by another request with the 'steal' option` 이 날 수 있음.
 * 서버 API로 쿠키·세션을 먼저 정리하고, 실패 시에만 local 범위로 보조 로그아웃 시도 후 홈으로 이동.
 */
export async function signOutClient(): Promise<void> {
  try {
    const res = await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    }
  } catch {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
  }
  // 전체 리로드로 React·쿠키 상태 동기화 (router.push만으로는 세션 잔존할 수 있음)
  window.location.assign("/");
}
