import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { Database } from "@/types/database";

/**
 * OAuth PKCE 콜백 등 Route Handler에서 사용.
 * `cookies()`만 쓰면 리다이렉트 응답에 Set-Cookie가 누락되어 exchangeCodeForSession이
 * 실패하거나 세션이 저장되지 않는 경우가 있어, 요청 Cookie + 응답 객체에 직접 연결합니다.
 */
export function createRouteHandlerClient(request: Request, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("cookie") ?? "").map(
          ({ name, value }) => ({ name, value: value ?? "" })
        );
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
    global: {
      fetch: (url, options = {}) =>
        fetch(url, {
          ...options,
          cache: "no-store",
        }),
    },
  });
}

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component 등에서 cookie set 불가 시 무시
        }
      },
    },
    // Next.js App Router가 fetch를 캐시하면 지원 직후 상세에서 status가 갱신되지 않을 수 있음
    global: {
      fetch: (url, options = {}) =>
        fetch(url, {
          ...options,
          cache: "no-store",
        }),
    },
  });
}
