/**
 * Google AdSense — `.env.local`에 설정 후 재사용
 *
 * NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxxxxx
 * NEXT_PUBLIC_ADSENSE_SLOT_HOME_FOOTER=1234567890
 * NEXT_PUBLIC_ADSENSE_SLOT_WORKSPACE_SIDEBAR=0987654321
 */

/** 퍼블리셔 클라이언트 ID (`ca-pub-...`) */
export const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";

/** 위치별 광고 단위(슬롯) ID — 애드센스에서 생성한 숫자 ID */
export const ADSENSE_SLOTS = {
  homeFooter: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_FOOTER ?? "",
  workspaceSidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_WORKSPACE_SIDEBAR ?? "",
} as const;

export function isAdsConfigured(slotId: string): boolean {
  return Boolean(ADSENSE_CLIENT_ID.trim() && slotId.trim());
}
