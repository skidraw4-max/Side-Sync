import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// 빌드 시 환경 변수가 없을 수 있으므로 placeholder 사용 (런타임에 .env.local 필요)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
