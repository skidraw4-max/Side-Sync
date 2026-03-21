"use client";

import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export type AdsProps = {
  /** Google AdSense 퍼블리셔 ID (`ca-pub-xxxxxxxxxxxxxxxx`) */
  adClientId: string;
  /** 광고 단위(슬롯) ID — 애드센스 대시보드의 광고 단위 ID */
  adSlotId: string;
  /** 래퍼 / ins 추가 클래스 */
  className?: string;
  /** `data-ad-format` (기본 auto) */
  adFormat?: "auto" | "fluid" | "horizontal" | "rectangle" | "vertical";
  /** `data-full-width-responsive` */
  fullWidthResponsive?: boolean;
  /** 클라이언트 ID·슬롯이 비어 있을 때 아무것도 렌더하지 않음 (기본 true) */
  hideWhenIncomplete?: boolean;
};

let adsenseScriptPromise: Promise<void> | null = null;

function ensureAdsenseScript(adClientId: string): Promise<void> {
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
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adClientId)}`;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load AdSense script"));
    document.head.appendChild(script);
  });

  return adsenseScriptPromise;
}

/**
 * Google AdSense 표시용 블록.
 * 동일 페이지에 여러 개 두면 슬롯 ID만 다르게 넘기면 됩니다 (스크립트는 한 번만 로드).
 */
export default function Ads({
  adClientId,
  adSlotId,
  className = "",
  adFormat = "auto",
  fullWidthResponsive = true,
  hideWhenIncomplete = true,
}: AdsProps) {
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);
  const reactId = useId();

  const clientOk = adClientId.trim().length > 0;
  const slotOk = adSlotId.trim().length > 0;

  useEffect(() => {
    if (!clientOk || !slotOk || !insRef.current || pushedRef.current) return;

    let cancelled = false;

    void ensureAdsenseScript(adClientId)
      .then(() => {
        if (cancelled || !insRef.current || pushedRef.current) return;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushedRef.current = true;
        } catch {
          /* 광고 로드 실패 시 무시 (애드블록 등) */
        }
      })
      .catch(() => {
        /* 스크립트 로드 실패 무시 */
      });

    return () => {
      cancelled = true;
    };
  }, [adClientId, adSlotId, clientOk, slotOk]);

  if (hideWhenIncomplete && (!clientOk || !slotOk)) {
    return null;
  }

  return (
    <div
      className={`adsense-slot overflow-hidden ${className}`.trim()}
      data-adsense-instance={reactId}
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
