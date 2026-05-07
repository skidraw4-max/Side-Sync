"use client";

import Image from "next/image";
import Link from "next/link";

const LOGO_SRC = "/logo-side-sync.png";
/** 랜딩 헤더 `image-2` 로고 파일 */
const HEADER_LOGO_SRC = "/images/image-2.png";
/** `image-2` 헤더 로고 실제 픽셀 (layout shift 방지) */
const HEADER_LOGO_INTRINSIC = { w: 1024, h: 1024 } as const;
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

interface HeaderBrandWordmarkProps {
  className?: string;
  /** 로고 이미지 Tailwind 클래스 (기본: 헤더 높이에 맞춤) */
  logoClassName?: string;
}

/**
 * 랜딩 헤더용: `image-2.png` 마크 + Side-Sync.io 워드마크
 */
export function HeaderBrandWordmark({ className = "", logoClassName = "" }: HeaderBrandWordmarkProps) {
  const logoCn =
    `h-10 w-auto shrink-0 rounded-2xl object-contain shadow-sm ring-1 ring-slate-200/80 md:h-11 ${logoClassName}`.trim();
  return (
    <Link href="/" className={`flex shrink-0 items-center gap-2.5 ${className}`.trim()}>
      <Image
        src={HEADER_LOGO_SRC}
        alt="Side-Sync.io"
        width={HEADER_LOGO_INTRINSIC.w}
        height={HEADER_LOGO_INTRINSIC.h}
        className={logoCn}
        priority
      />
      <span className="text-lg font-semibold tracking-tight text-slate-900 md:text-[1.05rem]">
        Side-Sync.io
      </span>
    </Link>
  );
}
