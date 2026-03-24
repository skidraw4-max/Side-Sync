/**
 * applications.status — DB CHECK 및 앱 전역에서 소문자만 사용
 * @see supabase/migrations/20240317000001_create_applications.sql
 *   + canceled (20260330125000_applications_status_canceled.sql)
 */
export const APPLICATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELED: "canceled",
} as const;

export type ApplicationStatus = (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];
