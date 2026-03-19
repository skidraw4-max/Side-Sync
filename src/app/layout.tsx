import type { Metadata } from "next";
import "@fontsource/pretendard";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Side-Sync | Find your perfect side project partner",
  description:
    "Connect with developers and designers who share your passion. Build, learn, and grow together on projects that matter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
