# Frontend 위키 (Side-Sync)

## 메인 랜딩 구조

- 페이지: `src/app/page.tsx` — `Hero` → `FeatureCards` → `HomeSeoOverview` → `HomeProjectsAndTrending`.
- 프로젝트 카드 그리드(트렌딩): `HomeProjectsAndTrending` 내부의 `TrendingProjects` (`src/components/TrendingProjects.tsx`).

## `ProjectStats` (히어로 통계)

- **파일**: `src/components/main/ProjectStats.tsx`
- **위치**: `Hero` 하단 CTA 아래 (`src/components/Hero.tsx`).
- **데이터**: `GET /api/stats/projects` — 로딩 중에는 스켈레톤(`Skeleton`), 완료 후 숫자는 약 0.9초 동안 카운트업(ease-out cubic).
- **레이아웃**: 모바일 `flex-col`, `sm` 이상에서 `flex-row`로 가로 배치.
- **스타일**: Tailwind, 카드·포커스 링 `rounded-xl`, 강조색 `#2563EB` (프로젝트 `.cursorrules`와 정합).
- **인터랙션**: 각 통계 버튼 클릭 시 `document.getElementById("home-project-cards")?.scrollIntoView({ behavior: "smooth" })`로 트렌딩 프로젝트 카드 영역으로 스크롤합니다.

## 스크롤 앵커

- **id**: `home-project-cards` — `src/components/HomeProjectsAndTrending.tsx`에서 트렌딩 섹션 래퍼에 부여, `scroll-mt-24`로 고정 헤더 보정.

## 관련 타입

- API 응답: `ProjectStatsPayload` / `ProjectStatsResponse` (`recruiting`, `inProgress`, `completed`) — `ProjectStats.tsx` 및 `src/app/api/stats/projects/route.ts` 참고.
