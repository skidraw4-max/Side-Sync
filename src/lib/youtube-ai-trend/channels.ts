/**
 * AI TREND 자동 수집 채널 → 공지 카테고리 매핑
 */
export type YoutubeIngestSource = "mit" | "deepmind";

export interface YoutubeAiTrendChannelConfig {
  /** YouTube channel ID (UC…) */
  channelId: string;
  /** announcements.category */
  category: "lab" | "trend";
  source: YoutubeIngestSource;
  labelKo: string;
}

export const YOUTUBE_AI_TREND_CHANNELS: readonly YoutubeAiTrendChannelConfig[] = [
  {
    channelId: "UCEBb1b_L6zK60zhSg9iGksw",
    category: "lab",
    source: "mit",
    labelKo: "MIT OpenCourseWare",
  },
  {
    channelId: "UCP7jMX8924L9AgI47VI797w",
    category: "trend",
    source: "deepmind",
    labelKo: "Google DeepMind",
  },
] as const;
