/**
 * 채널별 RSS → 자막 → (번역) → 요약 → announcements 삽입
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { YoutubeAiTrendChannelConfig, YoutubeIngestSource } from "./channels";
import { YOUTUBE_AI_TREND_CHANNELS } from "./channels";
import { fetchRecentVideosFromChannelRss } from "./rss";
import { summarizeYoutubeForAnnouncement, translateTranscriptToKorean } from "./summarize";
import { fetchYoutubeTranscriptPreferKo } from "./transcript";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function videoAlreadyPosted(admin: NonNullable<ReturnType<typeof createAdminClient>>, videoId: string) {
  const { data } = await (admin as any)
    .from("announcements")
    .select("id")
    .eq("youtube_video_id", videoId)
    .maybeSingle();
  return !!data;
}

export interface IngestRunResult {
  channelId: string;
  category: string;
  source: YoutubeIngestSource;
  processed: number;
  skipped: number;
  errors: string[];
}

export async function runYoutubeAiTrendIngest(options?: {
  delayMs?: number;
  maxNewPerChannel?: number;
}): Promise<{ ok: boolean; results: IngestRunResult[]; message?: string }> {
  const delayMs = options?.delayMs ?? 5000;
  const maxNew = options?.maxNewPerChannel ?? 8;

  const authorId = process.env.YOUTUBE_INGEST_AUTHOR_ID?.trim();
  if (!authorId) {
    return {
      ok: false,
      results: [],
      message: "YOUTUBE_INGEST_AUTHOR_ID가 없습니다. 공지 author_id로 사용할 UUID를 설정하세요.",
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, results: [], message: "SUPABASE_SERVICE_ROLE_KEY가 없습니다." };
  }

  const results: IngestRunResult[] = [];

  for (const ch of YOUTUBE_AI_TREND_CHANNELS as readonly YoutubeAiTrendChannelConfig[]) {
    const r: IngestRunResult = {
      channelId: ch.channelId,
      category: ch.category,
      source: ch.source,
      processed: 0,
      skipped: 0,
      errors: [],
    };

    let entries: Awaited<ReturnType<typeof fetchRecentVideosFromChannelRss>>;
    try {
      entries = await fetchRecentVideosFromChannelRss(ch.channelId, 20);
    } catch (e) {
      r.errors.push(`RSS: ${e instanceof Error ? e.message : String(e)}`);
      results.push(r);
      continue;
    }

    let newCount = 0;
    for (const entry of entries) {
      if (newCount >= maxNew) break;

      const exists = await videoAlreadyPosted(admin, entry.videoId);
      if (exists) {
        r.skipped += 1;
        continue;
      }

      let tr;
      try {
        tr = await fetchYoutubeTranscriptPreferKo(entry.videoId);
      } catch {
        tr = null;
      }
      if (!tr) {
        r.skipped += 1;
        await sleep(delayMs);
        continue;
      }

      let textForSummary = tr.text;
      let wasTranslated = false;
      if (tr.locale === "en") {
        const translated = await translateTranscriptToKorean(tr.text, entry.title);
        if (!translated || translated.length < 80) {
          r.skipped += 1;
          await sleep(delayMs);
          continue;
        }
        textForSummary = translated;
        wasTranslated = true;
      }

      const summary = await summarizeYoutubeForAnnouncement(ch.source, entry.title, textForSummary, wasTranslated);
      if (!summary?.trim()) {
        r.errors.push(`${entry.videoId}: 요약 실패`);
        await sleep(delayMs);
        continue;
      }

      const { error } = await (admin as any).from("announcements").insert({
        title: entry.title.slice(0, 500),
        content: summary.trim(),
        category: ch.category,
        pinned: false,
        author_id: authorId,
        youtube_video_id: entry.videoId,
        ingest_source: ch.source,
      });

      if (error) {
        const code = (error as { code?: string }).code;
        const msg = error.message ?? "";
        if (code === "23505" || msg.includes("duplicate") || msg.includes("unique")) {
          r.skipped += 1;
        } else {
          r.errors.push(`${entry.videoId}: ${msg}`);
        }
        await sleep(delayMs);
        continue;
      }

      r.processed += 1;
      newCount += 1;
      await sleep(delayMs);
    }

    results.push(r);
  }

  return { ok: true, results };
}
