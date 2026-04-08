"use client";

import Image from "next/image";
import Link from "next/link";

const LOGO_SRC = "/logo-side-sync.png";
/** 실제 `public/logo-side-sync.png` 픽셀 크기 (layout shift 방지) */
const LOGO_INTRINSIC = { w: 1024, h: 1024 } as const;

export interface BrandLogoMarkProps {
  /** 정사각형 한 변 길이(px) — 수정 전 로고와 동일 */
  size?: number;
  className?: string;
  priority?: boolean;
}

/** 로고 심볼만 (PNG, 스쿼어) */
export function BrandLogoMark({ size = 36, className = "", priority = false }: BrandLogoMarkProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Side-Sync 협업 플랫폼 로고"
      width={LOGO_INTRINSIC.w}
      height={LOGO_INTRINSIC.h}
      className={`rounded-2xl object-contain ${className}`.trim()}
      style={{ width: size, height: size }}
      priority={priority}
    />
  );
}

interface BrandLogoWordmarkProps {
  size?: number;
  textClassName?: string;
  className?: string;
}

/** 로고 마크 + 우측 Side-Sync 텍스트 (홈 링크) */
export function BrandLogoWordmark({
  size = 86,
  textClassName = "text-lg font-semibold tracking-tight text-slate-900 md:text-xl",
  className = "",
}: BrandLogoWordmarkProps) {
  return (
    <Link href="/" className={`flex shrink-0 items-center gap-[2.5px] ${className}`.trim()}>
      <BrandLogoMark size={size} priority />
      <span className={textClassName}>Side-Sync</span>
    </Link>
  );
}
