# Side Sync (side-sync-landing)

Next.js(App Router) 기반 랜딩·프로젝트 탐색·팀 워크스페이스 UI. Supabase(Auth/DB/Realtime)와 연동합니다.

---

## `src` 폴더 구조 (서비스 구조 요약)

| 경로 | 역할 |
|------|------|
| **`app/`** | **라우팅 중심**: 페이지(`page.tsx`), 레이아웃(`layout.tsx`), 로딩/에러 UI. 마케팅·탐색(`/`, `/explore`), 인증(`/login`, `/signup`), 온보딩, 대시보드, 프로젝트 생명주기(`/projects`, `/projects/create`, `/projects/[id]`, `/edit`, `/manage`, `/evaluate`), **워크스페이스**(`/projects/[id]/workspace/*` — 채팅·공지·칸반 등). |
| **`app/api/`** | **Route Handlers**: 서버에서 Supabase 세션으로 호출하는 REST 엔드포인트(프로젝트 PATCH, 지원·알림·평가·태스크 PATCH, 스토리지 버킷 등). 클라이언트 직접 DB 쓰기와 병행되는 구간을 줄이기 위한 레이어. |
| **`app/auth/`** | OAuth 등 **인증 콜백** 라우트. |
| **`components/`** | **재사용 UI**: `Header`/`Footer`, 프로젝트 카드·상세 블록, 워크스페이스 셸·사이드바, 모달·폼, 광고·스켈레톤 등 도메인별 컴포넌트. |
| **`contexts/`** | **클라이언트 전역 컨텍스트**(예: 세션/인증 노출). |
| **`hooks/`** | **데이터/도메인 훅** (`useProjects`, `useMyProjects` 등). |
| **`lib/`** | **인프라·유틸**: Supabase `client`/`server`/`admin`, 프로젝트 쿼리·검색 헬퍼, 광고/사이트 URL 등 **비 UI 로직**. |
| **`types/`** | Supabase 스키마 기반 **`database` 타입** 등. `applications` 지원자 식별은 **`applicant_id`** ( `user_id` 컬럼 없음 ). 승인 상태 문자열은 **`src/lib/application-status.ts`** 의 `APPLICATION_STATUS` (DB CHECK: 소문자 `accepted` 등). |
| **`middleware.ts`** | 요청 단계 **라우트 보호·리다이렉트** 등. |

**데이터 흐름(개략)**: 브라우저 → (페이지/컴포넌트) → Supabase 클라이언트 **또는** `app/api/*` → Supabase(서버 세션) → RLS 정책 적용.

---

## 우선 개선 과제 (리팩터링 / UI) — 3가지

1. **데이터 접근 방식 통일**  
   동일 도메인(예: 태스크·프로젝트)에서 **클라이언트 Supabase 직접 호출**과 **`/api` Route Handler**가 혼재합니다. 유지보수·권한·에러 처리 일관성을 위해, **변경이 잦은 쓰기/민감 로직은 API(또는 Server Actions)로 모으고**, 읽기는 RSC/캐시 전략에 맞게 정리하는 편이 좋습니다.

2. **대형 컴포넌트 분리**  
   `workspace/tasks/KanbanTasksBoard.tsx` 등 **단일 파일에 카드·모달·실시간 구독·생성 로직**이 몰려 있습니다. `TaskCard`/모달/훅 단위로 쪼개면 테스트·성능(메모)·가독성이 좋아집니다.

3. **UI 카피·언어 일관성**  
   랜딩/탐색은 한글 중심인데, 워크스페이스 칸반 등 일부는 **영문 라벨·placeholder**가 섞여 있습니다. 제품 톤을 맞추려면 **카피 가이드(한/영 중 하나 우선)** 또는 경량 **i18n** 적용을 검토할 만합니다.

---

## Getting Started

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

```bash
npm run build   # 프로덕션 빌드
npm run lint    # ESLint
```

## Deploy

Vercel 등에 Git 연동 배포를 사용할 수 있습니다. Supabase **RLS·마이그레이션**은 운영 DB에도 반영해야 합니다.

### Supabase 환경·Realtime

- **`NEXT_PUBLIC_DEBUG_MY_PROJECTS`**: `0` 이면 참여 프로젝트 관련 브라우저 디버그 로그 비활성화(기본은 켜짐). 확인 후 Vercel env에 `0` 설정 가능.
- **`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`**: 대시보드 **Project Settings → API**의 Project URL·`anon` `public` 키와 일치해야 합니다. 키를 재발급했다면 Vercel(또는 로컬 `.env.local`)도 함께 갱신하세요.
- **Realtime(WebSocket)**: 기본적으로 앱은 **`NEXT_PUBLIC_ENABLE_SUPABASE_REALTIME=true`** 일 때만 프로젝트·알림 등에 WebSocket을 구독합니다. 설정하지 않으면 REST만 사용해 DNS/프록시/방화벽 환경에서 소켓 오류 로그를 줄일 수 있습니다. 실시간이 필요하면 해당 env를 켜고, Supabase 대시보드에서 해당 테이블이 **Database → Replication**에 포함돼 있는지 확인하세요.
- **`notifications` AI 컬럼 400**: `is_ai_recommendation`, `ai_comment`, `source_project_id`가 없으면 구버전 DB에서 select가 실패할 수 있습니다. `supabase/migrations/20260326000000_ai_recommendation_notifications.sql` 또는 `20260330000000_ensure_notification_ai_columns.sql`을 적용하세요. 마이그레이션 전에도 클라이언트는 **기본 컬럼만** 조회해 폴백합니다.
- **`projects.manner_temp_target`**: 레포 마이그레이션(`001_create_projects.sql` 등)과 코드 모두 **`manner_temp_target`** 스네이크 케이스를 사용합니다. DB에 다른 이름이면 컬럼명을 맞추거나 마이그레이션으로 통일하세요.
- **`profiles.email` + RLS**: `20260330120000_profiles_email.sql` — `email` 컬럼 추가, `auth.users`에서 백필, 이메일 변경 시 동기화 트리거. `20260330121000_profiles_rls_email_access.sql` — 본인·프로젝트 리더(지원자)·수락 팀원(동료·리더)만 타인 `profiles` 행을 SELECT (이메일은 행 단위로만 통제 가능). **비로그인 공개 프로젝트 상세**의 팀 표시는 RLS를 피하기 위해 `SUPABASE_SERVICE_ROLE_KEY`가 있을 때 서버에서 **이메일을 select 목록에 넣지 않고** 조회합니다(`projects/[id]/page.tsx`). 서비스 롤이 없으면 게스트에게 팀 프로필이 비어 보일 수 있습니다.

- 지원 신청 RLS 오류 대응: `supabase/migrations/20260327120000_applications_rls_insert_fix.sql` 적용.
- Vercel에 **`SUPABASE_SERVICE_ROLE_KEY`** 설정 시, 지원 INSERT/재신청이 RLS와 무관하게 서버에서 안전하게 처리됩니다(본인 `applicant_id`만 사용).
- 리더 알림·지원 목록: `supabase/migrations/20260328120000_notify_leader_on_application.sql` — `notifications`에 INSERT 정책이 없어 service role 없으면 알림이 안 쌓이던 문제를 DB 트리거로 해결합니다.
- **지원자 관리 화면에서 프로필 임베드 조회**: `supabase/migrations/20260329120000_applications_applicant_profiles_fk.sql` — `applications.applicant_id`가 `auth.users`만 가리키면 Supabase가 `profiles`와 관계를 못 잡아 `select('*, profiles(...)')`가 실패합니다. 이 마이그레이션으로 `applicant_id → public.profiles(id)` FK로 바꿉니다. (이미 지원 행이 있는데 해당 사용자에게 `profiles` 행이 없으면 FK 추가가 실패할 수 있으니, 먼저 프로필 누락을 정리하세요.)
- **`applications.updated_at` / PGRST204**: 구 DB에 `updated_at` 컬럼이 없으면 수락·거절 PATCH가 500이 날 수 있습니다. 앱은 해당 컬럼을 보내지 않습니다. 필요 시 `20260330123000_applications_updated_at_if_missing.sql` 적용.
- **지원자 관리 페이지에 목록이 안 보일 때**: UI 기본은 **`pending` 지원만** 보여 줍니다. 이미 수락·거절한 건은 **View Archived**로 전환하세요. 목록은 **`GET /api/projects/[id]/applications`** 를 우선 호출합니다(서버에서 팀장 검증 후, **`SUPABASE_SERVICE_ROLE_KEY`가 있으면** RLS를 우회해 조회·프로필 배치 로드). API 실패 시에만 브라우저 Supabase로 폴백합니다. 콘솔 **`🔍 쿼리 결과 data (API)`** / **`(클라이언트)`** 로 출처를 구분할 수 있습니다. DB 정책 보강: `20260330122000_applications_leader_select_reassert.sql`.

#### 지원자 목록이 `error` 없이 `data: []` 일 때 (RLS 의심)

레포에는 이미 `Leaders can read project applications` 정책이 있습니다(`20260324000000_applications_rls_and_rejection_reason.sql`). 운영 DB에 미적용이거나 정책 이름이 다르면 빈 배열이 나올 수 있습니다. Supabase **SQL Editor**에서 아래를 실행해 리더 조회를 보강할 수 있습니다. (`TO authenticated` 권장. 이미 동일 역할의 정책이 있으면 중복이 되므로 대시보드에서 기존 정책을 확인한 뒤 진행하세요.)

```sql
-- 리더가 자기 프로젝트의 지원서를 볼 수 있게 허용 (서브쿼리 버전)
DROP POLICY IF EXISTS "Leaders can view applications for their projects" ON public.applications;

CREATE POLICY "Leaders can view applications for their projects"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = (SELECT p.team_leader_id FROM public.projects p WHERE p.id = applications.project_id)
  );
```

`team_leader_id`가 NULL인 프로젝트는 위 조건이 참이 되지 않습니다. 레포의 `EXISTS (...)` 형태와 논리적으로 동일한 허용 범위입니다.

### AI 프로젝트 추천 알림 (Stitch / LLM)

- 마이그레이션: `supabase/migrations/20260326000000_ai_recommendation_notifications.sql` (`notifications` 확장, `profiles.primary_stack`).
- **알림** 페이지(`/notifications`)에서 **AI 매칭 새로고침**으로 `runAiProjectRecommendationsAction` 실행.
- LLM 호출 우선순위는 `src/lib/stitch-llm.ts` 주석 참고. 예시 환경변수:
  - `STITCH_HTTP_PROMPT_URL` — `{ "prompt": "..." }` POST 후 `{ "text" }` 등을 반환하는 프록시 (MCP 연동용).
  - `STITCH_MCP_URL` / `STITCH_ACCESS_TOKEN` — JSON-RPC MCP 시도.
  - `GEMINI_API_KEY` — 로컬·스테이징에서 Stitch 미구성 시 Gemini REST 폴백.
- 실패 시 알림 본문은 기본 문구(`사용자님의 스택에 꼭 맞는 프로젝트입니다.`)로 저장됩니다.
