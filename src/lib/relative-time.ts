import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export function formatRelativeTime(dateInput: string | Date): string {
  return formatDistanceToNow(new Date(dateInput), {
    addSuffix: true,
    locale: ko,
  });
}
