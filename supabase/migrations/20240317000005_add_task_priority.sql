-- tasks 테이블에 priority 컬럼 추가
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'));
