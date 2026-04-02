/**
 * Google OAuth는 embedded WebView(인앱 브라우저)에서 403 disallowed_useragent 로 차단됩니다.
 * @see https://developers.googleblog.com/2016/08/modifying-oauth-access-policy-for-embedded-browsers.html
 */
export function isLikelyInAppBrowserBlockingGoogleOAuth(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (!ua) return false;

  const knownInApp =
    /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Line\/|KAKAOTALK|DaumApps|DaumDevice|Twitter|Snapchat|Slack|MicroMessenger|QQ\//i;
  if (knownInApp.test(ua)) return true;

  // Android System WebView (일반 Chrome 모바일 UA에는 보통 없음)
  if (/; wv\)/.test(ua)) return true;

  return false;
}
