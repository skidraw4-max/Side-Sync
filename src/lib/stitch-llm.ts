/**
 * Stitch / LLM 추천 코멘트 생성
 *
 * 우선순위:
 * 1) STITCH_HTTP_PROMPT_URL — MCP/프록시가 { prompt } 를 받아 { text } 를 반환하는 HTTP 엔드포인트
 * 2) STITCH_MCP_URL — Streamable HTTP MCP로 JSON-RPC 시도 (인증은 STITCH_ACCESS_TOKEN 등)
 * 3) GEMINI_API_KEY — Google AI Studio 키로 Gemini 호출 (Stitch 미구성 시 로컬/스테이징용)
 *
 * 모두 실패 시 null → 호출부에서 기본 문구 사용.
 */

const FALLBACK_NULL = null as string | null;

function stripCodeFences(s: string): string {
  return s
    .replace(/^```[\w]*\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();
}

/** STITCH_HTTP_PROMPT_URL POST { prompt } → { text } | { comment } | { result } */
async function tryHttpPromptProxy(fullPrompt: string): Promise<string | null> {
  const url = process.env.STITCH_HTTP_PROMPT_URL?.trim();
  if (!url) return FALLBACK_NULL;

  const token = process.env.STITCH_HTTP_TOKEN?.trim();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ prompt: fullPrompt }),
  });

  if (!res.ok) return FALLBACK_NULL;
  const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!j) return FALLBACK_NULL;
  const text =
    typeof j.text === "string"
      ? j.text
      : typeof j.comment === "string"
        ? j.comment
        : typeof j.result === "string"
          ? j.result
          : typeof j.output === "string"
            ? j.output
            : null;
  const out = text?.trim();
  return out ? stripCodeFences(out) : FALLBACK_NULL;
}

/** Stitch MCP 엔드포인트 JSON-RPC (환경에 따라 동작이 다를 수 있음) */
async function tryStitchMcpJsonRpc(fullPrompt: string): Promise<string | null> {
  const base = process.env.STITCH_MCP_URL?.trim() || "https://stitch.googleapis.com/mcp";
  const access = process.env.STITCH_ACCESS_TOKEN?.trim() || process.env.GOOGLE_ACCESS_TOKEN?.trim();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (access) headers.Authorization = `Bearer ${access}`;

  try {
    const res = await fetch(base, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: process.env.STITCH_MCP_TOOL_NAME?.trim() || "generate_text",
          arguments: {
            prompt: fullPrompt,
            maxOutputTokens: 256,
          },
        },
      }),
    });

    if (!res.ok) return FALLBACK_NULL;
    const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!j || "error" in j) return FALLBACK_NULL;

    const result = j.result as Record<string, unknown> | undefined;
    const content = result?.content;
    if (Array.isArray(content) && content[0] && typeof (content[0] as { text?: string }).text === "string") {
      const t = (content[0] as { text: string }).text.trim();
      return t ? stripCodeFences(t) : FALLBACK_NULL;
    }
    if (typeof result?.text === "string" && result.text.trim()) {
      return stripCodeFences(result.text.trim());
    }
  } catch {
    return FALLBACK_NULL;
  }

  return FALLBACK_NULL;
}

/** Gemini REST (GEMINI_API_KEY) */
async function tryGeminiFlash(fullPrompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return FALLBACK_NULL;

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        maxOutputTokens: 256,
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) return FALLBACK_NULL;
  const j = (await res.json().catch(() => null)) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  } | null;
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
  const out = typeof text === "string" ? text.trim() : "";
  return out ? stripCodeFences(out) : FALLBACK_NULL;
}

/**
 * 팀 빌딩용 한 줄 추천 코멘트 생성.
 * 실패 시 null (호출부에서 기본 문구로 대체).
 */
export async function generateStitchRecommendationComment(fullPrompt: string): Promise<string | null> {
  const proxy = await tryHttpPromptProxy(fullPrompt);
  if (proxy) return proxy;

  const mcp = await tryStitchMcpJsonRpc(fullPrompt);
  if (mcp) return mcp;

  const gemini = await tryGeminiFlash(fullPrompt);
  if (gemini) return gemini;

  return FALLBACK_NULL;
}

export const DEFAULT_AI_RECOMMENDATION_FALLBACK =
  "사용자님의 스택에 꼭 맞는 프로젝트입니다.";
