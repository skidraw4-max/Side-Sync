/**
 * 참여 프로젝트(`useMyProjects` / `fetchProjectsByIds` 등) 브라우저 콘솔 디버그.
 * 끄려면 `NEXT_PUBLIC_DEBUG_MY_PROJECTS=0` 설정 후 재배포 (또는 아래 `true` → `false`).
 */
export function isMyProjectsDebugEnabled(): boolean {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_MY_PROJECTS === "0") {
    return false;
  }
  return true;
}
