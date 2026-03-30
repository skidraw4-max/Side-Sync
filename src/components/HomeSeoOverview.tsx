import Link from "next/link";
import { Award, Compass, Users } from "lucide-react";

/**
 * 랜딩 SEO용 정적 본문 — 크롤러·애드센스 정책에 맞는 서비스 설명 (클라이언트 번들 밖).
 * 요약은 카드로 노출하고, 전체 문단은 <details> 안에 두어 인덱싱은 유지·UI는 간결하게 합니다.
 */
export default function HomeSeoOverview() {
  return (
    <section
      className="border-t border-slate-200 bg-slate-50/80 px-6 py-16 md:px-12 md:py-20 lg:px-24"
      aria-labelledby="home-seo-overview-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="home-seo-overview-heading"
          className="text-center text-2xl font-bold tracking-tight text-slate-900 md:text-3xl"
        >
          Side-Sync로 사이드 프로젝트를 처음부터 끝까지
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-slate-600 md:text-lg">
          아이디어 단계부터 팀 구성, 협업, 완주 인증까지 한 플랫폼에서 이어 갈 수 있습니다.{" "}
          <strong className="font-semibold text-slate-800">프로젝트 탐색</strong>,{" "}
          <strong className="font-semibold text-slate-800">팀 빌딩</strong>,{" "}
          <strong className="font-semibold text-slate-800">링크드인 연동 증명서</strong>를 카드로
          살펴보세요.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
          <article
            className="scroll-mt-24 flex flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
            id="project-explore"
          >
            <div
              className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700"
              aria-hidden
            >
              <Compass className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">프로젝트 탐색</h3>
            <ul className="mt-3 flex-1 space-y-2 text-sm leading-relaxed text-slate-600">
              <li>개발·디자인·기획 등 사이드 프로젝트 모집 공고를 한곳에서 탐색합니다.</li>
              <li>스택·포지션·성격을 기준으로 공고를 비교하고 관심 팀에 지원할 수 있습니다.</li>
              <li>인기·추천 영역으로 최근 활동이 많은 모집을 빠르게 훑어볼 수 있습니다.</li>
              <li>로그인 후 대시보드에서 지원·진행 프로젝트를 이어 관리합니다.</li>
            </ul>
            <details
              className="mt-4 border-t border-gray-100 pt-4"
              aria-label="프로젝트 탐색 전체 설명 펼치기"
            >
              <summary className="cursor-pointer list-none text-sm font-medium text-blue-600 hover:underline [&::-webkit-details-marker]:hidden">
                자세히 보기
              </summary>
              <div className="prose prose-slate prose-sm mt-3 max-w-none text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600">
                <p>
                  Side-Sync는 개발·디자인·기획 등 다양한 역할이 모이는{" "}
                  <strong>사이드 프로젝트 모집 공고</strong>를 한곳에서 탐색할 수 있게 구성되어
                  있습니다. 기술 스택, 모집 포지션, 프로젝트 성격을 기준으로 공고를 비교하고, 관심 있는
                  팀에 지원해 볼 수 있습니다. 메인 화면의 인기·추천 프로젝트 영역에서는 최근 활동이 많은
                  모집을 빠르게 훑어볼 수 있어, 처음 방문한 분도 흐름을 파악하기 쉽습니다.
                </p>
                <p>
                  로그인 후에는 내가 지원한 프로젝트와 진행 중인 협업을 대시보드에서 이어서 관리할 수
                  있습니다. 더 넓게 둘러보려면{" "}
                  <Link href="/explore">프로젝트 탐색(Explore)</Link> 경로로도 동일한 랜딩 흐름에
                  진입할 수 있습니다.
                </p>
              </div>
            </details>
          </article>

          <article
            className="scroll-mt-24 flex flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
            id="team-building"
          >
            <div
              className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700"
              aria-hidden
            >
              <Users className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">팀 빌딩 시스템</h3>
            <ul className="mt-3 flex-1 space-y-2 text-sm leading-relaxed text-slate-600">
              <li>팀장은 프로젝트 등록·모집 역할·일정·소개로 팀을 열 수 있습니다.</li>
              <li>지원·수락 후 전용 워크스페이스에서 칸반·채팅·공지로 협업합니다.</li>
              <li>프로필·매너 온도·기술 태그는 상호 이해를 돕는 참고 정보로 쓰입니다.</li>
              <li>협업 종료 후 상호 피드백이 다음 매칭과 성장에 연결됩니다.</li>
            </ul>
            <details
              className="mt-4 border-t border-gray-100 pt-4"
              aria-label="팀 빌딩 시스템 전체 설명 펼치기"
            >
              <summary className="cursor-pointer list-none text-sm font-medium text-blue-600 hover:underline [&::-webkit-details-marker]:hidden">
                자세히 보기
              </summary>
              <div className="prose prose-slate prose-sm mt-3 max-w-none text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600">
                <p>
                  팀장은 프로젝트를 등록하고 모집 역할·일정·소개를 작성해 팀을 열 수 있습니다. 지원자는
                  프로필과 희망 포지션을 바탕으로 신청하고, 팀장은 지원 내역을 검토해 수락 여부를
                  결정합니다. 수락된 멤버는{" "}
                  <strong>전용 워크스페이스</strong>에 참여해 칸반 작업, 채팅, 공지 등으로 일정과
                  산출물을 맞춰 갑니다.
                </p>
                <p>
                  프로필의 매너 온도·기술 태그 등은 상호 이해를 돕는 참고 정보로 활용될 수 있으며, 협업
                  종료 후에는 상호 피드백을 통해 다음 매칭과 성장에도 연결됩니다. 팀을 만들 준비가
                  되었다면 <Link href="/signup">회원 가입</Link> 후 프로젝트를 등록해 보세요.
                </p>
              </div>
            </details>
          </article>

          <article
            className="scroll-mt-24 flex flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 sm:col-span-2 lg:col-span-1"
            id="linkedin-certificate"
          >
            <div
              className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700"
              aria-hidden
            >
              <Award className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">링크드인 연동 증명서</h3>
            <ul className="mt-3 flex-1 space-y-2 text-sm leading-relaxed text-slate-600">
              <li>플랫폼 기준에 따라 완료된 프로젝트에 활동 확인서(증명서)가 발급될 수 있습니다.</li>
              <li>프로젝트명·참여 기간·역할·발급 번호 등이 포함되며 링크드인에 바로 추가할 수 있습니다.</li>
              <li>공개 검증 코드로 제3자도 발급 사실을 확인할 수 있습니다.</li>
              <li>운영 정책·안내는 공지사항에서 확인할 수 있습니다.</li>
            </ul>
            <details
              className="mt-4 border-t border-gray-100 pt-4"
              aria-label="링크드인 연동 증명서 전체 설명 펼치기"
            >
              <summary className="cursor-pointer list-none text-sm font-medium text-blue-600 hover:underline [&::-webkit-details-marker]:hidden">
                자세히 보기
              </summary>
              <div className="prose prose-slate prose-sm mt-3 max-w-none text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600">
                <p>
                  프로젝트가 플랫폼 기준에 따라 <strong>완료(Completed)</strong> 처리되면, 참여자에게
                  Side-Sync <strong>활동 확인서(증명서)</strong>가 발급될 수 있습니다. 확인서에는
                  프로젝트명, 참여 기간, 역할, 발급 번호 등이 포함되며, 링크드인 프로필의 &quot;라이선스 및
                  자격증&quot; 항목에 바로 추가할 수 있는 링크를 제공합니다.
                </p>
                <p>
                  공개 검증 코드를 통해 제3자도 발급 사실을 확인할 수 있어, 채용 담당자나 협업 상대에게
                  실무 경험을 설명할 때 객관적인 근거로 활용하기 좋습니다. 확인서는 Side-Sync 내 활동
                  기록을 바탕으로 하며 법적 효력을 주장하지 않는 안내 문구를 함께 표시합니다. 서비스
                  운영 정책과 공지는 <Link href="/announcements">공지사항</Link>에서 확인할 수 있습니다.
                </p>
              </div>
            </details>
          </article>
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          Side-Sync에 대해 더 알고 싶다면{" "}
          <Link href="/about" className="font-medium text-blue-600 hover:underline">
            소개(About)
          </Link>
          페이지를 참고하세요.
        </p>
      </div>
    </section>
  );
}
