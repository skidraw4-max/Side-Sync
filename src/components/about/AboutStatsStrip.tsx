export default function AboutStatsStrip() {
  return (
    <section
      className="border-b border-gray-100 bg-white px-6 py-14 md:px-10 md:py-16 lg:px-16 xl:px-24"
      aria-label="플랫폼 지표"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8 md:gap-12">
        <div className="text-center sm:text-left">
          <p className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl lg:text-[1.65rem]">
            100% Verified Projects
          </p>
          <p className="mt-2 text-sm text-gray-500">검증된 프로젝트</p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl lg:text-[1.65rem]">
            Real-time Matching
          </p>
          <p className="mt-2 text-sm text-gray-500">실시간 팀 매칭</p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl lg:text-[1.65rem]">
            Active Community
          </p>
          <p className="mt-2 text-sm text-gray-500">활발한 소통</p>
        </div>
      </div>
    </section>
  );
}
