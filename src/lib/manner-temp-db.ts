/**
 * profiles / projects 의 manner_temp_target 컬럼에 넣는 값.
 * 일부 운영 DB에서 해당 컬럼이 numeric(double precision)로 잡혀 있으면 "37°C" 는 22P02 가 납니다.
 * 숫자 문자열만 저장하고, 표시는 UI에서 formatProfileMannerDisplay 등이 처리합니다.
 */
export function mannerTempTargetForDb(temp: number): string {
  const t = typeof temp === "number" && Number.isFinite(temp) ? temp : 36.5;
  return String(Math.round(t * 10) / 10);
}
