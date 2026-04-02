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
  /** 업무 요청자(완료 권한). DB requested_by 컬럼 */
  requested_by?: string | null;
  /** 상세 설명 (DB에 description 컬럼이 있을 때) */
  description?: string | null;
  /** 컬럼 내 순서 (같은 project_id·status 안에서 0부터) */
  sort_order?: number;
  assignee: KanbanAssignee | null;
}
