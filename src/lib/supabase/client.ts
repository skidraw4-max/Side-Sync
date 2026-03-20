import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * GoTrue 기본 navigator.locks + React Strict Mode / 연속 요청 시 steal → AbortError
 * ("Lock broken by another request with the 'steal' option.") 가 발생할 수 있음.
 * @see https://github.com/supabase/supabase/issues/42505
 *
 * 단일 탭·일반 앱에서는 세션 직렬화를 Lock 없이 처리해도 실사용에 문제 없는 경우가 많음.
 * (다중 탭에서 동시 세션 쓰기 경합이 극히 드물면 동일)
 */
async function authLockNoOp<R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> {
  return fn();
}

export function createClient() {
  // Vercel: env vars는 Project Settings에 설정 필요. 없으면 placeholder 사용하여 크래시 방지
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      lock: authLockNoOp,
    },
  });
}
