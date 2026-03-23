function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/** 대표 스택과 모집 포지션 라벨이 같은 역할로 볼 수 있는지 (부분 일치 허용) */
export function stacksMatch(primary: string, roleLabel: string): boolean {
  const p = normalize(primary);
  const r = normalize(roleLabel);
  if (!p || !r) return false;
  return r.includes(p) || p.includes(r);
}

export function buildSituationSentence(
  slotRole: string,
  total: number,
  joined: number,
  pending: number,
  shortage: number
): string {
  return `'${slotRole}' 포지션은 정원 ${total}명 중 합류 ${joined}명·지원 검토 중 ${pending}명이며, 비어 있는 자리는 약 ${shortage}명 분입니다.`;
}

export function buildStitchPrompt(params: {
  primaryStack: string;
  projectTitle: string;
  situation: string;
}): string {
  return `당신은 팀 빌딩 전문가입니다. [${params.primaryStack}] 스택을 대표로 하는 사용자에게 프로젝트 「${params.projectTitle}」을(를) 추천하는 설득력 있는 알림 코멘트를 작성해 주세요.

프로젝트 상황은 다음과 같습니다: ${params.situation}

요구사항: 한국어로, 한두 문장 이내로 짧고 강렬하게. 따옴표로 감싸지 말고 본문만 출력하세요.`;
}
