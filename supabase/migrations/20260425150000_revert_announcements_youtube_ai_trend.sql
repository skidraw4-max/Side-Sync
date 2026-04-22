-- AI TREND(YouTube 자동 수집) 배포 되돌리기
-- 원격 DB에 이미 적용된 youtube 컬럼·자동 수집 데이터를 제거합니다.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'announcements'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'announcements'
        AND column_name = 'youtube_video_id'
    ) THEN
      DELETE FROM public.announcements
      WHERE youtube_video_id IS NOT NULL
         OR (ingest_source IS NOT NULL);
    END IF;

    DROP INDEX IF EXISTS public.announcements_youtube_video_id_unique;

    ALTER TABLE public.announcements
      DROP CONSTRAINT IF EXISTS announcements_ingest_source_check;

    ALTER TABLE public.announcements
      DROP COLUMN IF EXISTS youtube_video_id;

    ALTER TABLE public.announcements
      DROP COLUMN IF EXISTS ingest_source;
  END IF;
END
$$;
