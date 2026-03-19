import Link from "next/link";

export default function CreateProjectFloatingButton() {
  return (
    <Link
      href="/projects/create"
      className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg transition-all hover:bg-[#1d4ed8] hover:shadow-xl"
      aria-label="프로젝트 만들기"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
    </Link>
  );
}
