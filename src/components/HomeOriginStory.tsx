/**
 * Our Origin Story — 한국어 SEO 본문 + 미니멀 수치 스트립.
 */
export default function HomeOriginStory() {
  return (
    <section
      className="border-b border-gray-100 bg-white px-6 py-16 md:px-10 md:py-20 lg:px-16 lg:py-24 xl:px-24"
      aria-labelledby="origin-story-heading"
    >
      <div className="mx-auto max-w-3xl lg:max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2563EB]">
          Our Origin Story
        </p>
        <h2
          id="origin-story-heading"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
        >
          여러분의 완주가 커리어가 되는 곳
        </h2>

        <div className="prose prose-slate mt-8 max-w-none text-[0.9375rem] leading-[1.75] text-gray-600 prose-p:mb-5 md:text-base md:leading-relaxed">
          <p>
            사이드 프로젝트는 포트폴리오 한 줄을 넘어, 실제로 협업하고 배포·운영까지 경험할 수 있는{" "}
            <strong className="font-semibold text-gray-800">가장 현실적인 커리어 실험장</strong>
            입니다. 그러나 팀원을 구하고 역할을 나누며 일정을 맞추는 과정에서 많은 분이
            번아웃하거나 중도에 멈춥니다. Side-Sync는 그 &quot;중간의 벽&quot;을 낮추기 위해
            만들어졌습니다.
          </p>
          <p>
            우리는 <strong className="font-semibold text-gray-800">모집 공고·기술 스택·모집 정원</strong>
            을 구조화해 공고의 신뢰도를 높이고, 지원과 수락의 흐름을 한 플랫폼 안에서 추적할 수 있게
            했습니다. 팀이 모이면 <strong className="font-semibold text-gray-800">전용 워크스페이스</strong>
            에서 칸반·채팅·공지로 협업을 이어 가고, 프로젝트가 플랫폼 기준에 따라 완료되면 참여자는{" "}
            <strong className="font-semibold text-gray-800">활동 확인서</strong>와 공개 검증 코드를 통해
            외부에도 완주 경험을 설명할 수 있습니다. 링크드인 자격 증명 연동으로 채용 담당자에게
            읽히기 쉬운 형태로 남길 수 있다는 점도 Side-Sync가 지향하는 &quot;완주가 곧 경력&quot;의
            한 축입니다.
          </p>
          <p>
            <strong className="font-semibold text-gray-800">프로젝트 탐색</strong>으로 커뮤니티의 모집을
            비교하고, <strong className="font-semibold text-gray-800">팀 빌딩</strong>으로 리더와
            지원자가 서로를 선택하며, <strong className="font-semibold text-gray-800">워크스페이스</strong>
            로 실행을 지속합니다. 서비스 운영 정책·업데이트는 공지사항에 게시하며, 개인정보와 광고
            쿠키는 개인정보 처리방침에 따라 안내합니다. Side-Sync는 법적 증명서를 대체하지 않지만,{" "}
            <strong className="font-semibold text-gray-800">협업과 완주의 흔적</strong>을 데이터와 문서로
            남겨 &quot;혼자 한 프로젝트&quot;가 아니라 &quot;함께 끝낸 프로젝트&quot;로 기록되도록
            돕습니다.
          </p>
          <p>
            지금 바로 모집 중인 팀을 둘러보거나, 당신의 아이디어로 새 프로젝트를 열어 보세요. 작은
            한 사이클이 쌓일 때, 사이드 프로젝트는 이력서 너머의{" "}
            <strong className="font-semibold text-gray-800">설득력 있는 경력 서사</strong>가 됩니다.
          </p>
        </div>

        <dl className="mt-14 grid grid-cols-1 gap-10 border-t border-gray-100 pt-12 sm:grid-cols-3 sm:gap-8 md:gap-12">
          <div className="text-center sm:text-left">
            <dt className="text-2xl font-bold tabular-nums tracking-tight text-gray-900 md:text-3xl">
              99.8%
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-gray-900">구조화된 모집 데이터</dd>
            <dd className="mt-1 text-xs leading-relaxed text-gray-500">
              역할·정원 필드 기준 공고 스키마 적용
            </dd>
          </div>
          <div className="text-center sm:text-left">
            <dt className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">실시간</dt>
            <dd className="mt-1.5 text-sm font-medium text-gray-900">지원·수락 흐름</dd>
            <dd className="mt-1 text-xs leading-relaxed text-gray-500">
              알림과 대시보드로 진행 상태 추적
            </dd>
          </div>
          <div className="text-center sm:text-left">
            <dt className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">온라인</dt>
            <dd className="mt-1.5 text-sm font-medium text-gray-900">워크스페이스 협업</dd>
            <dd className="mt-1 text-xs leading-relaxed text-gray-500">
              비동기 소통에 맞춘 보드·채팅·공지
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
