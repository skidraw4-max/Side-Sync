"""프로젝트·통계 관련 Python 서비스 (선택적 배포용)."""

from .project_stats_service import (
    PROJECT_LIFECYCLE_STATUSES,
    ProjectLifecycleCounts,
    fetch_project_lifecycle_counts,
)

__all__ = [
    "PROJECT_LIFECYCLE_STATUSES",
    "ProjectLifecycleCounts",
    "fetch_project_lifecycle_counts",
]
