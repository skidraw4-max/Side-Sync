"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

const SUGGESTED_STACKS = ["Python", "Tailwind", "TypeScript", "Node.js"];
const POPULAR_SKILLS = [
  "React", "Figma", "Docker", "Swift", "Flutter", "Sketch", "AWS", "Kotlin",
  "Next.js", "PostgreSQL", "MongoDB", "GraphQL", "Vue", "Svelte", "Rust",
];

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [selectedStacks, setSelectedStacks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setIsAuthChecking(false);
    });
  }, [router]);

  const toggleStack = (skill: string) => {
    setSelectedStacks((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const removeStack = (skill: string) => {
    setSelectedStacks((prev) => prev.filter((s) => s !== skill));
  };

  const filteredSuggestions = SUGGESTED_STACKS.filter(
    (s) =>
      !selectedStacks.includes(s) &&
      s.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPopular = POPULAR_SKILLS.filter(
    (s) =>
      !selectedStacks.includes(s) &&
      s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      let avatarUrl: string | null = null;

      if (avatarFile) {
        // avatars 버킷이 없으면 생성 (서버 API 호출)
        await fetch("/api/storage/ensure-bucket", { method: "POST" });

        const ext = avatarFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });

        if (uploadError) {
          setError(uploadError.message || "이미지 업로드 실패");
          setIsLoading(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(path);
        avatarUrl = publicUrl;
      }

      const payload: Record<string, unknown> = {
        id: user.id,
        full_name: fullName.trim() || null,
        username: username.trim() || null,
        bio: bio.trim() || null,
        tech_stack: selectedStacks.length > 0 ? selectedStacks : [],
        updated_at: new Date().toISOString(),
      };
      if (avatarUrl != null) payload.avatar_url = avatarUrl;

      const { error: upsertError } = await supabase.from("profiles").upsert(
        payload,
        { onConflict: "id" }
      );

      if (upsertError) {
        setError(upsertError.message);
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("저장 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  if (isAuthChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header variant="onboarding" />

      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Sidebar - Step 1 of 4 */}
        <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white md:block">
          <div className="p-8">
            <h2 className="text-lg font-bold text-gray-900">Onboarding</h2>
            <p className="mt-1 text-sm text-gray-500">Step 1 of 4</p>
            <nav className="mt-8 space-y-1">
              <div className="flex items-center gap-3 rounded-lg bg-[#2563EB]/10 px-4 py-3">
                <div className="h-1 w-1 shrink-0 rounded-full bg-[#2563EB]" />
                <span className="font-medium text-[#2563EB]">Profile</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Preferences</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Team</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Finish</span>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-6 py-10 md:px-12">
          <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900">
              Complete Your Profile to Join a Team
            </h1>
            <p className="mt-2 text-gray-500">
              Tell us about yourself and your skills to find the perfect squad.
            </p>

            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              {/* Profile Photo */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-[#2563EB] hover:bg-blue-50/50"
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <svg className="h-12 w-12 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13v2a2 2 0 01-2 2h-2" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#2563EB] text-white shadow-md hover:bg-[#1d4ed8]"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Profile Photo
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    JPG, PNG or GIF. Max 2MB. Recommended 400x400.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-sm font-medium text-[#2563EB] hover:underline"
                  >
                    Upload New Image
                  </button>
                </div>
              </div>

              {/* Username */}
              <div className="mt-8">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Username
                </label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. alex_dev"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pr-10 pl-4 text-gray-900 placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
                </div>
              </div>

              {/* Full name - 디자인에 "이름" 요구 */}
              <div className="mt-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              {/* Bio */}
              <div className="mt-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a little bit about your experience and what you're looking for..."
                  rows={4}
                  className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              {/* Tech Stacks */}
              <div className="mt-8">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Tech Stacks
                </label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search skills (e.g. React, Docker...)"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                  <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {selectedStacks.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedStacks.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-3 py-1.5 text-sm font-medium text-white"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => removeStack(s)}
                          className="rounded-full p-0.5 hover:bg-white/20"
                          aria-label={`Remove ${s}`}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Suggested Stacks
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleStack(s)}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {filteredPopular.slice(0, 8).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleStack(s)}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="mt-6 text-sm text-red-600">{error}</p>
              )}

              {/* Actions */}
              <div className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-70"
                >
                  Skip for now
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-[#2563EB] px-8 py-3 font-medium text-white shadow-lg transition-colors hover:bg-[#1d4ed8] disabled:opacity-70 sm:w-auto"
                >
                  {isLoading ? "저장 중..." : "등록 완료"}
                </button>
              </div>
            </div>

            {/* Benefits footer */}
            <div className="mt-16 grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB]/10">
                  <svg className="h-5 w-5 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">Private & Secure</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Your data is encrypted and we never share your info.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB]/10">
                  <svg className="h-5 w-5 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">Auto-Matching</h3>
                <p className="mt-2 text-sm text-gray-500">
                  We match you with the best teammates based on skills.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB]/10">
                  <svg className="h-5 w-5 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">Free Portfolio</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Showcase your projects and grow your profile for free.
                </p>
              </div>
            </div>
          </form>
        </main>
      </div>

      <Footer variant="stitch" />
    </div>
  );
}
