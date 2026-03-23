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
| **`types/`** | Supabase 스키마 기반 **`database` 타입** 등. |
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

- 지원 신청 RLS 오류 대응: `supabase/migrations/20260327120000_applications_rls_insert_fix.sql` 적용.
- Vercel에 **`SUPABASE_SERVICE_ROLE_KEY`** 설정 시, 지원 INSERT/재신청이 RLS와 무관하게 서버에서 안전하게 처리됩니다(본인 `applicant_id`만 사용).

### AI 프로젝트 추천 알림 (Stitch / LLM)

- 마이그레이션: `supabase/migrations/20260326000000_ai_recommendation_notifications.sql` (`notifications` 확장, `profiles.primary_stack`).
- **알림** 페이지(`/notifications`)에서 **AI 매칭 새로고침**으로 `runAiProjectRecommendationsAction` 실행.
- LLM 호출 우선순위는 `src/lib/stitch-llm.ts` 주석 참고. 예시 환경변수:
  - `STITCH_HTTP_PROMPT_URL` — `{ "prompt": "..." }` POST 후 `{ "text" }` 등을 반환하는 프록시 (MCP 연동용).
  - `STITCH_MCP_URL` / `STITCH_ACCESS_TOKEN` — JSON-RPC MCP 시도.
  - `GEMINI_API_KEY` — 로컬·스테이징에서 Stitch 미구성 시 Gemini REST 폴백.
- 실패 시 알림 본문은 기본 문구(`사용자님의 스택에 꼭 맞는 프로젝트입니다.`)로 저장됩니다.
