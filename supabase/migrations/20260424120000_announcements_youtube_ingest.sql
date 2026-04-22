-- AI TREND 자동 수집: 유튜브 영상당 공지 1건 (중복 방지)

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS youtube_video_id text;

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS ingest_source text;

COMMENT ON COLUMN public.announcements.youtube_video_id IS 'YouTube videoId (자동 수집 시 중복 방지)';
COMMENT ON COLUMN public.announcements.ingest_source IS 'mit | deepmind — UI 배지·출처 표시';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'announcements_ingest_source_check'
      AND conrelid = 'public.announcements'::regclass
  ) THEN
    ALTER TABLE public.announcements
      ADD CONSTRAINT announcements_ingest_source_check
      CHECK (ingest_source IS NULL OR ingest_source IN ('mit', 'deepmind'));
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS announcements_youtube_video_id_unique
  ON public.announcements (youtube_video_id)
  WHERE youtube_video_id IS NOT NULL;
