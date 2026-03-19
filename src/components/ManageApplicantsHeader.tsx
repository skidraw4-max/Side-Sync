"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import NotificationDropdown from "@/components/NotificationDropdown";

interface ManageApplicantsHeaderProps {
  projectId: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

const NAV_ITEMS = [
  { label: "Workspaces", href: "/projects" },
  { label: "Applicants", href: null },
  { label: "Resources", href: "#" },
];

export default function ManageApplicantsHeader({
  projectId,
  searchValue = "",
  onSearchChange,
}: ManageApplicantsHeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setAvatarUrl(data?.avatar_url ?? null));
  }, [user?.id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 md:px-8 lg:px-12">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="m7 17 5-5-5-5" />
            <path d="m17 7-5 5 5 5" />
          </svg>
        </div>
        <span className="text-xl font-bold text-slate-900">Side-Sync</span>
      </Link>

      <nav className="flex items-center gap-8">
        {NAV_ITEMS.map((item) => (
          item.label === "Applicants" ? (
            <span key={item.label} className="border-b-2 border-[#2563EB] pb-1 text-sm font-semibold text-[#2563EB]">
              Applicants
            </span>
          ) : (
            <Link
              key={item.label}
              href={item.href ?? "#"}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {item.label}
            </Link>
          )
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <NotificationDropdown />
        <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors" aria-label="설정">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        <div className="relative" ref={dropdownRef}>
          <Link href="/profile" className="block">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
                {user?.email?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
