"""
업무에 연결된 위키 페이지(task_wiki_pages) INSERT 전담.

SQL 문자열 결합으로 값을 넣지 않고, psycopg2 파라미터 바인딩만 사용합니다.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from psycopg2.extensions import cursor as Cursor  # pragma: no cover


def wiki_title_for_task(task_title: str) -> str:
    """업무 제목을 기준으로 위키 페이지 제목을 만듭니다 (DB RPC와 동일 규칙)."""
    return f"{task_title.strip()} — 위키"


def wiki_body_markdown(task_title: str, description: str | None) -> str:
    """초기 위키 본문(마크다운). `create_task_with_wiki` SQL 함수와 동일한 형식을 유지합니다."""
    title = task_title.strip()
    desc = (description or "").strip()
    overview = desc if desc else "(설명 없음)"
    return f"# {title}\n\n## 개요\n{overview}"


def insert_task_wiki_page(
    cur: "Cursor",
    *,
    task_id: str,
    project_id: str,
    task_title: str,
    task_description: str | None,
    associated_status: str = "requested",
) -> None:
    """
    `task_wiki_pages`에 행을 삽입합니다. 호출부 트랜잭션 안에서만 사용하세요.

    ``associated_status`` 는 칸반 컬럼 키(`tasks.status` 와 동일)입니다.
    """
    title = wiki_title_for_task(task_title)
    body = wiki_body_markdown(task_title, task_description)
    cur.execute(
        """
        INSERT INTO public.task_wiki_pages (
          task_id, project_id, title, body, associated_status
        )
        VALUES (%s::uuid, %s::uuid, %s, %s, %s)
        """,
        (task_id, project_id, title, body, associated_status),
    )
