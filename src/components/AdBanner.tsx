"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** 구글 애드센스 기본 클라이언트 ID (layout `<head>` 스크립트와 동일) */
export const DEFAULT_ADSENSE_CLIENT_ID = "ca-pub-2237287742271246";

export type AdBannerProps = {
  /** 광고 단위(슬롯) ID */
  adSlotId: string;
  /** 퍼블리셔 클라이언트 ID (기본: DEFAULT_ADSENSE_CLIENT_ID) */
  adClientId?: string;
  className?: string;
  adFormat?: "auto" | "fluid" | "horizontal" | "rectangle" | "vertical";
  fullWidthResponsive?: boolean;
};

let adsenseScriptPromise: Promise<void> | null = null;

/**
 * `<script async src="...adsbygoogle.js?client=...">` 와 동일.
 * layout에 이미 있으면 재삽입하지 않음.
 */
function ensureAdsenseScript(clientId: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  if (adsenseScriptPromise) return adsenseScriptPromise;

  adsenseScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    );
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load AdSense script"));
    document.head.appendChild(script);
  });

  return adsenseScriptPromise;
}

function useShowAdPlaceholder(): boolean {
  const [show, setShow] = useState(() => process.env.NODE_ENV === "development");

  useLayoutEffect(() => {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1") {
      setShow(true);
    }
  }, []);

  return show;
}

/**
 * 구글 애드센스 배너. 프로덕션에서만 실제 광고를 로드하고,
 * localhost / 개발 빌드에서는 `광고 영역` 자리 표시자를 표시합니다.
 */
export default function AdBanner({
  adSlotId,
  adClientId = DEFAULT_ADSENSE_CLIENT_ID,
  className = "",
  adFormat = "auto",
  fullWidthResponsive = true,
}: AdBannerProps) {
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);
  const reactId = useId();
  const showPlaceholder = useShowAdPlaceholder();

  const clientOk = adClientId.trim().length > 0;
  const slotOk = adSlotId.trim().length > 0;

  useEffect(() => {
    if (showPlaceholder || !clientOk || !slotOk || !insRef.current || pushedRef.current) {
      return;
    }

    let cancelled = false;

    void ensureAdsenseScript(adClientId)
      .then(() => {
        if (cancelled || !insRef.current || pushedRef.current) return;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushedRef.current = true;
        } catch {
          /* 애드블록 등 */
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [adClientId, adSlotId, clientOk, slotOk, showPlaceholder]);

  if (!slotOk || !clientOk) {
    return null;
  }

  if (showPlaceholder) {
    return (
      <div
        className={`flex min-h-[90px] w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100 text-sm font-medium text-slate-500 ${className}`.trim()}
        data-ad-placeholder
      >
        광고 영역
      </div>
    );
  }

  return (
    <div
      className={`ad-banner adsense-slot overflow-hidden ${className}`.trim()}
      data-ad-banner-instance={reactId}
    >
      <ins
        ref={insRef}
        className="adsbygoogle block min-h-[90px] w-full"
        style={{ display: "block" }}
        data-ad-client={adClientId}
        data-ad-slot={adSlotId}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
