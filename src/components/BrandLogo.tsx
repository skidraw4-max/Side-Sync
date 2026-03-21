"use client";

import Image from "next/image";
import Link from "next/link";

const LOGO_SRC = "/logo-side-sync.png";

export interface BrandLogoMarkProps {
  /** 픽셀 크기 (정사각형) */
  size?: number;
  className?: string;
  priority?: boolean;
}

/** 로고 마크만 (PNG, 스쿼클) */
export function BrandLogoMark({ size = 36, className = "", priority = false }: BrandLogoMarkProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Side-Sync 협업 플랫폼 로고"
      width={size}
      height={size}
      className={`rounded-2xl object-cover ${className}`.trim()}
      priority={priority}
    />
  );
}

interface BrandLogoWordmarkProps {
  size?: number;
  /** 텍스트 span 클래스 (헤더·푸터 등 톤 맞춤) */
  textClassName?: string;
  /** Link 래퍼 (패딩·호버 등) */
  className?: string;
}

/** 로고 + Side-Sync 텍스트 (홈 링크) */
export function BrandLogoWordmark({
  size = 36,
  textClassName = "text-lg font-semibold tracking-tight text-slate-900 md:text-xl",
  className = "",
}: BrandLogoWordmarkProps) {
  return (
    <Link
      href="/"
      className={`flex shrink-0 items-center gap-2.5 ${className}`.trim()}
    >
      <BrandLogoMark size={size} priority />
      <span className={textClassName}>Side-Sync</span>
    </Link>
  );
}
