/**
 * 채널 RSS에서 최근 동영상 목록 추출 (API 키 불필요)
 */

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export interface RssVideoEntry {
  videoId: string;
  title: string;
}

export async function fetchRecentVideosFromChannelRss(
  channelId: string,
  maxEntries = 15
): Promise<RssVideoEntry[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`RSS HTTP ${res.status}`);
  }
  const xml = await res.text();
  const out: RssVideoEntry[] = [];
  const parts = xml.split("<entry>");
  for (let i = 1; i < parts.length && out.length < maxEntries; i++) {
    const block = parts[i].split("</entry>")[0] ?? "";
    const videoId = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim();
    const titleRaw = block.match(/<title(?:[^>]*)>([^<]*)<\/title>/)?.[1]?.trim();
    if (videoId && titleRaw) {
      out.push({ videoId, title: decodeXmlEntities(titleRaw) });
    }
  }
  return out;
}
