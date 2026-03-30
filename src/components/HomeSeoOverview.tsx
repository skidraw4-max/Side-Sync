import Link from "next/link";
import { BadgeCheck, Compass, UsersRound } from "lucide-react";

/**
 * 랜딩 SEO용 정적 본문 — 카드 요약 + details로 전체 텍스트(크롤러 인덱싱 유지).
 */
export default function HomeSeoOverview() {
  return (
    <section
      className="border-t border-slate-200 bg-slate-50/80 px-6 py-14 md:px-12 md:py-16 lg:px-24"
      aria-labelledby="home-seo-overview-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="home-seo-overview-heading"
          className="text-center text-2xl font-bold tracking-tight text-slate-900 md:text-3xl"
        >
          Side-Sync로 사이드 프로젝트를 처음부터 끝까지
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-600 md:text-base">
          <strong className="font-semibold text-slate-800">탐색 · 팀 빌딩 · 증명서</strong>를 카드로
          요약했습니다. 전체 설명은 각 카드의「자세히 보기」에서 펼칠 수 있으며, 검색엔진도 동일
          본문을 읽습니다.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-6">
          {/* 프로젝트 탐색 */}
          <article
            id="project-explore"
            className="scroll-mt-24 rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div
              className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-50 text-slate-700 ring-1 ring-gray-100"
              aria-hidden
            >
              <Compass className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">프로젝트 탐색</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              <li>
                <strong className="font-semibold text-slate-800">모집 공고</strong>를 한곳에서
                훑어보고, 스택·포지션으로 비교합니다.
              </li>
              <li>
                인기·추천 영역으로 <strong className="font-semibold text-slate-800">빠른 탐색</strong>
                , 지원 후에는 대시보드에서 이어 갑니다.
              </li>
              <li>
                <Link href="/explore" className="font-medium text-blue-600 hover:underline">
                  Explore
                </Link>
                로도 동일한 흐름에 진입할 수 있습니다.
              </li>
            </ul>
            <details className="group mt-4 border-t border-gray-100 pt-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-blue-600 outline-none marker:content-none [&::-webkit-details-marker]:hidden hover:underline">
                자세히 보기
              </summary>
              <div className="prose prose-slate mt-3 max-w-none text-sm text-slate-700 prose-p:leading-relaxed prose-strong:text-slate-800 prose-a:text-blue-600">
                <p>
                  Side-Sync는 개발·디자인·기획 등 다양한 역할이 모이는{" "}
                  <strong>사이드 프로젝트 모집 공고</strong>를 한곳에서 탐색할 수 있게 구성되어
                  있습니다. 기술 스택, 모집 포지션, 프로젝트 성격을 기준으로 공고를 비교하고, 관심
                  있는 팀에 지원해 볼 수 있습니다. 메인 화면의 인기·추천 프로젝트 영역에서는 최근 활동이
                  많은 모집을 빠르게 훑어볼 수 있어, 처음 방문한 분도 흐름을 파악하기 쉽습니다.
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

          {/* 팀 빌딩 */}
          <article
            id="team-building"
            className="scroll-mt-24 rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div
              className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-50 text-slate-700 ring-1 ring-gray-100"
              aria-hidden
            >
              <UsersRound className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">팀 빌딩 시스템</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              <li>
                리더는 <strong className="font-semibold text-slate-800">등록·모집</strong>, 지원자는
                프로필로 신청하고 수락·거절로 팀이 완성됩니다.
              </li>
              <li>
                <strong className="font-semibold text-slate-800">전용 워크스페이스</strong>에서 칸반,
                채팅, 공지로 일정과 산출물을 맞춥니다.
              </li>
              <li>
                매너 온도·기술 태그·종료 후 피드백으로{" "}
                <strong className="font-semibold text-slate-800">신뢰·성장</strong>에 연결됩니다.
              </li>
            </ul>
            <details className="group mt-4 border-t border-gray-100 pt-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-blue-600 outline-none marker:content-none [&::-webkit-details-marker]:hidden hover:underline">
                자세히 보기
              </summary>
              <div className="prose prose-slate mt-3 max-w-none text-sm text-slate-700 prose-p:leading-relaxed prose-strong:text-slate-800 prose-a:text-blue-600">
                <p>
                  팀장은 프로젝트를 등록하고 모집 역할·일정·소개를 작성해 팀을 열 수 있습니다.
                  지원자는 프로필과 희망 포지션을 바탕으로 신청하고, 팀장은 지원 내역을 검토해 수락
                  여부를 결정합니다. 수락된 멤버는{" "}
                  <strong>전용 워크스페이스</strong>에 참여해 칸반 작업, 채팅, 공지 등으로 일정과
                  산출물을 맞춰 갑니다.
                </p>
                <p>
                  프로필의 매너 온도·기술 태그 등은 상호 이해를 돕는 참고 정보로 활용될 수 있으며,
                  협업 종료 후에는 상호 피드백을 통해 다음 매칭과 성장에도 연결됩니다. 팀을 만들 준비가
                  되었다면 <Link href="/signup">회원 가입</Link> 후 프로젝트를 등록해 보세요.
                </p>
              </div>
            </details>
            <p className="mt-3">
              <Link
                href="/signup"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                회원 가입하고 팀 만들기 →
              </Link>
            </p>
          </article>

          {/* 링크드인 증명서 */}
          <article
            id="linkedin-certificate"
            className="scroll-mt-24 rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div
              className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-50 text-slate-700 ring-1 ring-gray-100"
              aria-hidden
            >
              <BadgeCheck className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">링크드인 연동 증명서</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              <li>
                프로젝트 <strong className="font-semibold text-slate-800">완료(Completed)</strong> 시
                참여자에게 Side-Sync <strong className="font-semibold text-slate-800">활동 확인서</strong>
                가 발급될 수 있습니다.
              </li>
              <li>
                링크드인 <strong className="font-semibold text-slate-800">자격 증명</strong> 항목에
                바로 추가할 수 있는 링크를 제공합니다.
              </li>
              <li>
                <strong className="font-semibold text-slate-800">공개 검증 코드</strong>로 제3자도 발급
                사실을 확인할 수 있습니다.
              </li>
            </ul>
            <details className="group mt-4 border-t border-gray-100 pt-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-blue-600 outline-none marker:content-none [&::-webkit-details-marker]:hidden hover:underline">
                자세히 보기
              </summary>
              <div className="prose prose-slate mt-3 max-w-none text-sm text-slate-700 prose-p:leading-relaxed prose-strong:text-slate-800 prose-a:text-blue-600">
                <p>
                  프로젝트가 플랫폼 기준에 따라 <strong>완료(Completed)</strong> 처리되면, 참여자에게
                  Side-Sync <strong>활동 확인서(증명서)</strong>가 발급될 수 있습니다. 확인서에는
                  프로젝트명, 참여 기간, 역할, 발급 번호 등이 포함되며, 링크드인 프로필의
                  &quot;라이선스 및 자격증&quot; 항목에 바로 추가할 수 있는 링크를 제공합니다.
                </p>
                <p>
                  공개 검증 코드를 통해 제3자도 발급 사실을 확인할 수 있어, 채용 담당자나 협업 상대에게
                  실무 경험을 설명할 때 객관적인 근거로 활용하기 좋습니다. 확인서는 Side-Sync 내 활동
                  기록을 바탕으로 하며 법적 효력을 주장하지 않는 안내 문구를 함께 표시합니다. 서비스
                  운영 정책과 공지는 <Link href="/announcements">공지사항</Link>에서 확인할 수 있습니다.
                </p>
              </div>
            </details>
            <p className="mt-3">
              <Link
                href="/announcements"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                공지사항에서 정책 확인 →
              </Link>
            </p>
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
