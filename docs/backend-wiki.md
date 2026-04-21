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

## 업무와 연결 위키

### 데이터 관계

- **`public.tasks`**: 프로젝트 업무(칸반). 기존과 동일하게 `project_id`로 `public.projects`를 참조합니다.
- **`public.task_wiki_pages`**: 업무당 **1개**의 위키 페이지(마크다운 `body`). `task_id`가 `tasks.id`에 대해 **UNIQUE**이며, `ON DELETE CASCADE`로 업무 삭제 시 위키도 함께 삭제됩니다. `project_id`는 동일 프로젝트 소속을 빠르게 조회하기 위한 중복 키입니다.
- **연결**: `task_wiki_pages.task_id → tasks.id` (1:1).

### HTTP: `POST /api/projects/[id]/tasks`

- **역할**: 검증 후 DB 함수 `public.create_task_with_wiki`를 호출하여 **업무 행과 `task_wiki_pages` 행을 한 트랜잭션**으로 삽입합니다. 한쪽만 성공하는 중간 상태는 생기지 않습니다.
- **구현**: `src/app/api/projects/[id]/tasks/route.ts`
- **응답** (성공 시):
  - `task`: 삽입된 업무 객체 (기존과 동일하게 클라이언트가 사용).
  - `wiki`: 같은 트랜잭션에서 생성된 위키 행(`id`, `task_id`, `project_id`, `title`, `body`, 타임스탬프).
- **보안**: 기존과 같이 `projectTaskAccessDenied`로 팀장·수락 멤버만 생성 가능합니다. RPC는 `SECURITY INVOKER`로 호출자 세션의 RLS가 적용됩니다.

### DB: `public.create_task_with_wiki(...)`

- **역할**: Next.js와 동일한 규칙으로 `tasks` + `task_wiki_pages`를 한 번에 삽입합니다.
- **마이그레이션**: `supabase/migrations/20260421120000_task_wiki_pages.sql`
- **권한**: `authenticated` 역할에 `EXECUTE`가 부여되어 있습니다.
- **위키 초기값**: 제목은 `"{업무 제목} — 위키"`, 본문은 마크다운으로 `# 제목`, `## 개요` 및 설명(없으면 `(설명 없음)`) — Python `wiki_service`와 동일한 규칙입니다.

### Python: `services/workspace/wiki_service.py`

- **역할**: `task_wiki_pages`에 대한 **INSERT만** 담당합니다(단일 책임). 초기 제목·본문 문자열 생성도 여기서 정의하여 `create_task_with_wiki` SQL과 맞춥니다.
- **의존성**: `psycopg2` 커서(파라미터 바인딩).

### Python: `services/workspace/task_service.py`

- **역할**: `tasks` INSERT 후 `wiki_service.insert_task_wiki_page`를 호출합니다. `conn.autocommit = False`로 **하나의 트랜잭션**에서 처리하고, 예외 시 `rollback`합니다.
- **반환**: `{"task": dict, "wiki": dict}`.

```python
from services.workspace.task_service import create_task_with_wiki

# conn: psycopg2 connection (autocommit은 함수 내부에서 잠시 끔)
result = create_task_with_wiki(
    conn,
    {
        "project_id": "...",
        "title": "...",
        "category": "GENERAL",
        "priority": "medium",
        "assignee_id": "...",
        "requested_by": "...",
        "sort_order": 0,
        "due_date": "2026-04-30",
        "description": None,
    },
)
# result["task"], result["wiki"]
```

## 스키마 참고

- `projects.status`: `hiring` | `ongoing` | `completed` (마이그레이션 `20260330140000_projects_status_lifecycle.sql`)
- TypeScript 타입: `src/types/database.ts`의 `ProjectLifecycleStatus`, `task_wiki_pages`, `Functions.create_task_with_wiki`
