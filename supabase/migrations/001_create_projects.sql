-- projects 테이블 생성
-- Supabase Dashboard > SQL Editor에서 실행하세요.
-- Realtime: Database > Replication에서 projects 테이블을 supabase_realtime에 추가하세요.

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  manner_temp_target TEXT DEFAULT '36.5°C',
  gradient TEXT DEFAULT 'from-blue-200 via-indigo-200 to-purple-200',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 (선택사항: 읽기는 모든 사용자 허용)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on projects"
  ON public.projects FOR SELECT
  USING (true);

