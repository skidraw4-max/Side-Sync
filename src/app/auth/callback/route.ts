import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { getPublicSiteOriginFromRequest } from "@/lib/public-site-url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteOrigin = getPublicSiteOriginFromRequest(request);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  let next = searchParams.get("next") ?? "/projects";
  if (!next.startsWith("/")) {
    next = "/projects";
  }

  if (oauthError) {
    const detail = oauthErrorDescription
      ? decodeURIComponent(oauthErrorDescription.replace(/\+/g, " "))
      : oauthError;
    const message = encodeURIComponent(`OAuth: ${detail}`);
    return NextResponse.redirect(`${siteOrigin}/login?message=${message}`);
  }

  if (code) {
    const redirectResponse = NextResponse.redirect(`${siteOrigin}${next}`);
    const supabase = createRouteHandlerClient(request, redirectResponse);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectResponse;
    }
  }

  return NextResponse.redirect(
    `${siteOrigin}/login?message=Could not authenticate`
  );
}
