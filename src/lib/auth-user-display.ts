import type { User } from "@supabase/supabase-js";

/**
 * `profiles` 테이블 값이 비어 있을 때 Supabase Auth `user.user_metadata`(Google: name, picture 등)로 보완합니다.
 */
export function getMergedDisplayName(user: User, profileFullName: string | null | undefined): string {
  const fromDb = profileFullName?.trim();
  if (fromDb) return fromDb;

  const m = user.user_metadata ?? {};
  if (typeof m.full_name === "string" && m.full_name.trim()) return m.full_name.trim();
  if (typeof m.name === "string" && m.name.trim()) return m.name.trim();
  if (typeof m.display_name === "string" && m.display_name.trim()) return m.display_name.trim();
  if (typeof m.preferred_username === "string" && m.preferred_username.trim()) {
    return m.preferred_username.trim();
  }

  if (user.email) {
    const local = user.email.split("@")[0];
    if (local) return local;
  }
  return "사용자";
}

export function getMergedAvatarUrl(user: User, profileAvatarUrl: string | null | undefined): string | null {
  const fromDb = profileAvatarUrl?.trim();
  if (fromDb) return fromDb;

  const m = user.user_metadata ?? {};
  if (typeof m.avatar_url === "string" && m.avatar_url.trim()) return m.avatar_url.trim();
  if (typeof m.picture === "string" && m.picture.trim()) return m.picture.trim();
  return null;
}
