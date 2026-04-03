-- 워크스페이스·평가·채팅 테이블 RLS 강화 (Supabase 보안 알림: rls_disabled / 과도한 USING(true) 대응)
-- 팀장 또는 해당 프로젝트 status=accepted 지원자만 tasks/notices/chat 등 접근.
-- peer_evaluations: 평가자·피평가자 본인 행만 SELECT; INSERT는 API와 동일한 조건.
-- ensure_project_channels: 멤버 검증 + anon 호출 제거.

CREATE OR REPLACE FUNCTION public.auth_is_project_workspace_member(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.projects pr
        WHERE pr.id = p_project_id
          AND pr.team_leader_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.applications app
        WHERE app.project_id = p_project_id
          AND app.applicant_id = auth.uid()
          AND app.status = 'accepted'
      )
    );
$$;

COMMENT ON FUNCTION public.auth_is_project_workspace_member(uuid) IS
  'RLS 공통: 팀장 또는 수락된 팀원 (SECURITY INVOKER)';

GRANT EXECUTE ON FUNCTION public.auth_is_project_workspace_member(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- ensure_project_channels: 인증·멤버십 필수, anon 제거
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_project_channels(p_project_id uuid)
RETURNS TABLE(id uuid, name text, slug text, description text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT (
    EXISTS (
      SELECT 1 FROM public.projects pr
      WHERE pr.id = p_project_id AND pr.team_leader_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.applications app
      WHERE app.project_id = p_project_id
        AND app.applicant_id = auth.uid()
        AND app.status = 'accepted'
    )
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  INSERT INTO public.chat_channels (project_id, name, slug, description)
  SELECT p_project_id, 'General', 'general', 'General project discussion'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.chat_channels c
    WHERE c.project_id = p_project_id AND c.slug = 'general'
  );

  INSERT INTO public.chat_channels (project_id, name, slug, description)
  SELECT p_project_id, 'Design Sync', 'design-sync', 'Syncing visual components and brand guidelines'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.chat_channels c
    WHERE c.project_id = p_project_id AND c.slug = 'design-sync'
  );

  INSERT INTO public.chat_channels (project_id, name, slug, description)
  SELECT p_project_id, 'Development', 'development', 'Code and implementation discussion'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.chat_channels c
    WHERE c.project_id = p_project_id AND c.slug = 'development'
  );

  RETURN QUERY
  SELECT cc.id, cc.name, cc.slug, cc.description
  FROM public.chat_channels cc
  WHERE cc.project_id = p_project_id
  ORDER BY cc.created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_project_channels(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_project_channels(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tasks'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tasks', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "tasks_select_workspace"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (public.auth_is_project_workspace_member(project_id));

CREATE POLICY "tasks_insert_workspace"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (public.auth_is_project_workspace_member(project_id));

CREATE POLICY "tasks_update_workspace"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (public.auth_is_project_workspace_member(project_id))
  WITH CHECK (public.auth_is_project_workspace_member(project_id));

CREATE POLICY "tasks_delete_workspace"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (public.auth_is_project_workspace_member(project_id));

-- ---------------------------------------------------------------------------
-- notices
-- ---------------------------------------------------------------------------
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notices'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notices', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "notices_select_workspace"
  ON public.notices FOR SELECT
  TO authenticated
  USING (public.auth_is_project_workspace_member(project_id));

CREATE POLICY "notices_insert_workspace"
  ON public.notices FOR INSERT
  TO authenticated
  WITH CHECK (
    public.auth_is_project_workspace_member(project_id)
    AND author_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- chat_channels
-- ---------------------------------------------------------------------------
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_channels'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_channels', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "chat_channels_select_workspace"
  ON public.chat_channels FOR SELECT
  TO authenticated
  USING (public.auth_is_project_workspace_member(project_id));

CREATE POLICY "chat_channels_insert_workspace"
  ON public.chat_channels FOR INSERT
  TO authenticated
  WITH CHECK (public.auth_is_project_workspace_member(project_id));

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_messages'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_messages', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "chat_messages_select_workspace"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (public.auth_is_project_workspace_member(project_id));

CREATE POLICY "chat_messages_insert_workspace"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    public.auth_is_project_workspace_member(project_id)
    AND author_id = auth.uid()
    AND (
      channel_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.chat_channels cc
        WHERE cc.id = channel_id
          AND cc.project_id = project_id
      )
    )
  );

-- ---------------------------------------------------------------------------
-- peer_evaluations
-- ---------------------------------------------------------------------------
ALTER TABLE public.peer_evaluations ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'peer_evaluations'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.peer_evaluations', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "peer_evaluations_select_parties"
  ON public.peer_evaluations FOR SELECT
  TO authenticated
  USING (
    evaluator_id = auth.uid()
    OR evaluatee_id = auth.uid()
  );

CREATE POLICY "peer_evaluations_insert_evaluator"
  ON public.peer_evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    evaluator_id = auth.uid()
    AND evaluator_id <> evaluatee_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = peer_evaluations.project_id
        AND p.status = 'completed'
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = peer_evaluations.project_id
          AND p.team_leader_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.project_id = peer_evaluations.project_id
          AND a.applicant_id = auth.uid()
          AND a.status = 'accepted'
      )
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = peer_evaluations.project_id
          AND p.team_leader_id = evaluatee_id
      )
      OR EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.project_id = peer_evaluations.project_id
          AND a.applicant_id = evaluatee_id
          AND a.status = 'accepted'
      )
    )
  );

-- ---------------------------------------------------------------------------
-- task_comments (기존 USING(true) 제거)
-- ---------------------------------------------------------------------------
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'task_comments'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.task_comments', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "task_comments_select_workspace"
  ON public.task_comments FOR SELECT
  TO authenticated
  USING (public.auth_is_project_workspace_member(project_id));

CREATE POLICY "task_comments_insert_workspace"
  ON public.task_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    public.auth_is_project_workspace_member(project_id)
    AND author_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- manner_temp_logs: 본인 행만 SELECT (마일스톤 카운트)
-- ---------------------------------------------------------------------------
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'manner_temp_logs'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.manner_temp_logs', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "manner_temp_logs_select_own"
  ON public.manner_temp_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
