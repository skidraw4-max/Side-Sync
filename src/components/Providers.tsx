"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthSessionProvider } from "@/contexts/AuthSessionContext";
import NotificationRealtimeListener from "./NotificationRealtimeListener";
import BottomNav from "./BottomNav";

export default function Providers({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1분
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider initialSession={initialSession}>
        <NotificationRealtimeListener />
        <div className="min-h-screen pb-16 md:pb-0">{children}</div>
        <BottomNav />
        <Toaster position="top-center" richColors />
      </AuthSessionProvider>
    </QueryClientProvider>
  );
}
