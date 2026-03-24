import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "skidraw4@gmail.com";

async function ensureAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user && user.email?.toLowerCase() === ADMIN_EMAIL ? user : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await ensureAdmin();
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id } = await params;
  const body = (await req.json()) as {
    title?: string;
    content?: string;
    category?: string;
    pinned?: boolean;
  };

  const supabase = await createClient();
  let { error } = await (supabase as any)
    .from("announcements")
    .update({
      title: body.title?.trim(),
      content: body.content?.trim(),
      category: body.category?.trim(),
      pinned: typeof body.pinned === "boolean" ? body.pinned : undefined,
    })
    .eq("id", id);

  if (error?.message?.includes("pinned") || error?.message?.includes("category")) {
    const fallbackWithCategory = await (supabase as any)
      .from("announcements")
      .update({
        title: body.title?.trim(),
        content: body.content?.trim(),
        category: body.category?.trim(),
      })
      .eq("id", id);
    error = fallbackWithCategory.error;
    if (error?.message?.includes("category")) {
      const fallbackBare = await (supabase as any)
        .from("announcements")
        .update({
          title: body.title?.trim(),
          content: body.content?.trim(),
        })
        .eq("id", id);
      error = fallbackBare.error;
    }
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await ensureAdmin();
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await (supabase as any).from("announcements").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
