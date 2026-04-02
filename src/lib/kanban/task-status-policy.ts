/**
 * 업무 5단계(요청·진행·피드백·완료·보류) 전환 정책.
 * API·UI와 동일 규칙을 유지합니다.
 */

import type { KanbanTaskStatus } from "./constants";

/** 피드백 단계로 넘길 수 있는 사람: 담당자 또는 프로젝트 팀장 */
export function canUserMoveTaskToFeedback(params: {
  userId: string;
  assigneeId: string | null;
  teamLeaderId: string | null;
}): boolean {
  const { userId, assigneeId, teamLeaderId } = params;
  if (assigneeId != null && userId === assigneeId) return true;
  if (teamLeaderId != null && userId === teamLeaderId) return true;
  return false;
}

function isAssigneeOrLeader(
  userId: string,
  assigneeId: string | null,
  teamLeaderId: string | null
): boolean {
  return canUserMoveTaskToFeedback({ userId, assigneeId, teamLeaderId });
}

/** 요청자(또는 requested_by가 없을 때 팀장)로 간주되는지 */
export function isEffectiveTaskRequester(params: {
  userId: string;
  requestedBy: string | null;
  teamLeaderId: string | null;
}): boolean {
  const { userId, requestedBy, teamLeaderId } = params;
  if (requestedBy != null && userId === requestedBy) return true;
  if (requestedBy == null && teamLeaderId != null && userId === teamLeaderId) return true;
  return false;
}

/** 피드백·보류로 바꿀 때 코멘트 필수 */
export function transitionRequiresStatusComment(from: KanbanTaskStatus, to: KanbanTaskStatus): boolean {
  if (from === to) return false;
  return to === "feedback" || to === "on_hold";
}

export function validateStatusTransition(params: {
  from: KanbanTaskStatus;
  to: KanbanTaskStatus;
  userId: string;
  assigneeId: string | null;
  teamLeaderId: string | null;
  requestedBy: string | null;
  statusComment: string | null | undefined;
}): { ok: true } | { ok: false; error: string } {
  const { from, to, userId, assigneeId, teamLeaderId, requestedBy, statusComment } = params;
  if (from === to) return { ok: true };

  const comment = (statusComment ?? "").trim();
  const needComment = transitionRequiresStatusComment(from, to);
  if (needComment && !comment) {
    return { ok: false, error: "이 상태로 바꿀 때는 코멘트가 필요합니다." };
  }

  if (from === "completed") {
    return { ok: false, error: "완료된 업무의 상태는 바꿀 수 없습니다." };
  }

  if (to === "completed") {
    if (!isEffectiveTaskRequester({ userId, requestedBy, teamLeaderId })) {
      return { ok: false, error: "완료 처리는 요청자만 할 수 있습니다." };
    }
    if (from !== "feedback") {
      return { ok: false, error: "완료는 피드백 단계에서만 가능합니다." };
    }
    return { ok: true };
  }

  if (to === "feedback") {
    if (!canUserMoveTaskToFeedback({ userId, assigneeId, teamLeaderId })) {
      return { ok: false, error: "피드백으로 넘길 권한이 없습니다." };
    }
    if (from !== "in_progress") {
      return { ok: false, error: "피드백은 진행 단계에서만 넘길 수 있습니다." };
    }
    return { ok: true };
  }

  if (to === "on_hold") {
    if (!isAssigneeOrLeader(userId, assigneeId, teamLeaderId)) {
      return { ok: false, error: "보류는 담당자 또는 팀장만 설정할 수 있습니다." };
    }
    return { ok: true };
  }

  if (to === "in_progress") {
    if (from === "requested") {
      return { ok: true };
    }
    if (from === "on_hold") {
      if (
        isAssigneeOrLeader(userId, assigneeId, teamLeaderId) ||
        isEffectiveTaskRequester({ userId, requestedBy, teamLeaderId })
      ) {
        return { ok: true };
      }
      return { ok: false, error: "보류에서 재개할 권한이 없습니다." };
    }
    if (from === "feedback") {
      if (!isEffectiveTaskRequester({ userId, requestedBy, teamLeaderId })) {
        return { ok: false, error: "재작업(진행)으로 되돌리는 것은 요청자만 할 수 있습니다." };
      }
      return { ok: true };
    }
    return { ok: false, error: "허용되지 않는 상태 전환입니다." };
  }

  if (to === "requested") {
    return { ok: false, error: "요청 단계로 되돌릴 수 없습니다." };
  }

  return { ok: false, error: "허용되지 않는 상태 전환입니다." };
}

/** 카드·모달에서 노출할 수 있는 다음 상태(간단 필터; 서버가 최종 검증) */
export function listAllowedNextStatuses(params: {
  task: {
    status: string;
    assignee_id: string | null;
    requested_by?: string | null;
  };
  userId: string | null;
  teamLeaderId: string | null;
}): KanbanTaskStatus[] {
  const { task, userId, teamLeaderId } = params;
  if (!userId) return [];
  const from = task.status as KanbanTaskStatus;
  const assigneeId = task.assignee_id;
  const requestedBy = task.requested_by ?? null;

  const candidates: KanbanTaskStatus[] = [
    "requested",
    "in_progress",
    "feedback",
    "completed",
    "on_hold",
  ];
  const out: KanbanTaskStatus[] = [];
  for (const to of candidates) {
    if (to === from) continue;
    const v = validateStatusTransition({
      from,
      to,
      userId,
      assigneeId,
      teamLeaderId,
      requestedBy,
      // UI 목록용: 코멘트 필수 전환은 더미 문자열로 통과시켜 노출
      statusComment: transitionRequiresStatusComment(from, to) ? "—" : "",
    });
    if (v.ok) out.push(to);
  }
  return out;
}
