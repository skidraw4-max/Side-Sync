"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Workspaces", href: "/projects" },
  { label: "My Page", href: "/profile" },
];

export default function ProfileHeader() {
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    avatarUrl?: string | null;
    fullName?: string | null;
    email?: string | null;
  } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("id", u.id)
        .single();
      setUser({
        id: u.id,
        avatarUrl: profile?.avatar_url ?? null,
        fullName: profile?.full_name ?? null,
        email: u.email ?? null,
      });
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const supabaseClient = createClient();
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("avatar_url, full_name")
          .eq("id", session.user.id)
          .single();
        setUser({
          id: session.user.id,
          avatarUrl: profile?.avatar_url ?? null,
          fullName: profile?.full_name ?? null,
          email: session.user.email ?? null,
        });
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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
    const supabase = createClient();
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 md:px-12 lg:px-24">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m7 17 5-5-5-5" />
            <path d="m17 7-5 5 5 5" />
          </svg>
        </div>
        <span className="text-xl font-semibold text-gray-800">Side-Sync</span>
      </Link>

      <nav className="flex items-center gap-6 md:gap-8">
        {NAV_LINKS.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className={`text-sm font-medium transition-colors ${
              href === "/profile"
                ? "border-b-2 border-[#2563EB] text-[#2563EB]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <Link
          href="/profile/edit"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
        <button
          type="button"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Notifications"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13 3a2 2 0 0 1-2 2c0-.7.3-1.4.7-1.9" />
          </svg>
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex h-9 w-9 overflow-hidden rounded-full border-2 border-gray-200 hover:border-gray-300"
            aria-label="Profile menu"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-400 to-pink-500 text-sm font-medium text-white">
                {(user?.fullName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
              </div>
            )}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                My Page
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
