import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** clsx + tailwind-merge: 조건부 클래스 병합 시 충돌 제거 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
