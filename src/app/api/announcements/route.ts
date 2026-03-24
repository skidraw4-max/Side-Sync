import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "skidraw4@gmail.com";

export async function GET() {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "관리자 클라이언트를 사용할 수 없습니다." }, { status: 500 });
  }

  const { data, error } = await (admin as any)
    .from("announcements")
    .select("id, title, content, category, pinned, created_at")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = (await req.json()) as {
    title?: string;
    content?: string;
    category?: string;
    pinned?: boolean;
  };

  if (!body.title?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "관리자 클라이언트를 사용할 수 없습니다." }, { status: 500 });
  }

  const { data, error } = await (admin as any)
    .from("announcements")
    .insert({
      title: body.title.trim(),
      content: body.content.trim(),
      category: body.category?.trim() || "general",
      pinned: !!body.pinned,
      author_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
