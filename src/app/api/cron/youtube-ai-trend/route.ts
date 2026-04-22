import { NextResponse } from "next/server";
import { runYoutubeAiTrendIngest } from "@/lib/youtube-ai-trend/ingest-runner";

export const maxDuration = 300;

/**
 * GET /api/cron/youtube-ai-trend
 * Vercel Cron 등: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const isProd =
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  const secret = process.env.CRON_SECRET?.trim();
  if (isProd && !secret) {
    return NextResponse.json({ error: "CRON_SECRET 미설정" }, { status: 503 });
  }
  if (secret) {
    const auth = request.headers.get("authorization")?.trim();
    const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    return NextResponse.json({ error: "GEMINI_API_KEY 없음" }, { status: 503 });
  }

  const out = await runYoutubeAiTrendIngest({ delayMs: 5000, maxNewPerChannel: 8 });
  if (!out.ok) {
    return NextResponse.json({ error: out.message ?? "실패", results: out.results }, { status: 500 });
  }

  return NextResponse.json({ ok: true, results: out.results });
}
