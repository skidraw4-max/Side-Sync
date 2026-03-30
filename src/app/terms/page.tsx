import type { Metadata } from "next";
import LegalDocLayout from "@/components/legal/LegalDocLayout";
import LegalSectionCard from "@/components/legal/LegalSectionCard";
import {
  AlertTriangle,
  FileText,
  Layers,
  Scale,
  Shield,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "이용약관",
  description:
    "Side-Sync 이용약관: 서비스 내용, 회원 의무, 게시물·저작권, 면책, 팀 빌딩·워크스페이스 이용에 관한 기본 규정을 정합니다.",
};

const LAST_UPDATED = "2026.03.20";

const toc = [
  { id: "doc-intro", label: "개요" },
  { id: "terms-a1", label: "제1조 (목적)" },
  { id: "terms-a2", label: "제2조 (서비스의 내용)" },
  { id: "terms-a3", label: "제3조 (회원의 의무)" },
  { id: "terms-a4", label: "제4조 (게시물의 저작권)" },
  { id: "terms-a5", label: "제5조 (책임 제한)" },
];

export default function TermsPage() {
  return (
    <LegalDocLayout
      title="이용약관"
      titleEn="Terms of Service"
      lastUpdated={LAST_UPDATED}
      active="terms"
      toc={toc}
      intro={
        <>
          <p>
            본 문서는 <strong>Side-Sync</strong>가 제공하는 사이드 프로젝트 매칭 및 협업 툴 서비스의 이용 규칙과
            회사·회원 간 권리·의무를 안내합니다.
          </p>
        </>
      }
    >
      <LegalSectionCard id="terms-a1" title="제1조 (목적)" icon={FileText}>
        <p>
          본 약관은 <strong>Side-Sync</strong>가 제공하는 사이드 프로젝트 매칭 및 협업 툴 서비스의 이용 조건 및 절차에
          관한 사항을 규정함을 목적으로 합니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard id="terms-a2" title="제2조 (서비스의 내용)" icon={Layers}>
        <p>회사는 회원에게 다음과 같은 기능을 제공합니다.</p>
        <ul>
          <li>프로젝트 생성 및 팀원 모집</li>
          <li>실시간 채팅</li>
          <li>칸반보드 등 업무 관리</li>
          <li>기타 회사가 정하는 부가 서비스</li>
        </ul>
      </LegalSectionCard>

      <LegalSectionCard id="terms-a3" title="제3조 (회원의 의무)" icon={Shield}>
        <p>
          회원은 타인의 정보를 도용하거나, 서비스의 정상적인 운영을 방해하는 행위를 해서는 안 됩니다. 관련 법령 및
          본 약관을 준수하여야 합니다.
        </p>
      </LegalSectionCard>

      <LegalSectionCard id="terms-a4" title="제4조 (게시물의 저작권)" icon={Sparkles}>
        <p>
          회원이 서비스 내에 게시한 콘텐츠(프로젝트 설명, 채팅 등)의 저작권은 해당 회원에게 귀속됩니다. 다만, 회사는
          서비스 홍보 목적으로 이를 활용할 수 있습니다.
        </p>
        <blockquote className="not-prose border-l-4 border-[#2563EB] bg-blue-50/60 py-3 pl-4 text-slate-700">
          <p className="text-sm leading-relaxed">
            <strong className="text-[#2563EB]">Side-Sync</strong>는 회원이 서비스에 제공한 콘텐츠에 대한 소유권을
            주장하지 않습니다.
          </p>
        </blockquote>
      </LegalSectionCard>

      <LegalSectionCard id="terms-a5" title="제5조 (책임 제한)" icon={AlertTriangle}>
        <p>
          회사는 회원 간의 분쟁(업무 불이행, 중도 하차 등)에 대하여 어떠한 법적 책임도 지지 않으며, 서비스 내에서
          발생하는 결과는 <strong>회원 본인의 책임</strong>입니다.
        </p>
      </LegalSectionCard>

      <section className="scroll-mt-28">
        <div className="rounded-2xl bg-[#2563EB] px-8 py-10 text-center shadow-sm">
          <Scale className="mx-auto mb-3 h-10 w-10 text-white/90" aria-hidden />
          <p className="text-lg font-semibold text-white">약관에 대해 더 궁금한 점이 있으신가요?</p>
          <p className="mt-2 text-sm text-blue-100">문의는 이메일 또는 홈을 통해 남겨 주세요.</p>
        </div>
      </section>
    </LegalDocLayout>
  );
}
