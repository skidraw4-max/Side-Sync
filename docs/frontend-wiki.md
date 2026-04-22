# Frontend 위키 (Side-Sync)

## 메인 랜딩 구조

- 페이지: `src/app/page.tsx` — `Hero` → (배너와 분리된 `ProjectStats` 섹션) → `FeatureCards` → `HomeSeoOverview` → `HomeProjectsAndTrending`.
- 프로젝트 카드 그리드(트렌딩): `HomeProjectsAndTrending` 내부의 `TrendingProjects` (`src/components/TrendingProjects.tsx`).

## `ProjectStats` (히어로 통계)

- **파일**: `src/components/main/ProjectStats.tsx`
- **위치**: 메인 히어로 배너 **바깥**, `page.tsx`에서 히어로 직후 별도 `<section>`(상단 보더·흰 배경) 안에 배치. 히어로 그라데이션·그리드와 시각적으로 구분됩니다.
- **데이터**: `GET /api/stats/projects` — 로딩 중에는 스켈레톤(`Skeleton`), 완료 후 숫자는 약 0.9초 동안 카운트업(ease-out cubic).
- **레이아웃**: 모바일 `flex-col`, `sm` 이상에서 `flex-row`로 가로 배치.
- **스타일**: Tailwind, 카드·포커스 링 `rounded-xl`, 강조색 `#2563EB` (프로젝트 `.cursorrules`와 정합).
- **인터랙션**: 각 통계 버튼 클릭 시 `document.getElementById("home-project-cards")?.scrollIntoView({ behavior: "smooth" })`로 트렌딩 프로젝트 카드 영역으로 스크롤합니다.

## 스크롤 앵커

- **id**: `home-project-cards` — `src/components/HomeProjectsAndTrending.tsx`에서 트렌딩 섹션 래퍼에 부여, `scroll-mt-24`로 고정 헤더 보정.

## 관련 타입

- API 응답: `ProjectStatsPayload` / `ProjectStatsResponse` (`recruiting`, `inProgress`, `completed`) — `ProjectStats.tsx` 및 `src/app/api/stats/projects/route.ts` 참고.

## 업무 상세(칸반) — 연결 위키 `TaskWikiLink`

- **파일**: `src/components/workspace/TaskWikiLink.tsx`
- **배치**: `KanbanTaskEditModal` (`src/components/workspace/kanban/KanbanTaskEditModal.tsx`) 내부, 업무 필드 아래. 업무 카드 편집 모달이 곧 “상세” 역할을 합니다.
- **데이터**: `GET /api/projects/[id]/tasks/[taskId]/wiki`로 `task_wiki_pages` 존재 여부를 조회합니다.
  - **위키 없음**: `WORKSPACE.taskWikiCreateButton` — `POST` 동일 경로로 생성. 저장된 업무 설명이 있으면 `generate_ai: true`로 보내 `GEMINI_API_KEY`가 설정된 경우 AI 목차·초안을 시도합니다.
  - **위키 있음**: 제목 + 본문에서 마크다운을 걷어낸 미리보기(`line-clamp-3`) + **편집**으로 `PATCH` 저장.
- **스타일**: Tailwind, 카드 `rounded-xl`, 주요 버튼·포커스 강조 `#2563EB` (`.cursorrules`와 정합).
- **문구**: `src/lib/constants/contents.ts`의 `WORKSPACE` (`taskWiki*` 키).
- **AI 초안(신규 업무 생성 시)**: `POST /api/projects/[id]/tasks`에서 `create_task_with_wiki` 직후, 업무 설명이 있으면 `src/lib/wiki-task-ai.ts`의 `generateTaskWikiDraftMarkdown`으로 본문을 덮어씁니다. 응답에 `wiki_ai_applied`가 있을 수 있습니다.

## 칸반 컬럼 하단 — `KanbanWikiList`

- **파일**: `src/components/workspace/KanbanWikiList.tsx`
- **배치**: `KanbanColumns` (`src/components/workspace/kanban/KanbanColumns.tsx`) 각 컬럼에서 업무 카드·「업무 추가」버튼 **아래**(컬럼 맨 하단).
- **데이터**: `KanbanTasksBoard`가 `GET /api/projects/[id]/task-wikis`로 프로젝트 전체 위키를 받은 뒤, `associated_status`로 컬럼별로 나눠 `wikisByColumn`으로 전달합니다. 업무가 없을 때는 보드를 비우므로 위키 목록도 불러오지 않습니다.
- **표시**: 불릿(`list-disc`) 리스트, 항목 클릭 시 **`/projects/[projectId]/workspace/wiki/[wikiId]`** 위키 상세 페이지로 이동 (`next/link`).
- **상세 페이지**: `src/app/projects/[id]/workspace/wiki/[wikiId]/page.tsx` — 제목·본문(마크다운 원문 `pre-wrap`)·업무 보드로 돌아가기 링크.
- **스타일**: 컨테이너 `rounded-xl`, 링크·마커 강조 `#2563EB` (`.cursorrules` 정합). 섹션 제목은 `WORKSPACE.kanbanWikiListHeading`.

### 계층 구조

```
KanbanTasksBoard
├── (fetch) GET /api/projects/[id]/task-wikis
├── wikisByColumn (associated_status로 그룹)
└── KanbanColumns
    └── (각 컬럼) TaskCard 목록 → 업무 추가 버튼 → KanbanWikiList
```

### API

- **`GET /api/projects/[id]/task-wikis`**: `{ wikis: { id, title, task_id, associated_status }[] }` — 팀장·수락 멤버만 (`projectTaskAccessDenied`).
