/**
 * profiles.manner_temp / manner_temp_target 파싱.
 * PostgREST·드라이버에 따라 numeric이 JSON에서 string으로 올 수 있어
 * `Number.isFinite(값)`만으로는 DB 숫자를 놓칠 수 있음.
 */
export function coerceMannerTempFromDb(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = parseFloat(raw.replace(/[°C\s]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function resolveMannerTempForProfile(
  manner_temp: unknown,
  manner_temp_target: string | null | undefined
): { mannerTempValue: number; mannerTempString: string } {
  const fromCol = coerceMannerTempFromDb(manner_temp);
  if (fromCol != null) {
    return { mannerTempValue: fromCol, mannerTempString: fromCol.toFixed(1) };
  }
  const targetStr = String(manner_temp_target ?? "36.5");
  const fromTarget = parseFloat(targetStr.replace(/[°C\s]/g, "").split(/[^\d.-]/)[0] ?? "36.5");
  const v = Number.isFinite(fromTarget) ? fromTarget : 36.5;
  return { mannerTempValue: v, mannerTempString: v.toFixed(1) };
}
