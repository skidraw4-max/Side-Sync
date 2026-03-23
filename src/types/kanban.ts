export interface KanbanAssignee {
  fullName: string | null;
  avatarUrl: string | null;
}

export interface KanbanTeamMember {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface KanbanTaskWithAssignee {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  assignee_id: string | null;
  due_date: string | null;
  assignee: KanbanAssignee | null;
}
