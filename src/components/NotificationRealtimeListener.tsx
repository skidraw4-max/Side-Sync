"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function NotificationRealtimeListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const setupSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const record = payload.new as {
              id: string;
              title: string;
              message: string;
              link: string | null;
            };
            if (!record) return;

            const handleClick = () => {
              if (record.link) router.push(record.link);
            };

            toast.custom(
              (id) => (
                <button
                  type="button"
                  onClick={handleClick}
                  className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-lg transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <p className="font-semibold text-gray-900">{record.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{record.message}</p>
                  {record.link && (
                    <p className="mt-2 text-sm text-[#2563EB]">클릭하여 이동 →</p>
                  )}
                </button>
              ),
              { duration: 5000 }
            );
          }
        );

      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 3000);
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            clearTimeout(timeout);
            resolve();
          }
        });
      });

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch {
          /* WebSocket이 아직 연결되지 않은 경우 무시 */
        }
      };
    };

    let unsubscribe: (() => void) | undefined;
    setupSubscription().then((cleanup) => {
      unsubscribe = cleanup;
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      unsubscribe?.();
      if (session?.user) {
        setupSubscription().then((cleanup) => {
          unsubscribe = cleanup;
        });
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubscribe?.();
    };
  }, [router]);

  return null;
}
