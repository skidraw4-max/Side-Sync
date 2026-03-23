-- 지원서 상태 변경을 클라이언트 Realtime으로 반영 (이미 추가된 환경에서는 이 줄을 제거하세요)
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
