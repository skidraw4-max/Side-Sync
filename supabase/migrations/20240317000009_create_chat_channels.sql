-- chat_channels 테이블 생성 (프로젝트 채널)
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

-- chat_messages에 channel_id 추가
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS channel_id uuid REFERENCES chat_channels(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id);

-- 기존 chat_messages를 위한 general 채널: 앱에서 프로젝트별 첫 채널 생성 시 처리
