/** Our Origin Story — 한국어 SEO 본문 */
export default function AboutOriginStory() {
  return (
    <section
      className="border-b border-gray-100 bg-white px-6 py-16 md:px-10 md:py-20 lg:px-16 lg:py-24 xl:px-24"
      aria-labelledby="about-origin-heading"
    >
      <div className="mx-auto max-w-3xl lg:max-w-4xl">
        <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-[#2563EB] md:text-left">
          OUR ORIGIN STORY
        </p>
        <h2
          id="about-origin-heading"
          className="mt-3 text-center text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-left md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
        >
          여러분의 완주가 커리어가 되는 곳
        </h2>

        <div className="prose prose-slate mx-auto mt-8 max-w-none text-[0.9375rem] leading-[1.75] text-gray-600 prose-p:mb-5 md:text-base md:leading-relaxed">
          <p>
            사이드 프로젝트는 이력서 한 줄을 넘어, 실제 협업·배포·피드백까지 경험할 수 있는{" "}
            <strong className="font-semibold text-gray-800">가장 현실적인 커리어 실험장</strong>
            입니다. 그러나 팀원을 구하고 역할을 나누며 마감을 맞추는 과정에서 많은 팀이
            소모되거나 중도에 멈춥니다. Side-Sync는 그 간극을 메우기 위해 설계되었습니다.
          </p>
          <p>
            우리는 <strong className="font-semibold text-gray-800">모집 공고·기술 스택·모집 정원</strong>
            을 구조화해 공고의 재현 가능성을 높이고, 지원과 수락의 흐름을 한 플랫폼에서 추적할 수
            있게 했습니다. 팀이 모이면{" "}
            <strong className="font-semibold text-gray-800">전용 워크스페이스</strong>에서 칸반·채팅·공지로
            실행을 이어 가고, 프로젝트가 완료되면 참여자는{" "}
            <strong className="font-semibold text-gray-800">활동 확인서</strong>와 공개 검증 코드로 외부에
            완주를 설명할 수 있습니다. 링크드인 자격 증명 연동은 채용 담당자가 읽기 쉬운 형태로 경험을
            전달하도록 돕습니다.
          </p>
          <p>
            <strong className="font-semibold text-gray-800">프로젝트 탐색</strong>으로 커뮤니티 모집을
            비교하고, <strong className="font-semibold text-gray-800">팀 빌딩</strong>으로 리더와 지원자가
            서로를 선택하며, <strong className="font-semibold text-gray-800">워크스페이스</strong>로 속도를
            맞춥니다. 운영 정책·업데이트는 공지사항에, 개인정보·쿠키는 개인정보처리방침에 따릅니다.
            Side-Sync는 법적 증명을 대체하지 않지만,{" "}
            <strong className="font-semibold text-gray-800">협업과 완주의 기록</strong>을 남겨 &quot;함께 끝낸
            프로젝트&quot;를 커리어 서사로 연결합니다.
          </p>
          <p>
            지금 모집 중인 팀을 둘러보거나, 당신의 아이디어로 새 프로젝트를 열어 보세요. 작은 완주가
            쌓일 때, 사이드 프로젝트는 설득력 있는{" "}
            <strong className="font-semibold text-gray-800">경력의 증거</strong>가 됩니다.
          </p>
        </div>
      </div>
    </section>
  );
}
