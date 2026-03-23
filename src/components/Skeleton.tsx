"use client";

interface SkeletonProps {
  /** 기본 블록. className으로 크기 지정 */
  className?: string;
  /** rounded 스타일: none | sm | md | lg | full */
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

const roundedMap = {
  none: "",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

/** 반짝이는 회색 박스 ( shimmer 스켈레톤 ) */
export function Skeleton({ className = "", rounded = "md" }: SkeletonProps) {
  return (
    <div
      className={`bg-gray-200 bg-[length:200%_100%] bg-[position:-200%_0] animate-shimmer ${roundedMap[rounded]} ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)",
      }}
      aria-hidden
    />
  );
}

/** 프로젝트 카드 형태 스켈레톤 (메인/프로필) */
export function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <Skeleton className="h-[4.9rem] w-full sm:h-20" rounded="none" />
      <div className="space-y-2 p-3.5">
        <Skeleton className="h-4 w-3/4" rounded="md" />
        <Skeleton className="h-3 w-full" rounded="md" />
        <Skeleton className="h-3 w-2/3" rounded="md" />
      </div>
      <div className="border-t border-gray-100 bg-gray-50/60 px-3.5 py-2">
        <Skeleton className="mb-1.5 h-2.5 w-16" rounded="md" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14" rounded="md" />
          <Skeleton className="h-5 w-12" rounded="md" />
          <Skeleton className="h-5 w-16" rounded="md" />
        </div>
      </div>
      <div className="border-t border-gray-100 px-3.5 py-3">
        <Skeleton className="h-8 w-full" rounded="md" />
      </div>
    </div>
  );
}

/** 프로필 페이지 전체 스켈레톤 (ProfileHeader는 페이지에서 따로 래핑) */
export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-6 pb-16 pt-8 md:px-12 lg:px-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 프로필 카드 스켈레톤 */}
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <div className="flex flex-col items-center md:flex-row md:items-start">
                <Skeleton className="h-[120px] w-[120px] shrink-0" rounded="full" />
                <div className="mt-6 flex-1 space-y-3 md:ml-8 md:mt-0">
                  <Skeleton className="h-7 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-28" rounded="lg" />
                </div>
              </div>
            </div>
            {/* 매너 온도 스켈레톤 */}
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <div className="flex flex-col items-center">
                <Skeleton className="h-32 w-32" rounded="full" />
                <Skeleton className="mt-4 h-5 w-24" />
                <Skeleton className="mt-2 h-4 w-36" />
              </div>
            </div>
          </div>

          {/* My Active Projects 섹션 스켈레톤 */}
          <div className="mt-12">
            <div className="mb-6 flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** 지원자 관리 페이지 스켈레톤 */
export function ManageApplicantsSkeleton() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 사이드바 placeholder */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
        <div className="p-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-4 h-4 w-24" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 헤더 placeholder */}
        <header className="border-b border-slate-200 bg-white px-6 py-4">
          <Skeleton className="h-10 w-64" rounded="lg" />
        </header>

        <main className="flex-1 px-6 py-8 md:px-10">
          <div className="mx-auto max-w-4xl">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="mt-2 h-8 w-80" />
            <div className="mt-6 flex gap-2">
              <Skeleton className="h-4 w-24" rounded="md" />
              <Skeleton className="h-4 w-20" rounded="md" />
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-4xl space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:gap-6"
              >
                <Skeleton className="h-14 w-14 shrink-0" rounded="full" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-20" rounded="md" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" rounded="md" />
                    <Skeleton className="h-5 w-14" rounded="md" />
                    <Skeleton className="h-5 w-12" rounded="md" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-9 w-24" rounded="lg" />
                    <Skeleton className="h-9 w-20" rounded="lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

/** 평가 페이지 스켈레톤 (팀원 평가 카드 형태) */
export function EvaluatePageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-3 w-36" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />
      <div className="mt-6 flex gap-2">
        <Skeleton className="h-7 w-24" rounded="full" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex gap-4">
            <Skeleton className="h-14 w-14 shrink-0" rounded="full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-8 w-24" rounded="full" />
                <Skeleton className="h-8 w-20" rounded="full" />
              </div>
              <Skeleton className="h-20 w-full" rounded="lg" />
              <Skeleton className="h-9 w-32" rounded="lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 채팅 메시지 목록 스켈레톤 */
export function ChatMessagesSkeleton() {
  return (
    <div className="space-y-6 px-4 py-4 sm:px-6">
      <div className="flex justify-center">
        <Skeleton className="h-6 w-20" rounded="full" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-9 shrink-0" rounded="full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-64 rounded-2xl" rounded="lg" />
        </div>
      </div>
      <div className="flex gap-3 flex-row-reverse">
        <div className="space-y-2 flex-1 flex flex-col items-end">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-10 w-48 rounded-2xl" rounded="lg" />
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-9 shrink-0" rounded="full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-14 w-72 rounded-2xl" rounded="lg" />
        </div>
      </div>
    </div>
  );
}
