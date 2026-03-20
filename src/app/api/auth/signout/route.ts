import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/signout
 * 브라우저에서 supabase.auth.signOut() 시 Web Locks steal → AbortError 가 날 수 있어
 * 서버에서 세션/쿠키를 정리합니다.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[api/auth/signout]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/auth/signout]", e);
    return NextResponse.json({ error: "로그아웃 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
