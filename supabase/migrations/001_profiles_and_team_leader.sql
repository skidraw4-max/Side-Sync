-- profiles 테이블 (팀장 정보: Success Rate, Manner Temp)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  role TEXT,
  avatar_url TEXT,
  success_rate TEXT,
  manner_temp_target TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- projects 테이블에 team_leader_id, category 컬럼 추가
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS team_leader_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS category TEXT;

-- profiles에 tech_stack 컬럼 추가 (Auth 연동용)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tech_stack TEXT[] DEFAULT '{}';

-- RLS (Row Level Security) - 필요 시 활성화
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
