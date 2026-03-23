import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPublicSiteOriginFromRequest } from "@/lib/public-site-url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteOrigin = getPublicSiteOriginFromRequest(request);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/projects";
  if (!next.startsWith("/")) {
    next = "/projects";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${siteOrigin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${siteOrigin}/login?message=Could not authenticate`
  );
}
