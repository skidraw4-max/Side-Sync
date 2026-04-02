import { WORKSPACE } from "@/lib/constants/contents";
import type { KanbanTeamMember } from "@/types/kanban";

export type KanbanAssigneeOption = { value: string; label: string; isUser: boolean };

export function buildKanbanAssigneeOptions(params: {
  currentUserId: string | null;
  teamMembers: KanbanTeamMember[];
  recruitmentRoles: string[];
}): KanbanAssigneeOption[] {
  const { currentUserId, teamMembers, recruitmentRoles } = params;
  const meInTeam = Boolean(currentUserId && teamMembers.some((m) => m.id === currentUserId));
  const opts: KanbanAssigneeOption[] = [];
  opts.push({ value: "", label: WORKSPACE.assigneeUnset, isUser: false });
  if (meInTeam && currentUserId) {
    const me = teamMembers.find((m) => m.id === currentUserId);
    opts.push({
      value: currentUserId,
      label: `${WORKSPACE.meSelfPrefix} (${me?.fullName ?? WORKSPACE.meFallbackName})`,
      isUser: true,
    });
  }
  teamMembers
    .filter((m) => m.id !== currentUserId)
    .forEach((m) =>
      opts.push({ value: m.id, label: m.fullName ?? WORKSPACE.memberFallback, isUser: true })
    );
  if (recruitmentRoles.length > 0) {
    recruitmentRoles.forEach((r, i) =>
      opts.push({
        value: `__role_${i}`,
        label: `${r} (${WORKSPACE.recruitingSlotSuffix})`,
        isUser: false,
      })
    );
  }
  return opts;
}
