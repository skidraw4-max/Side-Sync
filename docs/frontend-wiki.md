# Frontend 위키 (Side-Sync)

## 메인 랜딩 구조

- 페이지: `src/app/page.tsx` — 루트 배경 `#e8ecf1`, `HomeBentoGrid`만(벤토 2열·모바일 1열). 하단 `FeatureCards`·`HomeSeoOverview`·`HomeProjectsAndTrending`는 메인에서 제거됨(컴포넌트 파일은 보존).
- 레이아웃: `HomeBentoGrid` — (1) Profile|LiveStats 2열 → (2) Trending **전폭** → (3) Kanban **전폭** → (4) Community|CTA 2열. 컨테이너 `max-w-6xl`로 좌우폭 통일.
- 벤토 배경: `#e8ecf1`, 패널은 `rounded-xl`(12px) + `shadow-[0_4px_24px_…]` 계열.
- 헤더 로고: `HeaderBrandWordmark` — `public/images/image-2.png`(사용자 제공 블루 그라데이션 마크, 1024²).
- 데스크톱·로그인 네비 라벨: Homes, Explorer, My Projects, About. Sign In: `rounded-full`, `bg-[#0f2744]`.
- `BentoLiveStats`: `GET /api/stats/projects`, 실패 시 154/87/129, 인라인 `Recruiting:` 등 + 굵은 숫자. 클릭 시 `home-project-cards`.
- 메인 트렌딩 UI: `BentoTrendingProjects` (`src/components/bento/BentoTrendingProjects.tsx`) — 별도 하단 `TrendingProjects` 섹션 없음. `TrendingProjects.tsx`는 레거시·다른 용도 보존.

## `ProjectStats` (레거시 컴포넌트)

- **파일**: `src/components/main/ProjectStats.tsx`
- **메인 페이지**: 벤토 `BentoLiveStats`가 동일 `GET /api/stats/projects`를 사용하며, 메인 랜딩에서는 더 이상 `ProjectStats`를 쓰지 않습니다. 다른 페이지에서 쓸 경우 이 컴포넌트를 재사용할 수 있습니다.

## 스크롤 앵커

- **id**: `home-project-cards` — `HomeBentoGrid.tsx` 최상단 `<section>`에 부여, `scroll-mt-24`로 고정 헤더 보정. Live Stats 클릭 시 벤토 영역으로 스크롤.

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
