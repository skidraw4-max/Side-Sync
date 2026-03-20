"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { signOutClient } from "@/lib/auth/client-sign-out";
import { useServerHydratedSession } from "@/contexts/AuthSessionContext";
import NotificationDropdown from "@/components/NotificationDropdown";

interface HeaderProps {
  variant?: "default" | "onboarding";
}

const NAV_LINKS = {
  default: [
    { label: "Explore", href: "#" },
    { label: "About", href: "/onboarding" },
  ],
  onboarding: [
    { label: "Process", href: "#" },
    { label: "Support", href: "#" },
  ],
};

interface ProfileData {
  avatar_url: string | null;
  full_name: string | null;
}

/** 로고 심볼 (모바일용 작은 아이콘) */
function LogoSymbol({ className }: { className?: string }) {
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] ${className ?? ""}`}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7 17 5-5-5-5" />
        <path d="m17 7-5 5 5 5" />
      </svg>
    </div>
  );
}

/** 풀 로고 (데스크탑용: 심볼 + 텍스트) */
function FullLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`flex shrink-0 items-center gap-2 ${className ?? ""}`}>
      <LogoSymbol />
      <span className="text-xl font-semibold text-gray-800">Side-Sync</span>
    </Link>
  );
}

export default function Header({ variant = "default" }: HeaderProps) {
  const serverSession = useServerHydratedSession();
  const [user, setUser] = useState<User | null>(() => serverSession?.user ?? null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  /** 서버에서 세션을 넘겼으면 첫 페인트부터 로그인 UI (use client 전용 페이지 대응) */
  const [authReady, setAuthReady] = useState(() => serverSession !== undefined);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function applySession(session: Session | null) {
      if (cancelled) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const { data: p } = await supabase
          .from("profiles")
          .select("avatar_url, full_name")
          .eq("id", u.id)
          .single();
        if (!cancelled) setProfile(p ?? null);
      } else {
        setProfile(null);
      }
      setAuthReady(true);
    }

    // 서버에서 이미 유저가 있으면 프로필만 보강
    if (serverSession?.user) {
      void applySession(serverSession);
    } else {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        void applySession(session);
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [serverSession]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(typeof window !== "undefined" && window.scrollY > 50);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOutClient();
  };

  const links = NAV_LINKS[variant];
  const isLoggedIn = !!user;

  const RightSection = () => (
    <>
      {variant === "onboarding" ? (
        <Link href="/login" className="whitespace-nowrap rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]">
          Sign In
        </Link>
      ) : !authReady ? (
        <div
          className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-gray-200/80"
          aria-hidden
          aria-busy
        />
      ) : isLoggedIn ? (
        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-gray-200 transition-opacity hover:opacity-90"
              aria-label="프로필 메뉴"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-400 to-pink-500 text-sm font-medium text-white">
                  {(profile?.full_name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
                </div>
              )}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                <Link href="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  마이페이지
                </Link>
                <button type="button" onClick={handleLogout} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50">
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Link
          href="/login"
          className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
        >
          Sign In
        </Link>
      )}
    </>
  );

  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between gap-3 bg-white px-4 py-3 shadow-sm transition-colors duration-200 md:px-12 md:py-5 md:gap-6 lg:px-24 ${
        scrolled ? "md:bg-transparent md:shadow-none" : ""
      }`}
    >
      {/* 모바일: 심볼 로고만 + 오른쪽 알림·프로필 */}
      <div className="flex min-w-0 flex-1 items-center justify-between md:justify-start md:gap-6">
        <Link href="/" className="md:hidden flex shrink-0" aria-label="Side-Sync 홈">
          <LogoSymbol />
        </Link>

        {/* 데스크탑: 풀 로고 + GNB */}
        <div className="hidden md:flex md:min-w-0 md:flex-1 md:items-center md:gap-6">
          <FullLogo />
          <nav className="flex items-center gap-4 lg:gap-6">
            {variant === "onboarding" ? (
              links.map(({ label, href }) => (
                <Link key={label} href={href} className="whitespace-nowrap text-gray-700 transition-colors hover:text-gray-900">
                  {label}
                </Link>
              ))
            ) : !authReady ? (
              <div className="hidden h-10 w-48 animate-pulse rounded-lg bg-gray-100 md:block" aria-hidden />
            ) : isLoggedIn ? (
              <>
                <Link
                  href="/projects/create"
                  className="flex shrink-0 items-center gap-2 rounded-lg border-2 border-[#2563EB] bg-white px-4 py-2 text-sm font-medium text-[#2563EB] transition-colors hover:bg-[#2563EB] hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                  새 프로젝트
                </Link>
                <Link href="/projects" className="whitespace-nowrap text-gray-700 transition-colors hover:text-gray-900">
                  내 프로젝트
                </Link>
              </>
            ) : (
              links.map(({ label, href }) => (
                <Link key={label} href={href} className="whitespace-nowrap text-gray-700 transition-colors hover:text-gray-900">
                  {label}
                </Link>
              ))
            )}
          </nav>
        </div>
      </div>

      {/* 오른쪽: 알림 + 프로필 (모바일/데스크탑 공통) */}
      <div className="flex shrink-0 items-center gap-2">
        <RightSection />
      </div>
    </header>
  );
}
