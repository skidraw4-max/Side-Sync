import {
  AISLES_LOUNGE_LIST_URL,
  fetchAislesLoungeNews,
} from "@/lib/aisles-news";

/**
 * 벤토: AIsle Hub LOUNGE 최신 기사 (외부 HTML 파싱, 5분 캐시)
 */
export default async function BentoAislesNews() {
  const items = await fetchAislesLoungeNews(5);

  return (
    <article
      className="flex h-full flex-col rounded-xl bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.12)] ring-1 ring-slate-200/90"
      aria-labelledby="bento-aisles-news-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 gap-y-1">
        <h2
          id="bento-aisles-news-heading"
          className="text-lg font-bold text-slate-900 md:text-xl"
        >
          AIsle News
        </h2>
        <a
          href={AISLES_LOUNGE_LIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-sm font-medium text-[#2563EB] hover:underline"
        >
          더보기
        </a>
      </div>
      <p className="mt-1 text-xs text-slate-500">AI TREND · AIsle Hub</p>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          뉴스를 불러오지 못했습니다. 잠시 후 다시 시도하거나 위 링크에서 직접 확인해 주세요.
        </p>
      ) : (
        <ul className="mt-4 flex flex-1 flex-col gap-0 divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.url} className="min-w-0 py-3 first:pt-0 last:pb-0">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block min-w-0 rounded-lg outline-none ring-[#2563EB]/40 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <span className="block truncate text-sm font-semibold leading-snug text-slate-900 group-hover:text-[#2563EB]">
                  {item.title}
                </span>
                {item.meta ? (
                  <span className="mt-1 block truncate text-xs text-slate-400">{item.meta}</span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
