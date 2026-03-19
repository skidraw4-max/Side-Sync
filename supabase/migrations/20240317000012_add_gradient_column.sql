-- gradient 컬럼이 없을 경우 추가
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS gradient TEXT DEFAULT 'from-blue-200 via-indigo-200 to-purple-200';
