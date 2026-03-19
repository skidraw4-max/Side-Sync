"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body className="antialiased font-sans bg-gray-50 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl bg-white p-8 shadow-sm border border-gray-200 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h1>
          <p className="text-gray-600 text-sm mb-6">
            클라이언트에서 예기치 않은 오류가 발생했습니다.
          </p>
          <div className="text-left bg-gray-50 rounded-lg p-4 text-xs text-gray-500 mb-6">
            <p className="font-medium text-gray-700 mb-2">확인해보세요:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Vercel 대시보드에서 환경 변수 설정 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)</li>
              <li>Supabase anon key는 JWT 형식(eyJ로 시작)이어야 합니다</li>
              <li>환경 변수 변경 후 재배포가 필요합니다</li>
            </ul>
          </div>
          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] text-white font-medium hover:bg-[#1d4ed8] transition-colors"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
