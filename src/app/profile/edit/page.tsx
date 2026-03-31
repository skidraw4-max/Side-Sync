"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProfileHeader from "@/components/ProfileHeader";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

const SUGGESTED_STACKS = ["Python", "Tailwind", "TypeScript", "Node.js"];
const POPULAR_SKILLS = [
  "React", "Figma", "Docker", "Swift", "Flutter", "Sketch", "AWS", "Kotlin",
  "Next.js", "PostgreSQL", "MongoDB", "GraphQL", "Vue", "Svelte", "Rust",
];

export default function ProfileEditPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [occupation, setOccupation] = useState("");
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
      (supabase as any)
        .from("profiles")
        .select("full_name, occupation, username, bio, avatar_url, tech_stack")
        .eq("id", user.id)
        .single()
        .then(({ data: rawData }: { data: unknown }) => {
          const data = rawData as {
            full_name: string | null;
            occupation: string | null;
            username: string | null;
            bio: string | null;
            avatar_url: string | null;
            tech_stack: string[];
          } | null;
          if (data) {
            setFullName(data.full_name ?? "");
            setOccupation(data.occupation ?? "");
            setUsername(data.username ?? "");
            setBio(data.bio ?? "");
            setSelectedStacks(Array.isArray(data.tech_stack) ? data.tech_stack : []);
            if (data.avatar_url) setAvatarPreview(data.avatar_url);
          }
          setIsAuthChecking(false);
        })
        .catch(() => setIsAuthChecking(false));
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
        email: user.email ?? null,
        full_name: fullName.trim() || null,
        occupation: occupation.trim() || null,
        username: username.trim() || null,
        bio: bio.trim() || null,
        tech_stack: selectedStacks.length > 0 ? selectedStacks : [],
        updated_at: new Date().toISOString(),
      };
      if (avatarUrl != null) payload.avatar_url = avatarUrl;

      const { error: upsertError } = await (supabase as any).from("profiles").upsert(
        payload as any,
        { onConflict: "id" }
      );

      if (upsertError) {
        setError(upsertError.message);
        setIsLoading(false);
        return;
      }

      router.push("/profile");
      router.refresh();
    } catch {
      setError("저장 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileHeader />

      <main className="px-6 py-10 md:px-12 lg:px-24">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900">프로필 편집</h1>
          <p className="mt-2 text-gray-500">
            프로필 정보를 수정하세요.
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
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
                    프로필 사진
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    JPG, PNG 또는 GIF. 최대 2MB. 권장 400x400.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-sm font-medium text-[#2563EB] hover:underline"
                  >
                    새 이미지 업로드
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

              {/* Name */}
              <div className="mt-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  이름
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="mt-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  직업 · 역할
                </label>
                <p className="mt-1 text-xs text-gray-500">마이페이지 이름 옆 태그(🚀)로 표시됩니다.</p>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="예: 프론트엔드 개발자"
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              {/* Bio */}
              <div className="mt-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  한 줄 소개
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="경험과 원하는 것을 간단히 소개해주세요..."
                  rows={4}
                  className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              {/* Tech Stacks */}
              <div className="mt-8">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  기술 스택
                </label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="스킬 검색 (e.g. React, Docker...)"
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
                          aria-label={`제거 ${s}`}
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
                  추천 스택
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
              <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                <Link
                  href="/profile"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← 프로필로 돌아가기
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-lg bg-[#2563EB] px-8 py-3 font-medium text-white shadow-lg transition-colors hover:bg-[#1d4ed8] disabled:opacity-70"
                >
                  {isLoading ? "저장 중..." : "저장하기"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer variant="stitch" />
    </div>
  );
}
