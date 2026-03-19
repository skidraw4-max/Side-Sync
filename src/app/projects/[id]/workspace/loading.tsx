import { ChatMessagesSkeleton, Skeleton } from "@/components/Skeleton";

/** 워크스페이스(채팅/업무 등) 진입 시 표시되는 로딩 스켈레톤 */
export default function WorkspaceLoading() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* 사이드바 스켈레톤 */}
      <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-[#FAFAFA] sm:block">
        <div className="flex h-14 items-center border-b border-gray-200 px-4">
          <Skeleton className="h-4 w-24" rounded="md" />
        </div>
        <div className="space-y-2 p-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" rounded="lg" />
          ))}
        </div>
      </aside>
      {/* 메인 채팅 영역 스켈레톤 */}
      <main className="flex min-w-0 flex-1 flex-col bg-white">
        <header className="flex h-14 shrink-0 items-center border-b border-gray-100 px-4 sm:px-6">
          <Skeleton className="h-5 w-32" rounded="md" />
        </header>
        <div className="min-h-0 flex-1 overflow-hidden bg-[#FAFAFA]">
          <ChatMessagesSkeleton />
        </div>
      </main>
    </div>
  );
}
