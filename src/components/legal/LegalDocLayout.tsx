import Link from "next/link";
import type { ReactNode } from "react";

export type LegalTocItem = { id: string; label: string };

interface LegalDocLayoutProps {
  title: string;
  titleEn?: string;
  lastUpdated: string;
  intro: ReactNode;
  toc: LegalTocItem[];
  active: "terms" | "privacy";
  children: ReactNode;
}

export default function LegalDocLayout({
  title,
  titleEn,
  lastUpdated,
  intro,
  toc,
  active,
  children,
}: LegalDocLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-8">
          <Link href="/" className="text-lg font-bold tracking-tight text-gray-900">
            Side-Sync
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#2563EB]"
            >
              홈
            </Link>
            <Link
              href="/terms"
              className={`rounded-lg px-3 py-2 transition-colors ${
                active === "terms"
                  ? "bg-blue-50 font-semibold text-[#2563EB]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#2563EB]"
              }`}
            >
              이용약관
            </Link>
            <Link
              href="/privacy"
              className={`rounded-lg px-3 py-2 transition-colors ${
                active === "privacy"
                  ? "bg-blue-50 font-semibold text-[#2563EB]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#2563EB]"
              }`}
            >
              개인정보처리방침
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 md:px-8 md:py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
          {/* Sticky Table of Contents */}
          <aside className="w-full shrink-0 lg:w-56 xl:w-64">
            <nav
              aria-label="문서 목차"
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:sticky lg:top-28"
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                퀵 메뉴
              </p>
              <p className="mb-4 text-xs text-slate-400">목차로 바로 이동</p>
              <ul className="space-y-1">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-blue-50 hover:text-[#2563EB]"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  도움이 필요하신가요?
                </p>
                <Link
                  href="/"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  홈으로 돌아가기
                </Link>
              </div>
            </nav>
          </aside>

          {/* Main column */}
          <div className="min-w-0 flex-1">
            {/* Hero intro card */}
            <section id="doc-intro" className="scroll-mt-28">
              <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{title}</h1>
                    {titleEn ? (
                      <p className="mt-1 text-sm font-medium text-slate-500">{titleEn}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-600">
                    마지막 업데이트: {lastUpdated}
                  </span>
                </div>
                <div className="prose prose-blue mt-6 max-w-none prose-p:text-slate-700 prose-strong:text-[#2563EB]">
                  {intro}
                </div>
              </div>
            </section>

            {children}
          </div>
        </div>

        <footer className="mt-16 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Side-Sync. All rights reserved.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-4">
            <Link href="/terms" className="hover:text-[#2563EB]">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-[#2563EB]">
              개인정보처리방침
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
