"""
업무(tasks) 생성 및 동일 트랜잭션 내 위키(task_wiki_pages) 생성.

검증은 호출부(HTTP API 등)에서 수행한다고 가정합니다.
"""

from __future__ import annotations

from typing import Any, TypedDict

from .wiki_service import insert_task_wiki_page


class TaskCreateParams(TypedDict, total=False):
    """`tasks` INSERT에 대응하는 필드."""

    project_id: str
    title: str
    category: str
    priority: str
    status: str
    assignee_id: str | None
    requested_by: str | None
    sort_order: int | None
    due_date: str | None
    description: str | None


def _normalize_description(raw: str | None) -> str | None:
    if raw is None:
        return None
    t = raw.strip()
    if not t:
        return None
    return t[:8000]


def create_task_with_wiki(
    conn: Any,
    params: TaskCreateParams,
) -> dict[str, Any]:
    """
    업무를 삽입한 뒤 연결된 위키 페이지를 삽입합니다. 둘 중 하나라도 실패하면 롤백됩니다.

    Returns:
        ``{"task": row_dict, "wiki": row_dict}`` — ``RealDictCursor`` 행 매핑.
    """
    from psycopg2.extras import RealDictCursor  # 지역 import — 선택 의존 경로와 동일

    project_id = params["project_id"]
    title = params["title"].strip()
    category = (params.get("category") or "GENERAL").strip() or "GENERAL"
    priority = params["priority"]
    status = params.get("status") or "requested"
    assignee_id = params.get("assignee_id")
    requested_by = params.get("requested_by")
    sort_order = params.get("sort_order")
    due_date = params.get("due_date")
    description = _normalize_description(params.get("description"))

    if not title:
        raise ValueError("title is required")

    old_autocommit = conn.autocommit
    conn.autocommit = False
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO public.tasks (
                  project_id, title, category, priority, status,
                  assignee_id, requested_by, sort_order, due_date, description
                )
                VALUES (
                  %s::uuid, %s, %s, %s, %s,
                  %s::uuid, %s::uuid, %s, %s::date, %s
                )
                RETURNING *
                """,
                (
                    project_id,
                    title,
                    category,
                    priority,
                    status,
                    assignee_id,
                    requested_by,
                    sort_order if sort_order is not None else 0,
                    due_date,
                    description,
                ),
            )
            task_row = cur.fetchone()
            if task_row is None:
                raise RuntimeError("task insert returned no row")
            task_id = str(task_row["id"])

            insert_task_wiki_page(
                cur,
                task_id=task_id,
                project_id=project_id,
                task_title=title,
                task_description=description,
                associated_status=status,
            )

            cur.execute(
                """
                SELECT * FROM public.task_wiki_pages
                WHERE task_id = %s::uuid
                """,
                (task_id,),
            )
            wiki_row = cur.fetchone()
            if wiki_row is None:
                raise RuntimeError("wiki insert not visible")

        conn.commit()
        return {"task": dict(task_row), "wiki": dict(wiki_row)}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.autocommit = old_autocommit
