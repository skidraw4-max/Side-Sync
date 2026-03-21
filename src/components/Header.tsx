"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { signOutClient } from "@/lib/auth/client-sign-out";
import { useServerHydratedSession } from "@/contexts/AuthSessionContext";
import NotificationDropdown from "@/components/NotificationDropdown";
import { BrandLogoWordmark } from "@/components/BrandLogo";

interface HeaderProps {
  variant?: "default" | "onboarding";
}

const NAV_LINKS = {
  default: [
    { label: "Explore", href: "/#trending-projects" },
    { label: "About", href: "/about" },
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

export default function Header({ variant = "default" }: HeaderProps) {
  const serverSession = useServerHydratedSession();
  const [user, setUser] = useState<User | null>(() => serverSession?.user ?? null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [authReady, setAuthReady] = useState(() => serverSession !== undefined);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function applySession(session: Session | null) {
      if (cancelled) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const { data: p } = await supabase.from("profiles").select("avatar_url, full_name").eq("id", u.id).single();
        if (!cancelled) setProfile(p ?? null);
      } else {
        setProfile(null);
      }
      setAuthReady(true);
    }

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

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOutClient();
  };

  const links = NAV_LINKS[variant];
  const isLoggedIn = !!user;

  const navLinkClass =
    "whitespace-nowrap text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 md:text-[15px]";

  const signInButtonClass =
    "inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

  const RightSection = () => (
    <>
      {variant === "onboarding" ? (
        <Link href="/login" className={signInButtonClass}>
          Sign In
        </Link>
      ) : !authReady ? (
        <div className="h-10 w-[88px] shrink-0 animate-pulse rounded-xl bg-slate-200" aria-hidden aria-busy />
      ) : isLoggedIn ? (
        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-slate-200 transition-opacity hover:opacity-90"
              aria-label="프로필 메뉴"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={
                    profile.full_name
                      ? `${profile.full_name}님의 프로필 사진`
                      : "내 프로필 사진"
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-400 to-pink-500 text-sm font-medium text-white">
                  {(profile?.full_name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
                </div>
              )}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate-100 bg-white py-2 shadow-xl">
                <Link href="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                  마이페이지
                </Link>
                <button type="button" onClick={handleLogout} className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Link href="/login" className={signInButtonClass}>
          Sign In
        </Link>
      )}
    </>
  );

  const CenterNav = () => (
    <nav className="flex min-w-0 flex-wrap items-center justify-center gap-4 sm:gap-8 md:gap-10" aria-label="메인">
      {variant === "onboarding" ? (
        links.map(({ label, href }) => (
          <Link key={label} href={href} className={navLinkClass}>
            {label}
          </Link>
        ))
      ) : !authReady ? (
        <div className="hidden h-5 w-40 animate-pulse rounded bg-slate-100 md:block" aria-hidden />
      ) : isLoggedIn ? (
        <>
          <Link
            href="/projects/create"
            className="hidden items-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-600 hover:text-white sm:inline-flex"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            새 프로젝트
          </Link>
          <Link href="/projects" className={navLinkClass}>
            내 프로젝트
          </Link>
        </>
      ) : (
        links.map(({ label, href }) => (
          <Link key={label} href={href} className={navLinkClass}>
            {label}
          </Link>
        ))
      )}
    </nav>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 md:gap-8 md:px-8 lg:px-12">
        {/* 좌: 로고 + Side-Sync */}
        <div className="min-w-0 shrink-0">
          <BrandLogoWordmark size={36} />
        </div>

        {/* 중앙: Explore · About */}
        <div className="min-w-0 flex-1 px-2">
          <CenterNav />
        </div>

        {/* 우: Sign In 등 */}
        <div className="shrink-0">
          <RightSection />
        </div>
      </div>
    </header>
  );
}
