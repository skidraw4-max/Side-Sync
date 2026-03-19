-- 기존 프로젝트에 기본 채널 생성 (없는 경우만)
INSERT INTO chat_channels (project_id, name, slug, description)
SELECT p.id, 'General', 'general', 'General project discussion'
FROM projects p
WHERE NOT EXISTS (SELECT 1 FROM chat_channels c WHERE c.project_id = p.id AND c.slug = 'general');

INSERT INTO chat_channels (project_id, name, slug, description)
SELECT p.id, 'Design Sync', 'design-sync', 'Syncing visual components and brand guidelines'
FROM projects p
WHERE NOT EXISTS (SELECT 1 FROM chat_channels c WHERE c.project_id = p.id AND c.slug = 'design-sync');

INSERT INTO chat_channels (project_id, name, slug, description)
SELECT p.id, 'Development', 'development', 'Code and implementation discussion'
FROM projects p
WHERE NOT EXISTS (SELECT 1 FROM chat_channels c WHERE c.project_id = p.id AND c.slug = 'development');

-- 새 프로젝트 생성 시 기본 채널 자동 추가
CREATE OR REPLACE FUNCTION create_default_channels_for_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chat_channels (project_id, name, slug, description) VALUES
    (NEW.id, 'General', 'general', 'General project discussion'),
    (NEW.id, 'Design Sync', 'design-sync', 'Syncing visual components and brand guidelines'),
    (NEW.id, 'Development', 'development', 'Code and implementation discussion');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_project_created_add_channels ON projects;
CREATE TRIGGER on_project_created_add_channels
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION create_default_channels_for_project();
