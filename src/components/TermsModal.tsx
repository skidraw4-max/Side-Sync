"use client";

import { useEffect, useState } from "react";

export interface TermsModalProps {
  /** 팝업 표시 여부 */
  isOpen: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 기본 열림 탭: "terms" | "privacy" */
  defaultTab?: "terms" | "privacy";
}

const TERMS_CONTENT = {
  title: "서비스 이용약관 (Terms of Service)",
  sections: [
    {
      label: "목적",
      text: "사이드 프로젝트 팀 빌딩 및 협업 공간 제공.",
    },
    {
      label: "책임 제한",
      text: "팀원 간의 분쟁이나 프로젝트 결과물에 대해 플랫폼은 법적 책임을 지지 않음.",
    },
    {
      label: "매너 온도 제도",
      text: "허위 사실 유포나 비매너 행동 시 서비스 이용이 제한될 수 있음.",
    },
  ],
};

const PRIVACY_CONTENT = {
  title: "개인정보 처리방침 (Privacy Policy)",
  sections: [
    {
      label: "수집 항목",
      text: "이름, 이메일, 기술 스택, 포트폴리오 링크.",
    },
    {
      label: "이용 목적",
      text: "맞춤형 프로젝트 추천 및 팀원 간 신원 확인.",
    },
    {
      label: "보유 기간",
      text: "회원 탈퇴 시 즉시 파기 (단, 부정 이용 방지를 위해 6개월간 보관 가능).",
    },
  ],
};

export default function TermsModal({
  isOpen,
  onClose,
  defaultTab = "terms",
}: TermsModalProps) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(defaultTab);

  useEffect(() => {
    if (isOpen) setActiveTab(defaultTab);
  }, [isOpen, defaultTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = activeTab === "terms" ? TERMS_CONTENT : PRIVACY_CONTENT;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
    >
      {/* 배경 오버레이 */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        aria-label="닫기"
      />

      {/* 모달 카드 */}
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        {/* 탭 */}
        <div className="mb-6 flex gap-2 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("terms")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "terms"
                ? "bg-white text-[#2563EB] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            이용약관
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "privacy"
                ? "bg-white text-[#2563EB] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            개인정보
          </button>
        </div>

        {/* 콘텐츠 영역 */}
        <TermsModalContent content={content} />

        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#2563EB] py-3 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
        >
          확인
        </button>
      </div>
    </div>
  );
}

interface TermsModalContentProps {
  content: {
    title: string;
    sections: { label: string; text: string }[];
  };
}

function TermsModalContent({ content }: TermsModalContentProps) {
  return (
    <div className="max-h-[50vh] overflow-y-auto">
      <h2
        id="terms-modal-title"
        className="mb-4 text-lg font-bold text-gray-900"
      >
        {content.title}
      </h2>
      <ul className="space-y-4">
        {content.sections.map((section) => (
          <li key={section.label}>
            <h3 className="mb-1 text-sm font-semibold text-[#2563EB]">
              {section.label}
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              {section.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
