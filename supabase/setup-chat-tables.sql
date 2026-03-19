-- Supabase SQL Editor에서 이 파일 내용을 실행하세요.
-- chat_channels 테이블이 없을 때 "Could not find the table 'public.chat_channels'" 오류 해결

-- 1. chat_channels 테이블 생성
CREATE TABLE IF NOT EXISTS chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_chat_channels_project_id ON chat_channels(project_id);

-- 2. chat_messages 테이블: 없으면 생성, 있으면 필요한 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    CREATE TABLE chat_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      content text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      channel_id uuid REFERENCES chat_channels(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_chat_messages_project_id ON chat_messages(project_id);
    CREATE INDEX idx_chat_messages_channel_id ON chat_messages(channel_id);
  ELSE
    -- project_id 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_messages' AND column_name = 'project_id') THEN
      ALTER TABLE chat_messages ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
    END IF;
    -- author_id 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_messages' AND column_name = 'author_id') THEN
      ALTER TABLE chat_messages ADD COLUMN author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    -- channel_id 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_messages' AND column_name = 'channel_id') THEN
      ALTER TABLE chat_messages ADD COLUMN channel_id uuid REFERENCES chat_channels(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id);
    END IF;
    -- content 추가 (없을 때)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_messages' AND column_name = 'content') THEN
      ALTER TABLE chat_messages ADD COLUMN content text;
    END IF;
    -- created_at 추가 (없을 때)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_messages' AND column_name = 'created_at') THEN
      ALTER TABLE chat_messages ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
    END IF;
  END IF;
END $$;

-- 3. RPC 함수 (fallback용)
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

GRANT EXECUTE ON FUNCTION public.ensure_project_channels(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_project_channels(uuid) TO anon;

-- 4. chat_messages RLS 정책 (메시지 전송 허용)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거
DROP POLICY IF EXISTS "chat_messages_select_policy" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.chat_messages;

-- SELECT: 인증된 사용자 읽기
CREATE POLICY "chat_messages_select_policy"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: 인증된 사용자 메시지 작성 허용
CREATE POLICY "chat_messages_insert_policy"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
