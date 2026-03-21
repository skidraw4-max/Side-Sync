/**
 * Supabase Realtime(WebSocket) 구독 여부.
 * - DNS 실패(ERR_NAME_NOT_RESOLVED)·프록시 환경 등에서 소켓 오류 로그가 반복될 때는 끄고,
 *   REST만 사용(윈도 포커스 시 refetch 등)하면 됩니다.
 * - 실시간 갱신이 필요하면 Vercel 등에 NEXT_PUBLIC_ENABLE_SUPABASE_REALTIME=true 설정.
 */
export function shouldEnableSupabaseRealtimeSubscriptions(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_SUPABASE_REALTIME === "true";
}
