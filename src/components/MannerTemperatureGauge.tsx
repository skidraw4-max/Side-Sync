"use client";

interface MannerTemperatureGaugeProps {
  value: string;
  percent?: number;
  positiveRate?: string;
  /** 매너 칭호 (예: 든든한 파트너) */
  honorName?: string;
  honorTagline?: string;
  honorEncouragement?: string;
  percentileHint?: string | null;
  /** 상단에서 온도·칭호를 크게 보여 줄 때 게이지만 표시 */
  showArcOnly?: boolean;
}

export default function MannerTemperatureGauge({
  value,
  percent = 36.5,
  positiveRate = "98%",
  honorName,
  honorTagline,
  honorEncouragement,
  percentileHint,
  showArcOnly = false,
}: MannerTemperatureGaugeProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const radius = 80;
  const strokeWidth = 12;
  const center = 100;
  const arcLength = Math.PI * radius;
  const filledLength = (clampedPercent / 100) * arcLength;
  const strokeDashoffset = arcLength - filledLength;

  return (
    <div className="relative flex flex-col items-center">
      {!showArcOnly && honorName ? (
        <div className="mb-3 w-full text-center">
          <p className="text-lg font-bold text-[#2563EB]">{honorName}</p>
          {honorTagline ? (
            <p className="mt-0.5 text-xs font-medium text-slate-500">{honorTagline}</p>
          ) : null}
          {percentileHint ? (
            <p className="mt-2 text-xs font-medium text-blue-700/90">{percentileHint}</p>
          ) : null}
          {honorEncouragement ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{honorEncouragement}</p>
          ) : null}
        </div>
      ) : null}

      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">매너 온도</p>

      <div className="relative h-[140px] w-[200px]">
        <svg viewBox="0 0 200 140" className="h-full w-full">
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          <path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            fill="none"
            stroke="url(#gauge-gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-2">
          <span className="text-xs font-medium text-gray-400">차가움</span>
          <span className="text-xs font-medium text-gray-400">따뜻함</span>
        </div>

        {!showArcOnly ? (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-baseline gap-1">
            <span className="text-3xl font-bold tabular-nums text-[#2563EB]">{value}</span>
            <span className="text-lg font-semibold text-[#2563EB]">°C</span>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-center text-sm text-gray-600">
        팀원 피드백 기준{" "}
        <span className="font-semibold text-[#1d4ed8]">{positiveRate}</span> 긍정 반응으로 집계됩니다.
      </p>
    </div>
  );
}
