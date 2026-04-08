"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    { label: "홈", href: "/" },
    { label: "프로젝트 탐색", href: "/explore" },
    { label: "내 프로젝트", href: "/projects" },
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

interface AnnouncementTickerItem {
  id: string;
  title: string;
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-5 w-6" aria-hidden>
      <span
        className={`absolute left-0 top-1 h-0.5 w-6 rounded-full bg-current transition-transform duration-200 ${
          open ? "translate-y-1.5 rotate-45" : ""
        }`}
      />
      <span
        className={`absolute left-0 top-1/2 h-0.5 w-6 -translate-y-1/2 rounded-full bg-current transition-opacity duration-200 ${
          open ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute bottom-1 left-0 h-0.5 w-6 rounded-full bg-current transition-transform duration-200 ${
          open ? "-translate-y-1.5 -rotate-45" : ""
        }`}
      />
    </span>
  );
}

export default function Header({ variant = "default" }: HeaderProps) {
  const pathname = usePathname();
  const serverSession = useServerHydratedSession();
  const [user, setUser] = useState<User | null>(() => serverSession?.user ?? null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [latestAnnouncement, setLatestAnnouncement] = useState<AnnouncementTickerItem | null>(null);
  const [authReady, setAuthReady] = useState(() => serverSession !== undefined);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);

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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      requestAnimationFrame(() => firstMobileLinkRef.current?.focus());
    }
  }, [mobileMenuOpen]);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const toggleMobileMenu = useCallback(() => setMobileMenuOpen((o) => !o), []);

  useEffect(() => {
    if (variant === "default" && !authReady) setMobileMenuOpen(false);
  }, [variant, authReady]);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function fetchLatestAnnouncement() {
      const { data } = await supabase
        .from("announcements")
        .select("id, title")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (isMounted) {
        setLatestAnnouncement((data as AnnouncementTickerItem | null) ?? null);
      }
    }

    void fetchLatestAnnouncement();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    await signOutClient();
  };

  const links = NAV_LINKS[variant];
  const isLoggedIn = !!user;

  const navLinkClass =
    "whitespace-nowrap text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 md:text-[15px]";

  const signInButtonClass =
    "inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 sm:px-5";

  const hamburgerButtonClass =
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2";

  const mobileNavLinkClass =
    "flex min-h-[52px] items-center rounded-xl px-4 text-lg font-semibold text-slate-800 transition hover:bg-slate-50 active:bg-slate-100";

  const mobileDrawerLinks = variant === "onboarding" ? NAV_LINKS.onboarding : NAV_LINKS.default;
  const showMobileNavLayer = variant === "onboarding" || (variant === "default" && authReady);

  const hamburgerButtonProps = {
    "aria-label": (mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기") as string,
    "aria-expanded": mobileMenuOpen,
    "aria-controls": "mobile-nav-panel" as const,
    onClick: toggleMobileMenu,
  };

  /** 모바일 좌측: 햄버거만 (로고 이미지 없음) */
  const renderMobileLeadingMenu = () => {
    if (variant === "onboarding") {
      return (
        <button type="button" className={hamburgerButtonClass} {...hamburgerButtonProps}>
          <HamburgerIcon open={mobileMenuOpen} />
        </button>
      );
    }
    if (!authReady) {
      return <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-200" aria-hidden aria-busy />;
    }
    return (
      <button type="button" className={hamburgerButtonClass} {...hamburgerButtonProps}>
        <HamburgerIcon open={mobileMenuOpen} />
      </button>
    );
  };

  /** 프로필 드롭다운 (데스크톱·모바일 우측 공통) */
  const renderProfileMenu = () => (
    <div className="relative shrink-0" ref={dropdownRef}>
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
              profile.full_name ? `${profile.full_name}님의 프로필 사진` : "내 프로필 사진"
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
          <Link href="/profile/edit" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
            프로필 수정
          </Link>
          <Link
            href="/projects/create"
            onClick={() => setDropdownOpen(false)}
            className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            새 프로젝트
          </Link>
          <button type="button" onClick={handleLogout} className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">
            로그아웃
          </button>
        </div>
      )}
    </div>
  );

  /** 우측 액션 (모바일·데스크톱 공통 한 번만 마운트 — ref/드롭다운 일관성) */
  const renderTrailingActions = () => {
    if (variant === "onboarding") {
      return (
        <Link href="/login" className={signInButtonClass}>
          Sign In
        </Link>
      );
    }
    if (!authReady) {
      return <div className="h-11 w-[88px] shrink-0 animate-pulse rounded-xl bg-slate-200" aria-hidden aria-busy />;
    }
    if (isLoggedIn) {
      return (
        <div className="flex min-h-[36px] min-w-0 shrink-0 items-center gap-2">
          <NotificationDropdown />
          {renderProfileMenu()}
        </div>
      );
    }
    return (
      <Link href="/login" className={signInButtonClass}>
        Sign In
      </Link>
    );
  };

  const renderCenterNav = () => (
    <nav className="flex min-w-0 flex-wrap items-center justify-center gap-4 sm:gap-8 md:gap-10" aria-label="메인">
      {variant === "onboarding" ? (
        links.map(({ label, href }) => (
          <Link key={label} href={href} className={navLinkClass}>
            {label}
          </Link>
        ))
      ) : !authReady ? (
        <div className="hidden h-5 w-40 animate-pulse rounded-xl bg-slate-100 md:block" aria-hidden />
      ) : isLoggedIn ? (
        <>
          <Link href="/" className={navLinkClass}>
            홈
          </Link>
          <Link href="/explore" className={navLinkClass}>
            프로젝트 탐색
          </Link>
          <Link href="/projects" className={navLinkClass}>
            내 프로젝트
          </Link>
          <Link href="/about" className={navLinkClass}>
            About
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
    <header className="sticky top-0 z-50 min-h-14 border-b border-slate-200 bg-white">
      {variant === "default" && latestAnnouncement ? (
        <Link
          href="/announcements"
          className="block border-b border-blue-100 bg-blue-50/80 px-4 py-2 text-center text-xs text-blue-800 hover:bg-blue-100/70 md:px-8"
        >
          <span className="font-semibold">공지</span>
          <span className="mx-2">•</span>
          <span className="truncate align-middle">{latestAnnouncement.title}</span>
        </Link>
      ) : null}
      <div className="relative mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 md:gap-8 md:px-8 lg:px-12">
        {/* 좌: 모바일 햄버거 | 데스크톱 로고+이미지+텍스트 */}
        <div className="z-10 min-w-0 shrink-0">
          <div className="md:hidden">{renderMobileLeadingMenu()}</div>
          <div className="hidden md:block">
            <BrandLogoWordmark size={40} />
          </div>
        </div>

        {/* 중앙: 데스크톱 네비만 */}
        <div className="hidden min-w-0 flex-1 justify-center px-2 md:flex">
          {renderCenterNav()}
        </div>

        {/* 모바일: 헤더 가로 중앙 로고 */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-0 flex -translate-y-1/2 justify-center md:hidden">
          <BrandLogoWordmark size={36} className="pointer-events-auto" />
        </div>

        {/* 우: Sign In · 알림 · 프로필 (한 번만 마운트) */}
        <div className="z-10 shrink-0">{renderTrailingActions()}</div>
      </div>

      {showMobileNavLayer ? (
        <>
          <div
            className={`fixed inset-0 z-[60] bg-slate-900/40 transition-opacity duration-200 ease-out md:hidden ${
              mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={!mobileMenuOpen}
            onClick={closeMobileMenu}
          />
          <div
            id="mobile-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label="사이드 메뉴"
            className={`fixed inset-y-0 right-0 z-[61] flex w-[min(100%,20rem)] flex-col bg-white shadow-2xl transition-transform duration-200 ease-out md:hidden ${
              mobileMenuOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-semibold text-slate-900">메뉴</span>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                aria-label="메뉴 닫기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4" aria-label="모바일 메인">
              {mobileDrawerLinks.map(({ label, href }, index) => (
                <Link
                  key={label}
                  ref={index === 0 ? firstMobileLinkRef : undefined}
                  href={href}
                  onClick={closeMobileMenu}
                  className={mobileNavLinkClass}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {variant === "default" && isLoggedIn ? (
              <div className="border-t border-slate-100 px-2 py-3">
                <Link href="/profile" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                  마이페이지
                </Link>
                <Link href="/profile/edit" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                  프로필 수정
                </Link>
                <Link href="/projects/create" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                  새 프로젝트
                </Link>
                <button type="button" onClick={() => void handleLogout()} className={`${mobileNavLinkClass} w-full text-left`}>
                  로그아웃
                </button>
              </div>
            ) : null}

            {!isLoggedIn ? (
              <div className="border-t border-slate-100 px-4 py-4">
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="text-sm font-medium text-slate-500 transition hover:text-[#2563EB]"
                >
                  Sign In
                </Link>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </header>
  );
}
