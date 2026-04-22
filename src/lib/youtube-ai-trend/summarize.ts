/**
 * Gemini로 유튜브 자막 요약 (MIT / DeepMind 스타일 분리)
 */

import type { YoutubeIngestSource } from "./channels";

function stripCodeFences(s: string): string {
  return s
    .replace(/^```[\w]*\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();
}

async function geminiGenerate(prompt: string, maxOut = 8192): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxOut,
        temperature: 0.35,
      },
    }),
  });

  if (!res.ok) return null;
  const j = (await res.json().catch(() => null)) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  } | null;
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
  const out = typeof text === "string" ? text.trim() : "";
  return out ? stripCodeFences(out) : null;
}

/** 영어 자막 → 한국어 번역 + 이후 단계에서 요약에 사용 */
export async function translateTranscriptToKorean(enTranscript: string, videoTitle: string): Promise<string | null> {
  const prompt = [
    "다음은 유튜브 영상의 영어 자막입니다. 한국어로만, 문맥이 자연스럽게 번역하세요.",
    "영상 제목 참고:",
    videoTitle,
    "",
    "자막:",
    enTranscript.slice(0, 100_000),
  ].join("\n");
  return geminiGenerate(prompt, 65536);
}

export async function summarizeYoutubeForAnnouncement(
  source: YoutubeIngestSource,
  videoTitle: string,
  transcriptKoOrEn: string,
  transcriptWasTranslated: boolean
): Promise<string | null> {
  const langNote = transcriptWasTranslated
    ? "아래 텍스트는 원문 영어 자막을 한국어로 번역한 것입니다."
    : "아래 텍스트는 한국어 자막에서 추출한 것입니다.";

  if (source === "mit") {
    const prompt = [
      "당신은 대학 강의를 정리하는 교육 콘텐츠 에디터입니다.",
      langNote,
      "",
      `영상 제목: ${videoTitle}`,
      "",
      "다음 자막을 바탕으로 **대학 강의 요약본** 스타일의 본문만 작성하세요.",
      "요구사항:",
      "- 반드시 **한국어**로, 정중하고 지적인 어조.",
      "- 핵심 이론, 개념 정의, **수식이 언급되면 그 의미와 역할**을 짧게 설명.",
      "- 강의 흐름에 맞는 소제목(##)을 사용해도 좋습니다.",
      "- 마지막에 **결론·학습 포인트**를 정리.",
      "- 유튜브 링크·영상 소개 문구·코드펜스(```)는 넣지 마세요.",
      "",
      "자막:",
      transcriptKoOrEn.slice(0, 100_000),
    ].join("\n");
    return geminiGenerate(prompt, 8192);
  }

  const prompt = [
    "당신은 AI 산업을 다루는 기술 저널리스트입니다.",
    langNote,
    "",
    `영상 제목: ${videoTitle}`,
    "",
    "다음 자막을 바탕으로 **최신 기술 리포트** 스타일의 본문만 작성하세요.",
    "요구사항:",
    "- 반드시 **한국어**로, 정중하고 지적인 어조.",
    "- 이번 발표·연구의 핵심 내용과, **AI 산업·연구 생태계에 미치는 영향**을 구체적으로 강조.",
    "- 소제목(##)으로 구조화해도 좋습니다.",
    "- 유튜브 링크·코드펜스(```)는 넣지 마세요.",
    "",
    "자막:",
    transcriptKoOrEn.slice(0, 100_000),
  ].join("\n");
  return geminiGenerate(prompt, 8192);
}
