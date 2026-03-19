"use client";

import Link from "next/link";

interface EmptyStateProps {
  /** 아이콘/일러스트 배경용 원형 */
  icon?: React.ReactNode;
  /** 제목 */
  title: string;
  /** 부가 설명 */
  description: string;
  /** 버튼들 (primary, secondary). href 또는 onClick 하나 필수 */
  actions?: {
    label: string;
    href?: string;
    onClick?: () => void;
    primary?: boolean;
  }[];
  /** 버튼 없이 텍스트만 (채팅 환영 메시지 등) */
  textOnly?: boolean;
  /** 컴팩트 모드 (드롭다운 등 작은 영역) */
  compact?: boolean;
}

export default function EmptyState({
  icon,
  title,
  description,
  actions = [],
  textOnly = false,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white text-center shadow-sm ${
        compact ? "px-4 py-6" : "px-8 py-16"
      }`}
    >
      {icon && (
        <div
          className={`flex items-center justify-center rounded-full bg-gray-100 text-[#2563EB] ${
            compact ? "mb-3 h-12 w-12" : "mb-6 h-24 w-24"
          }`}
        >
          {icon}
        </div>
      )}
      <h3 className={compact ? "text-base font-bold text-gray-900" : "text-xl font-bold text-gray-900"}>{title}</h3>
      {description && (
        <p className={`max-w-md text-gray-500 ${compact ? "mt-1 text-xs" : "mt-2 text-sm leading-relaxed"}`}>
          {description}
        </p>
      )}
      {!textOnly && actions.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {actions.map((a) => {
            const baseClass = a.primary
              ? "inline-flex items-center justify-center rounded-xl bg-[#2563EB] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
              : "inline-flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50";
            if (a.onClick) {
              return (
                <button
                  key={a.label}
                  type="button"
                  onClick={a.onClick}
                  className={baseClass}
                >
                  {a.label}
                </button>
              );
            }
            return (
              <Link key={a.label} href={a.href ?? "#"} className={baseClass}>
                {a.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
