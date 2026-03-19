"use client";

import BottomNav from "./BottomNav";

/**
 * 모바일에서 바텀 네비 높이만큼 하단 여백을 주어 콘텐츠가 가려지지 않게 함.
 * md 이상에서는 바텀 네비가 숨겨지므로 여백 제거.
 */
export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="pb-16 md:pb-0">{children}</div>
      <BottomNav />
    </>
  );
}
