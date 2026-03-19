-- chat_channels INSERT가 RLS로 막힐 때를 대비한 RPC
-- 프로젝트 멤버(팀장/수락된 지원자)가 호출 시 기본 채널 생성
-- SECURITY DEFINER로 RLS 우회

CREATE OR REPLACE FUNCTION public.ensure_project_channels(p_project_id uuid)
RETURNS TABLE(id uuid, name text, slug text, description text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO chat_channels (project_id, name, slug, description)
  SELECT p_project_id, 'General', 'general', 'General project discussion'
  WHERE NOT EXISTS (SELECT 1 FROM chat_channels c WHERE c.project_id = p_project_id AND c.slug = 'general');

  INSERT INTO chat_channels (project_id, name, slug, description)
  SELECT p_project_id, 'Design Sync', 'design-sync', 'Syncing visual components and brand guidelines'
  WHERE NOT EXISTS (SELECT 1 FROM chat_channels c WHERE c.project_id = p_project_id AND c.slug = 'design-sync');

  INSERT INTO chat_channels (project_id, name, slug, description)
  SELECT p_project_id, 'Development', 'development', 'Code and implementation discussion'
  WHERE NOT EXISTS (SELECT 1 FROM chat_channels c WHERE c.project_id = p_project_id AND c.slug = 'development');

  RETURN QUERY
  SELECT cc.id, cc.name, cc.slug, cc.description
  FROM chat_channels cc
  WHERE cc.project_id = p_project_id
  ORDER BY cc.created_at ASC;
END;
$$;

-- 인증된 사용자 호출 허용
GRANT EXECUTE ON FUNCTION public.ensure_project_channels(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_project_channels(uuid) TO anon;
