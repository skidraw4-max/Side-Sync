/**
 * 자막: 한국어 우선, 없으면 영어 (youtube-transcript)
 */

import { fetchTranscript } from "youtube-transcript";

function joinSegments(segments: { text: string }[]): string {
  return segments
    .map((s) => s.text.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export type TranscriptLocale = "ko" | "en";

export interface TranscriptResult {
  text: string;
  locale: TranscriptLocale;
}

/**
 * 자막 전문. 없거나 너무 짧으면 null (호출부에서 건너뜀).
 */
export async function fetchYoutubeTranscriptPreferKo(videoId: string): Promise<TranscriptResult | null> {
  try {
    const ko = await fetchTranscript(videoId, { lang: "ko" });
    const t = joinSegments(ko);
    if (t.length > 80) return { text: t.slice(0, 120_000), locale: "ko" };
  } catch {
    /* ko 없음 → en 시도 */
  }

  try {
    const en = await fetchTranscript(videoId, { lang: "en" });
    const t = joinSegments(en);
    if (t.length > 80) return { text: t.slice(0, 120_000), locale: "en" };
  } catch {
    /* 기본 트랙 */
  }

  try {
    const any = await fetchTranscript(videoId);
    const t = joinSegments(any);
    if (t.length <= 80) return null;
    const lang = String(any[0]?.lang ?? "").toLowerCase();
    const locale: TranscriptLocale = lang.startsWith("ko") ? "ko" : "en";
    return { text: t.slice(0, 120_000), locale };
  } catch {
    return null;
  }
}
