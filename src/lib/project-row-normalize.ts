/**
 * PostgREST/레거시 데이터에서 문자열·숫자·JSON 문자열 등이 섞일 수 있어
 * 카드·목록 가공 시 .trim() TypeError를 막기 위한 유틸.
 */

export function coerceDisplayString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return "";
  return String(value).trim();
}

export function normalizeProjectTitle(title: unknown): string {
  const s = coerceDisplayString(title);
  return s || "제목 없음";
}

export function normalizeProjectDescription(desc: unknown): string | undefined {
  const s = coerceDisplayString(desc);
  return s || undefined;
}

/** tech_stack: string[] | 콤마 문자열 | JSON 배열 문자열 | null 등 */
export function normalizeTechStackForCard(stack: unknown): string[] {
  if (stack == null) return [];

  if (Array.isArray(stack)) {
    return stack
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item == null) return "";
        if (typeof item === "number" && Number.isFinite(item)) return String(item);
        return String(item).trim();
      })
      .filter((s) => s.length > 0);
  }

  if (typeof stack === "string") {
    const t = stack.trim();
    if (t.startsWith("[") && t.endsWith("]")) {
      try {
        const parsed = JSON.parse(t) as unknown;
        if (Array.isArray(parsed)) return normalizeTechStackForCard(parsed);
      } catch {
        /* fall through */
      }
    }
    return t
      .split(/[,|]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  return [];
}

export function normalizeGradientForCard(gradient: unknown, fallback: string): string {
  const s = coerceDisplayString(gradient);
  return s || fallback;
}
