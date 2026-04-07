# Backend 위키 (Side-Sync)

이 저장소의 **주 애플리케이션**은 Next.js(App Router)이며, 공개 HTTP API는 `src/app/api/**/route.ts`에 정의됩니다.  
`services/` 아래 Python 모듈은 **동일 도메인 로직을 DB에 직접 붙여 쓰는 배치·별도 서비스**용 참고 구현입니다.

## 프로젝트 통계

### HTTP: `GET /api/stats/projects`

- **역할**: `public.projects.status` 기준으로 라이프사이클별 프로젝트 수를 반환합니다.
- **매핑** (DB → JSON):
  - `hiring` → `recruiting` (모집 중)
  - `ongoing` → `inProgress` (진행 중)
  - `completed` → `completed` (완료)
- **구현**: `src/app/api/stats/projects/route.ts`
- **보안**: Supabase JS 클라이언트의 `.eq("status", status)`로 조건을 바인딩합니다. 사용자 입력을 SQL 문자열에 끼워 넣지 않습니다.
- **권한**: anon 세션으로도 `projects` 공개 SELECT RLS가 허용되는 행만 집계에 포함됩니다.
- **환경 미설정**: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 플레이스홀더이면 `{ recruiting: 0, inProgress: 0, completed: 0 }`을 반환합니다.

### Python: `services/statistics/project_stats_service.py`

- **역할**: PostgreSQL 커서(`psycopg2` 등)에 대해 동일 의미의 건수를 한 번의 `GROUP BY`로 조회합니다.
- **쿼리**: `WHERE p.status = ANY(%s::text[])` — 화이트리스트 배열만 파라미터로 전달합니다.
- **반환**: `ProjectLifecycleCounts` — 키 `hiring`, `ongoing`, `completed` (정수).
- **의존성**: `services/requirements.txt` (`psycopg2-binary`).

```python
from services.statistics.project_stats_service import fetch_project_lifecycle_counts

# cur: psycopg2 cursor
counts = fetch_project_lifecycle_counts(cur)
# {"hiring": n1, "ongoing": n2, "completed": n3}
```

## 스키마 참고

- `projects.status`: `hiring` | `ongoing` | `completed` (마이그레이션 `20260330140000_projects_status_lifecycle.sql`)
- TypeScript 타입: `src/types/database.ts`의 `ProjectLifecycleStatus`
