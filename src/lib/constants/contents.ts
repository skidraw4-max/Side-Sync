/**
 * 서비스 전역에서 재사용하는 한글 UI 문구
 * 톤: 전문적이면서도 친절하게
 */

export const COMMON = {
  /** 확인 */
  confirm: "확인",
  /** 취소 */
  cancel: "취소",
  /** 저장 */
  save: "저장",
  /** 삭제 */
  delete: "삭제",
  /** 수정 */
  edit: "수정",
  /** 닫기 */
  close: "닫기",
  /** 더 보기 */
  more: "더 보기",
  /** 로딩 중 */
  loading: "불러오는 중입니다",
  /** 잠시만 기다려 주세요 */
  pleaseWait: "잠시만 기다려 주세요",
  /** 오류가 발생했습니다 */
  errorGeneric: "문제가 발생했습니다. 잠시 후 다시 시도해 주세요",
  /** 필수 입력 */
  required: "필수",
  /** 선택 */
  optional: "선택",
  /** 검색 */
  search: "검색",
  /** 전체 */
  all: "전체",
  /** 없음 */
  none: "없음",
  /** 등록 */
  register: "등록",
  /** 적용 */
  applyAction: "적용",
  /** 뒤로 */
  back: "뒤로",
  /** 브레드크럼 */
  breadcrumbHome: "홈",
  breadcrumbProjects: "프로젝트",
} as const;

export const WORKSPACE = {
  /** 칸반 — 준비 단계 */
  kanbanColumnTodo: "준비",
  /** 칸반 — 진행 중 */
  kanbanColumnDoing: "진행",
  /** 칸반 — 완료 */
  kanbanColumnDone: "완료",
  /** 칸반 보드 제목 */
  kanbanBoardTitle: "프로젝트 칸반",
  /** 태스크 생성 버튼·모달 */
  taskCreate: "업무 만들기",
  taskCreateNew: "새 업무 등록",
  taskCreateFirst: "첫 업무 만들기",
  taskCreatePlaceholder: "업무 제목을 입력해 주세요",
  taskEdit: "업무 수정",
  taskEmptyTitle: "업무가 없습니다",
  taskEmptyDescription:
    "첫 업무를 등록해 팀의 작업을 한곳에서 관리해 보세요",
  /** 폼 라벨 */
  taskTitleLabel: "제목",
  taskStatusLabel: "상태",
  taskAssigneeLabel: "담당자",
  taskDueDateLabel: "마감일",
  taskPriorityLabel: "우선순위",
  /** 새 업무 모달 하단: 진행 단계 안내 */
  taskColumnHintPrefix: "진행 단계",
  /** 컬럼 하단 추가 */
  taskAddToColumn: "업무 추가",
  /** 우선순위 */
  priorityHigh: "높음",
  priorityMedium: "보통",
  priorityLow: "낮음",
  /** 상태 변경 */
  statusChange: "상태 변경",
  assigneeNone: "담당자 없음",
  assigneeUnset: "미지정",
  /** 검색 */
  taskSearchPlaceholder: "업무 또는 담당자로 검색",
  /** 채팅 */
  chatInputPlaceholder: "메시지를 입력해 주세요. Enter로 전송합니다",
  chatInputHint: "Shift+Enter로 줄바꿈할 수 있어요",
  /** 공지·파일 등 워크스페이스 공통 */
  workspaceWelcome: "팀 워크스페이스에 오신 것을 환영합니다",
  /** 토스트·검증 */
  toastTitleRequired: "제목을 입력해 주세요",
  toastTaskCreated: "업무가 등록되었습니다.",
  toastTaskUpdated: "업무가 수정되었습니다.",
  toastTaskCreateFailedPrefix: "업무 등록에 실패했습니다.",
  toastTaskUpdateFailed: "업무 수정에 실패했습니다.",
  toastStatusChangeFailed: "상태 변경에 실패했습니다.",
  toastAssigneeUpdated: "담당자가 변경되었습니다.",
  toastAssigneeChangeFailed: "담당자 변경에 실패했습니다.",
  saveFailedWithStatus: "저장에 실패했습니다",
  taskRegistering: "등록 중...",
  taskSaving: "저장 중...",
  /** 담당자 옵션 */
  meSelfPrefix: "본인",
  meFallbackName: "나",
  memberFallback: "회원",
  teammate: "팀원",
  recruitingSlotSuffix: "모집 중",
  /** 카드 보조 */
  commentCountLabel: "댓글",
} as const;

export const PROJECT = {
  /** 모집 상태 */
  recruiting: "모집 중",
  recruitingUrgent: "급구",
  recruitmentClosed: "모집 종료",
  recruitmentFull: "모집 마감",
  recruitmentFilled: "충원 완료",
  /** 지원 */
  apply: "지원하기",
  /** 상세·사이드바 참여 CTA */
  applyParticipate: "참여 신청하기",
  approvalPending: "승인 대기 중",
  goToWorkspaceBoard: "워크보드(워크스페이스) 이동",
  applyClosed: "지원 마감",
  applyAgain: "다시 지원하기",
  rejectedApplyHint: "지원이 거절되었습니다. 다시 신청하려면 아래 버튼을 눌러주세요.",
  applicantsManage: "지원자 관리",
  /** 프로젝트 카드·상세 */
  projectDetail: "프로젝트 상세",
  projectEdit: "프로젝트 수정",
  teamLeader: "팀 리더",
  member: "팀원",
  /** 탐색 */
  explore: "프로젝트 둘러보기",
  createProject: "프로젝트 만들기",
  /** 기술·역할 */
  techStack: "기술 스택",
  roleRecruit: "모집 직군",
  /** 상세 섹션 */
  projectIntroduction: "프로젝트 소개",
  technicalStack: "기술 스택",
  recruitmentStatusHeading: "모집 현황",
  teamLeaderHeading: "팀 리더",
  successRateLabel: "성공률",
  mannerTempLabel: "매너 온도",
  recentProjectsHeading: "최근 프로젝트",
  totalCountLabel: "전체",
  recruitmentInfoHeading: "모집 안내",
  recruitmentInfoBody:
    "팀 인터뷰는 지원서 접수 후 1주일 이내 진행됩니다. 합격자에게는 이메일로 안내드립니다.",
  unknownUser: "알 수 없음",
  /** Stitch 레이아웃 */
  navHome: "홈",
  navProjects: "프로젝트",
  activeRecruitmentBadge: "모집 진행 중",
  projectTitlePrefix: "프로젝트",
  recruitmentHeadcountLabel: "모집 인원",
  overview: "개요",
  requiredTechStack: "필수 기술 스택",
  projectMilestones: "프로젝트 마일스톤",
  milestonePhasePrefix: "단계",
  inProgressPercent: "진행 중",
  teamMembersHeading: "팀 구성원",
  mannerShort: "매너",
  recruitmentStatusCard: "모집 현황",
  roleJoined: "충원",
  roleOpen: "모집 중",
  applyComplete: "지원 완료",
  avgResponseTime: "평균 회신: 24시간 이내",
  projectInfoCard: "프로젝트 정보",
  visibilityLabel: "공개 범위",
  durationLabel: "진행 기간",
  estLaunchLabel: "목표 일정",
  monthsUnit: "개월",
  visibilityPublic: "공개",
  visibilityPrivate: "비공개",
  leaderBanner: "이 프로젝트의 팀 리더로 참여 중입니다",
  defaultDescriptionFallback:
    "IoT 센서와 실시간 분석을 활용해 기업의 탄소 발자국을 추적하는 통합 플랫폼입니다. 데이터 기반 인사이트로 지속가능 경영을 돕는 것을 목표로 합니다.",
  milestoneProgressLabel: "진행 중",
  teamLeaderRoleDefault: "프로젝트 리드",
  roleGeneral: "일반",
  /** 포지션별 현황 (상세 하단) */
  positionStatusSection: "포지션별 현황",
  positionStatusJoined: "합류",
  positionStatusPendingApply: "지원 중",
  positionStatusCapacity: "정원",
  positionStatusFullBadge: "모집 완료",
  positionStatusRatioHint: "숫자: (합류+지원 중)/정원",
  /** 데모 모집 카드 배지 (ProjectDetailContent) */
  demoStatusHiring: "모집 중",
  demoStatusUrgent: "급구",
  demoStatusFilled: "충원",
} as const;

/** 네임스페이스별 묶음 (필요 시 한 번에 import) */
export const CONTENTS = {
  COMMON,
  WORKSPACE,
  PROJECT,
} as const;
