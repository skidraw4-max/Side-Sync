"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

const AuthSessionContext = createContext<Session | null | undefined>(undefined);

/**
 * 서버(Root Layout)에서 읽은 Supabase 세션을 클라이언트 트리에 전달합니다.
 * 전체 `use client` 페이지에서도 헤더가 로그인 상태를 즉시 표시할 수 있습니다.
 */
export function AuthSessionProvider({
  children,
  initialSession,
}: {
  children: ReactNode;
  /** 서버에서 getSession()으로 얻은 값 (없으면 null) */
  initialSession: Session | null;
}) {
  return (
    <AuthSessionContext.Provider value={initialSession}>{children}</AuthSessionContext.Provider>
  );
}

export function useServerHydratedSession(): Session | null | undefined {
  return useContext(AuthSessionContext);
}
