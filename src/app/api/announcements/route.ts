import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "skidraw4@gmail.com";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("announcements")
    .select("id, title, content, category, pinned, created_at")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error?.message?.includes("pinned") || error?.message?.includes("category")) {
    const fallback = await (supabase as any)
      .from("announcements")
      .select("id, title, content, created_at")
      .order("created_at", { ascending: false });
    if (fallback.error) {
      return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    }
    const rows = ((fallback.data ?? []) as Array<{
      id: string;
      title: string;
      content: string;
      created_at: string;
    }>).map((r) => ({ ...r, category: "general", pinned: false }));
    return NextResponse.json({ data: rows });
  }

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

  let { data, error } = await (supabase as any)
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

  if (error?.message?.includes("pinned") || error?.message?.includes("category")) {
    const fallbackInsertWithCategory = await (supabase as any)
      .from("announcements")
      .insert({
        title: body.title.trim(),
        content: body.content.trim(),
        category: body.category?.trim() || "general",
        author_id: user.id,
      })
      .select("id")
      .single();
    data = fallbackInsertWithCategory.data;
    error = fallbackInsertWithCategory.error;
    if (error?.message?.includes("category")) {
      const fallbackInsertBare = await (supabase as any)
        .from("announcements")
        .insert({
          title: body.title.trim(),
          content: body.content.trim(),
          author_id: user.id,
        })
        .select("id")
        .single();
      data = fallbackInsertBare.data;
      error = fallbackInsertBare.error;
    }
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
