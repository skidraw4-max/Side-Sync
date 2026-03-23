-- 지원서 INSERT/재신청(pending) 시 프로젝트 리더에게 알림 생성
-- notifications 테이블에 RLS INSERT 정책이 없어 앱의 service role 없이는 알림이 쌓이지 않던 문제 보완

CREATE OR REPLACE FUNCTION public.notify_leader_on_application_pending()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  leader_id uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM 'pending' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT p.team_leader_id INTO leader_id
  FROM public.projects p
  WHERE p.id = NEW.project_id;

  IF leader_id IS NULL OR leader_id = NEW.applicant_id THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, title, message, link, read)
    VALUES (
      leader_id,
      '새로운 지원자가 있습니다!',
      '프로젝트에 새로운 지원 요청이 들어왔습니다. 지원자를 검토해보세요.',
      '/projects/' || NEW.project_id::text || '/manage',
      false
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'pending' THEN
    INSERT INTO public.notifications (user_id, title, message, link, read)
    VALUES (
      leader_id,
      '지원자가 다시 신청했습니다',
      '거절했던 지원자가 프로젝트에 다시 지원했습니다. 검토해 주세요.',
      '/projects/' || NEW.project_id::text || '/manage',
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_notify_leader_on_application ON public.applications;
CREATE TRIGGER tr_notify_leader_on_application
  AFTER INSERT OR UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_leader_on_application_pending();

COMMENT ON FUNCTION public.notify_leader_on_application_pending() IS
  'applications pending 시 team_leader_id에게 notifications 행 추가 (RLS 우회)';
