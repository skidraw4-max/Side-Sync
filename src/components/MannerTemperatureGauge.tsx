"use client";

interface MannerTemperatureGaugeProps {
  value: string;
  percent?: number;
  positiveRate?: string;
}

export default function MannerTemperatureGauge({
  value,
  percent = 36.5,
  positiveRate = "98%",
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
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
        Manner Temperature
      </p>

      <div className="relative h-[140px] w-[200px]">
        <svg
          viewBox="0 0 200 140"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          {/* Background track */}
          <path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
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
          <span className="text-xs font-medium text-gray-400">Cold</span>
          <span className="text-xs font-medium text-gray-400">Warm</span>
        </div>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <span className="text-3xl font-bold text-[#2563EB]">{value}°C</span>
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-gray-600">
        Highly recommended collaborator with{" "}
        <span className="font-semibold text-[#1d4ed8]">{positiveRate} positive</span> feedback.
      </p>
    </div>
  );
}
