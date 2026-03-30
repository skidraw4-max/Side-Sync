-- Side-Sync 앱은 public.projects.team_leader_id 만 사용합니다 (leader_id 컬럼 없음).
-- team_leader_id 가 NULL 이면:
--   - 워크스페이스 "프로젝트 종료" API 가 팀장 검증에서 403
--   - 목록 카드의 매너 온도는 팀장 profiles 를 못 읽고 projects.manner_temp_target 만 표시
--   - 종료 보너스 루프에서 팀장 UUID 가 빠질 수 있음
--
-- 대시보드에서 잘못 넣은 값이 leader_id 뿐이면(동일 UUID), 예시:
-- UPDATE public.projects SET team_leader_id = leader_id
-- WHERE team_leader_id IS NULL AND leader_id IS NOT NULL;

COMMENT ON COLUMN public.projects.team_leader_id IS
  'Project leader auth.users id (Side-Sync). Not leader_id. NULL disables leader-only actions and leader manner on cards.';
