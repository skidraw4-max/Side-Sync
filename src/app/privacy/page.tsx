import type { Metadata } from "next";
import LegalDocLayout from "@/components/legal/LegalDocLayout";
import LegalSectionCard from "@/components/legal/LegalSectionCard";
import {
  ClipboardList,
  Clock,
  Cookie,
  Database,
  Mail,
  Server,
  Shield,
  UserCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | Side-Sync",
  description: "Side-Sync 개인정보 처리방침 (Privacy Policy)",
};

const LAST_UPDATED = "2026.03.25";

const toc = [
  { id: "doc-intro", label: "개요" },
  { id: "privacy-1", label: "1. 수집하는 개인정보" },
  { id: "privacy-2", label: "2. 수집 및 이용 목적" },
  { id: "privacy-3", label: "3. 보유 및 이용 기간" },
  { id: "privacy-4", label: "4. 제3자 제공·위탁" },
  { id: "privacy-adsense", label: "5. Google AdSense 광고·쿠키" },
  { id: "privacy-5", label: "6. 보호책임자" },
  { id: "privacy-appendix", label: "부록: 가입 시 동의" },
];

export default function PrivacyPage() {
  return (
    <LegalDocLayout
      title="개인정보 처리방침"
      titleEn="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      active="privacy"
      toc={toc}
      intro={
        <>
          <p>
            <strong>Side-Sync</strong>는 이용자의 개인정보를 소중히 다루며, 관련 법령에 따라 수집·이용·보관·파기합니다.
          </p>
        </>
      }
    >
      <LegalSectionCard id="privacy-1" title="1. 수집하는 개인정보 항목" icon={Database}>
        <p>
          <strong>필수항목:</strong> 구글 계정 정보(이메일, 프로필 이름, 프로필 사진), 기술 스택, 자기소개.
        </p>
      </LegalSectionCard>

      <LegalSectionCard id="privacy-2" title="2. 개인정보의 수집 및 이용 목적" icon={Shield}>
        <ul>
          <li>회원 식별 및 서비스 이용 의사 확인</li>
          <li>프로젝트 매칭 및 팀원 간 소통 지원</li>
          <li>서비스 개선 및 사용자 맞춤형 콘텐츠 제공</li>
        </ul>
        <div className="not-prose mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">서비스 제공</p>
            <p className="mt-2 text-sm text-slate-700">매칭·협업 기능 운영 및 계정 관리</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">맞춤 경험</p>
            <p className="mt-2 text-sm text-slate-700">프로필·기술 스택 기반 추천 및 개선</p>
          </div>
        </div>
      </LegalSectionCard>

      <LegalSectionCard id="privacy-3" title="3. 개인정보의 보유 및 이용 기간" icon={Clock}>
        <p>
          회원 탈퇴 시까지 보유하며, 탈퇴 시 지체 없이 파기합니다. 단, 관계 법령에 따라 보존할 필요가 있는 경우 해당
          기간까지 보관합니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard id="privacy-4" title="4. 개인정보의 제3자 제공" icon={Server}>
        <p>
          회사는 사용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 다만, 서비스 운영을 위해 다음의 인프라를
          활용합니다.
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> — 데이터 저장
          </li>
          <li>
            <strong>Vercel</strong> — 호스팅
          </li>
        </ul>
      </LegalSectionCard>

      <LegalSectionCard
        id="privacy-adsense"
        title="5. Google AdSense 광고 쿠키 수집 안내"
        icon={Cookie}
      >
        <p>
          본 서비스는 <strong>Google AdSense</strong>를 통해 광고를 게재할 수 있습니다. Google을 포함한 제3자 광고
          게재 사업자는 이용자가 본 사이트 및 다른 웹사이트에 방문할 때 <strong>쿠키</strong> 등을 사용하여 광고를
          게재하거나, 이전 방문 정보를 바탕으로 맞춤형 광고를 제공할 수 있습니다.
        </p>
        <p className="mt-4">
          개인 맞춤 광고에 사용되는 쿠키에 대한 자세한 설명은 Google의 광고 정책 및 개인정보 관련 안내를 참고하시기
          바랍니다. 이용자는{" "}
          <a
            href="https://www.google.com/settings/ads"
            className="font-medium text-[#2563EB] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google 광고 설정
          </a>
          에서 맞춤형 광고를 끄거나,{" "}
          <a
            href="https://www.aboutads.info/choices/"
            className="font-medium text-[#2563EB] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            aboutads.info
          </a>
          에서 제3자 광고주의 맞춤형 광고 옵트아웃을 설정할 수 있습니다.
        </p>
        <p className="mt-4">
          Google이 개인정보를 처리하는 방식에 대해서는{" "}
          <a
            href="https://policies.google.com/privacy"
            className="font-medium text-[#2563EB] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google 개인정보처리방침
          </a>
          을 참고해 주시기 바랍니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard id="privacy-5" title="6. 개인정보 보호책임자" icon={UserCircle}>
        <p>
          성명: <strong>함종두</strong> / 이메일:{" "}
          <a href="mailto:skidraw4@gmail.com">skidraw4@gmail.com</a>
        </p>
        <div className="not-prose mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" aria-hidden />
          <p className="text-sm text-slate-700">
            개인정보 관련 문의는 위 이메일로 연락 주시면 신속히 답변드리겠습니다.
          </p>
        </div>
      </LegalSectionCard>

      <LegalSectionCard id="privacy-appendix" title="부록: 개인정보 수집 및 이용 동의 (가입 시)" icon={ClipboardList}>
        <p>아래 내용은 회원가입 시 체크박스로 동의받는 내용의 예시입니다.</p>
        <div className="not-prose rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-800">
          <p className="font-semibold text-slate-900">[필수] 개인정보 수집 및 이용 동의</p>
          <ul className="mt-3 list-inside list-disc space-y-1">
            <li>수집항목: 이메일, 이름, 프로필 이미지</li>
            <li>수집목적: 회원 식별 및 서비스 제공</li>
            <li>보유기간: 회원 탈퇴 시까지</li>
          </ul>
          <p className="mt-3">
            귀하는 동의를 거부할 권리가 있으나, 거부 시 서비스 이용이 제한될 수 있습니다.
          </p>
        </div>
      </LegalSectionCard>

      <section className="scroll-mt-28">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">
            개인정보 처리방침에 관한 문의:{" "}
            <a href="mailto:skidraw4@gmail.com" className="font-medium text-[#2563EB] hover:underline">
              skidraw4@gmail.com
            </a>
          </p>
        </div>
      </section>
    </LegalDocLayout>
  );
}
