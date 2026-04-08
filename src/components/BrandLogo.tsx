"use client";

import Image from "next/image";
import Link from "next/link";

const LOGO_SRC = "/logo-side-sync.png";
/** 실제 `public/logo-side-sync.png` 픽셀 크기 (layout shift 방지) */
const LOGO_INTRINSIC = { w: 1024, h: 1024 } as const;

function LogoImage({
  heightPx,
  className = "",
  priority = false,
}: {
  heightPx: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Side-Sync"
      width={LOGO_INTRINSIC.w}
      height={LOGO_INTRINSIC.h}
      priority={priority}
      className={`w-auto object-contain ${className}`.trim()}
      style={{ height: heightPx }}
    />
  );
}

export interface BrandLogoMarkProps {
  /** 표시 높이(px), 너비는 비율에 맞게 자동 */
  size?: number;
  className?: string;
  priority?: boolean;
}

/** 로고 이미지 (아이콘·푸터 등, 단독 사용) */
export function BrandLogoMark({ size = 36, className = "", priority = false }: BrandLogoMarkProps) {
  return (
    <LogoImage
      heightPx={size}
      className={`rounded-xl ${className}`.trim()}
      priority={priority}
    />
  );
}

interface BrandLogoWordmarkProps {
  /** 로고 전체 높이(px) */
  size?: number;
  /** @deprecated 워드마크는 PNG에 포함되어 더 이상 사용되지 않습니다. */
  textClassName?: string;
  className?: string;
}

/** 홈 링크 + 통합 로고 이미지 */
export function BrandLogoWordmark({
  size = 40,
  textClassName: _textClassName,
  className = "",
}: BrandLogoWordmarkProps) {
  return (
    <Link href="/" className={`flex shrink-0 items-center ${className}`.trim()}>
      <LogoImage heightPx={size} priority />
    </Link>
  );
}
