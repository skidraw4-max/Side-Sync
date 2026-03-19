import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * 서버 전용 Admin 클라이언트 - RLS 우회
 * SUPABASE_SERVICE_ROLE_KEY가 있을 때만 사용 (보안 주의)
 */
export function createAdminClient() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !serviceRoleKey) return null;
    return createClient<Database>(url, serviceRoleKey);
  } catch {
    return null;
  }
}
