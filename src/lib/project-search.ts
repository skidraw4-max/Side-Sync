/**
 * 공백으로 구분된 검색어 토큰 (빈 문자열 제거)
 */
export function tokenizeSearchQuery(q: string): string[] {
  return q
    .trim()
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export type ProjectSearchableRow = {
  title: string;
  description?: string | null;
  goal?: string | null;
  summary?: string | null;
  content?: string | null;
  tech_stack?: string[] | null;
};

/**
 * 모든 토큰이 title, summary, content, description, goal, tech_stack 어딘가에
 * 대소문자 구분 없이 부분 일치하면 true (AND)
 */
export function projectMatchesSearchTokens(row: ProjectSearchableRow, tokens: string[]): boolean {
  if (tokens.length === 0) return true;

  const parts: string[] = [row.title];
  if (row.summary) parts.push(row.summary);
  if (row.content) parts.push(row.content);
  if (row.description) parts.push(row.description);
  if (row.goal) parts.push(row.goal);
  if (Array.isArray(row.tech_stack)) parts.push(...row.tech_stack);

  const hay = parts.join(" ").toLowerCase();

  return tokens.every((tok) => hay.includes(tok.toLowerCase()));
}
