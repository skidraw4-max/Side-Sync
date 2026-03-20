-- projects: 검색용 summary, content 컬럼 + search_projects RPC
-- Supabase SQL Editor에서도 실행 가능

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS content text;

COMMENT ON COLUMN public.projects.summary IS '짧은 요약 (검색·카드 미리보기용)';
COMMENT ON COLUMN public.projects.content IS '상세 본문 (검색용)';

-- 여러 단어(공백 구분): 각 단어가 title/summary/content/description/goal/tech_stack 중 어딘가에 포함(대소문자 무시)
CREATE OR REPLACE FUNCTION public.search_projects(query_text text)
RETURNS SETOF public.projects
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  q text := trim(regexp_replace(coalesce(query_text, ''), '\s+', ' ', 'g'));
BEGIN
  IF q = '' THEN
    RETURN QUERY
    SELECT p.*
    FROM public.projects p
    ORDER BY p.created_at DESC;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.*
  FROM public.projects p
  WHERE NOT EXISTS (
    SELECT 1
    FROM unnest(string_to_array(q, ' ')) AS t(word)
    WHERE word <> ''
      AND NOT (
        p.title ILIKE '%' || word || '%'
        OR COALESCE(p.summary, '') ILIKE '%' || word || '%'
        OR COALESCE(p.content, '') ILIKE '%' || word || '%'
        OR COALESCE(p.description, '') ILIKE '%' || word || '%'
        OR COALESCE(p.goal, '') ILIKE '%' || word || '%'
        OR array_to_string(p.tech_stack, ' ') ILIKE '%' || word || '%'
      )
  )
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_projects(text) TO anon, authenticated, service_role;
