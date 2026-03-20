import type { Metadata } from "next";
import "@fontsource/pretendard";
import "./globals.css";
import Providers from "@/components/Providers";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Side-Sync | Find your perfect side project partner",
  description:
    "Connect with developers and designers who share your passion. Build, learn, and grow together on projects that matter.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="ko">
      <body className="antialiased font-sans">
        <Providers initialSession={session}>{children}</Providers>
      </body>
    </html>
  );
}
