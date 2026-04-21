"""
프로젝트 칸반 컬럼(업무 단계)별 위키 목록 조회.

위키 INSERT·동기화는 `wiki_service` / DB 트리거가 담당합니다.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Final, Mapping, TypedDict, cast

if TYPE_CHECKING:
    from psycopg2.extensions import cursor as Cursor  # pragma: no cover

# `src/lib/kanban/constants.ts` KANBAN_COLUMN_ORDER 와 동일 순서
KANBAN_TASK_STATUSES: Final[tuple[str, ...]] = (
    "requested",
    "in_progress",
    "feedback",
    "completed",
    "on_hold",
)


class WikiListItem(TypedDict, total=False):
    """task_wiki_pages 한 행(조회 결과)."""

    id: str
    task_id: str
    project_id: str
    title: str
    body: str
    associated_status: str
    created_at: Any
    updated_at: Any


class KanbanColumnWithWikis(TypedDict):
    """단일 칸반 컬럼과 그 단계에 속한 위키 목록."""

    status: str
    wikis: list[WikiListItem]


class KanbanBoardWikisPayload(TypedDict):
    """프로젝트 단위 칸반 + 위키 응답."""

    project_id: str
    columns: list[KanbanColumnWithWikis]


def fetch_kanban_columns_with_wikis(
    cur: "Cursor",
    project_id: str,
) -> KanbanBoardWikisPayload:
    """
    프로젝트에 속한 `task_wiki_pages`를 `associated_status` 기준으로 묶어
    고정 컬럼 순서의 리스트로 반환합니다.

    Args:
        cur: ``RealDictCursor`` 권장(행이 ``Mapping``).
        project_id: 프로젝트 UUID 문자열.
    """
    cur.execute(
        """
        SELECT
          id,
          task_id,
          project_id,
          title,
          body,
          associated_status,
          created_at,
          updated_at
        FROM public.task_wiki_pages
        WHERE project_id = %s::uuid
        ORDER BY associated_status ASC, updated_at DESC
        """,
        (project_id,),
    )
    rows = cur.fetchall()

    buckets: dict[str, list[WikiListItem]] = {s: [] for s in KANBAN_TASK_STATUSES}
    desc = cur.description or ()
    col_names = [d[0] for d in desc]
    for row in rows:
        if isinstance(row, Mapping):
            raw = dict(row)
        else:
            raw = dict(zip(col_names, row))
        item = cast(WikiListItem, raw)
        st = str(item.get("associated_status", "") or "").strip()
        if st in buckets:
            buckets[st].append(item)

    columns: list[KanbanColumnWithWikis] = [
        {"status": s, "wikis": buckets[s]} for s in KANBAN_TASK_STATUSES
    ]
    return {"project_id": project_id, "columns": columns}
