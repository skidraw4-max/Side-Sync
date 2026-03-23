/** 알림 목록·드롭다운 공통 행 타입 */
export type NotificationListItem = {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
  is_ai_recommendation?: boolean;
  ai_comment?: string | null;
  source_project_id?: string | null;
};
