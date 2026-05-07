/** AIsle Hub LOUNGE( AI TREND ) 영역 최근 게시 HTML 파싱 — 공식 API 없음 */

export const AISLES_LOUNGE_LIST_URL = "https://www.aisleshub.com/?category=LOUNGE";
export const AISLES_ORIGIN = "https://www.aisleshub.com";

export type AislesNewsItem = {
  title: string;
  url: string;
  meta?: string;
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([\da-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 10)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** DOM 순서대로 `<a class="...recentLink..." href="/post/...">` 매칭 (class/href 속성 순서 무관) */
function findRecentPostAnchors(html: string): { path: string; block: string }[] {
  const results: { path: string; block: string }[] = [];
  const re = /<a\s+([^>]+)>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1];
    const block = m[2];
    if (!/class\s*=\s*"[^"]*recentLink[^"]*"/i.test(attrs)) continue;
    const hrefMatch = attrs.match(/\bhref\s*=\s*"(\/post\/[^"]+)"/i);
    if (!hrefMatch) continue;
    results.push({ path: hrefMatch[1], block });
  }
  return results;
}

function extractFromBlock(block: string): { title: string; meta?: string } {
  const titleM = block.match(/class="[^"]*recentTitle[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const metaM = block.match(/class="[^"]*recentMeta[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const titleRaw = titleM?.[1] ?? "";
  const metaRaw = metaM?.[1] ?? "";
  const title = decodeHtmlEntities(stripTags(titleRaw));
  const meta = metaRaw ? decodeHtmlEntities(stripTags(metaRaw)) : undefined;
  return { title, meta };
}

/**
 * LOUNGE 카테고리 목록 페이지에서 사이드바「최근 게시물」블록 기준으로 최대 `limit`개.
 */
export async function fetchAislesLoungeNews(limit = 5): Promise<AislesNewsItem[]> {
  try {
    const res = await fetch(AISLES_LOUNGE_LIST_URL, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; Side-Sync/1.0; +https://sidesync.io/bot)",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const rows = findRecentPostAnchors(html);
    const seen = new Set<string>();
    const items: AislesNewsItem[] = [];

    for (const { path, block } of rows) {
      if (seen.has(path)) continue;
      const { title, meta } = extractFromBlock(block);
      if (!title) continue;
      seen.add(path);
      items.push({
        title,
        url: `${AISLES_ORIGIN}${path}`,
        meta,
      });
      if (items.length >= limit) break;
    }

    return items;
  } catch {
    return [];
  }
}
