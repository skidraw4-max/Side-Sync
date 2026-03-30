import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getPublicSiteOriginFromRequest } from "@/lib/public-site-url";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];
const PROTECTED_ROUTES = ["/onboarding", "/projects", "/workspace", "/profile", "/notifications"];
const PROJECTS_PATH = "/projects";
const ONBOARDING_PATH = "/onboarding";

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isConfigured =
    supabaseUrl &&
    supabaseUrl !== "https://placeholder.supabase.co" &&
    supabaseAnonKey &&
    supabaseAnonKey !== "placeholder-key";

  if (!isConfigured) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const siteOrigin = getPublicSiteOriginFromRequest(request);

  if (user) {
    const applyCookiesToRedirect = (redirectResponse: NextResponse) => {
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    };

    if (isAuthRoute(pathname)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tech_stack")
        .eq("id", user.id)
        .single();

      const techStack = (profile as { tech_stack?: unknown } | null)?.tech_stack ?? [];
      const hasTechStack = Array.isArray(techStack) && techStack.length > 0;

      const redirectUrl = hasTechStack
        ? new URL(PROJECTS_PATH, siteOrigin)
        : new URL(ONBOARDING_PATH, siteOrigin);
      return applyCookiesToRedirect(NextResponse.redirect(redirectUrl));
    }

    if (pathname.startsWith(ONBOARDING_PATH)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tech_stack")
        .eq("id", user.id)
        .single();

      const techStack = (profile as { tech_stack?: unknown } | null)?.tech_stack ?? [];
      const hasTechStack = Array.isArray(techStack) && techStack.length > 0;

      if (hasTechStack) {
        return applyCookiesToRedirect(
          NextResponse.redirect(new URL(PROJECTS_PATH, siteOrigin))
        );
      }
    }

    if (pathname === PROJECTS_PATH || pathname === `${PROJECTS_PATH}/`) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tech_stack")
        .eq("id", user.id)
        .single();

      const techStack = (profile as { tech_stack?: unknown } | null)?.tech_stack ?? [];
      const hasTechStack = Array.isArray(techStack) && techStack.length > 0;

      if (!hasTechStack) {
        return applyCookiesToRedirect(
          NextResponse.redirect(new URL(ONBOARDING_PATH, siteOrigin))
        );
      }
    }
  } else {
    if (isProtectedRoute(pathname)) {
      const loginUrl = new URL("/login", siteOrigin);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
