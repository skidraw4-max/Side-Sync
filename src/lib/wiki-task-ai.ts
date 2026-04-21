/**
 * 업무 설명을 바탕으로 위키 마크다운 초안을 생성합니다 (Gemini).
 * 서버( Route Handler )에서만 호출하세요. `GEMINI_API_KEY` 미설정 시 null.
 */

function stripCodeFences(s: string): string {
  return s
    .replace(/^```[\w]*\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();
}

/**
 * 기획 의도·범위·API·테스트 등 목차형 위키 초안을 반환합니다.
 */
export async function generateTaskWikiDraftMarkdown(
  taskTitle: string,
  taskDescription: string | null
): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const desc = (taskDescription ?? "").trim();
  const prompt = [
    "당신은 소프트웨어 팀의 기술 문서 작성자입니다.",
    "아래 업무 제목과 설명을 바탕으로, 팀 위키에 붙일 마크다운 초안만 출력하세요.",
    "반드시 한국어로 작성하고, 다음 섹션 제목을 포함하세요 (내용은 업무에 맞게 채움):",
    "- `# {업무 제목}` (첫 줄)",
    "- `## 기획 의도`",
    "- `## 범위·요구사항`",
    "- `## API·인터페이스 명세` (해당 없으면 '해당 없음 또는 추후 정의' 형태로 짧게)",
    "- `## 테스트 케이스` (불릿 목록)",
    "설명이 비어 있으면 제목만으로 합리적으로 추정해 채웁니다.",
    "코드 블록 래퍼(```)는 사용하지 마세요. 마크다운 본문만 출력하세요.",
    "",
    `[업무 제목]\n${taskTitle.trim()}`,
    "",
    `[업무 설명]\n${desc || "(작성 없음)"}`,
  ].join("\n");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.45,
      },
    }),
  });

  if (!res.ok) return null;
  const j = (await res.json().catch(() => null)) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  } | null;
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
  const out = typeof text === "string" ? text.trim() : "";
  if (!out) return null;
  const cleaned = stripCodeFences(out);
  return cleaned.length > 0 ? cleaned.slice(0, 32000) : null;
}
