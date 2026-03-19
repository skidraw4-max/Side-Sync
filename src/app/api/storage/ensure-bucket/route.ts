import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * avatars 버킷이 없으면 생성합니다.
 * 프로필 이미지 업로드 전에 호출해 bucket not found 오류를 방지합니다.
 */
export async function POST() {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Service role not configured" },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabase.storage.createBucket("avatars", {
      public: true,
    });

    // 버킷이 이미 있으면 에러가 나오지만 무시
    if (error) {
      if (error.message?.includes("already exists") || error.message?.toLowerCase().includes("duplicate")) {
        return NextResponse.json({ ok: true, created: false });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, created: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create bucket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
