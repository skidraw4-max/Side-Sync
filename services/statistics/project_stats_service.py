"""
프로젝트 라이프사이클(hiring / ongoing / completed)별 건수 조회.

Supabase(PostgreSQL) `public.projects.status`와 동일한 CHECK 제약을 전제로 합니다.
동적 값은 모두 쿼리 파라미터로만 전달하여 SQL 문자열 결합을 피합니다.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Final, TypedDict

if TYPE_CHECKING:
    from psycopg2.extensions import cursor as Cursor  # pragma: no cover

# DB CHECK 와 정렬 (src/types/database.ts ProjectLifecycleStatus 와 일치)
PROJECT_LIFECYCLE_STATUSES: Final[tuple[str, ...]] = ("hiring", "ongoing", "completed")

# 화이트리스트만 ANY에 넘깁니다. 호출부에서 임의 문자열을 섞지 마세요.
_STATUS_FILTER_SQL: Final[str] = """
SELECT p.status::text AS status, COUNT(*)::bigint AS cnt
FROM public.projects AS p
WHERE p.status = ANY(%s::text[])
GROUP BY p.status
"""


class ProjectLifecycleCounts(TypedDict):
    hiring: int
    ongoing: int
    completed: int


def fetch_project_lifecycle_counts(cur: "Cursor") -> ProjectLifecycleCounts:
    """
    `status IN ('hiring','ongoing','completed')` 에 대해 건수를 반환합니다.
    `cur`는 psycopg2 커서(또는 동일한 execute 인터페이스)여야 합니다.

    파라미터는 단일 배열 %s 한 곳에만 바인딩됩니다.
    """
    cur.execute(_STATUS_FILTER_SQL, (list(PROJECT_LIFECYCLE_STATUSES),))
    rows = cur.fetchall()
    out: ProjectLifecycleCounts = {"hiring": 0, "ongoing": 0, "completed": 0}
    for status, cnt in rows:
        key = str(status).strip().lower()
        if key in out:
            out[key] = int(cnt)
    return out
