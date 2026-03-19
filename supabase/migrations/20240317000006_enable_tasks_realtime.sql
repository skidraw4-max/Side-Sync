-- tasks 테이블을 Supabase Realtime publication에 추가
-- 다른 팀원이 업무 상태를 변경할 때 실시간 동기화를 위해 필요
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
