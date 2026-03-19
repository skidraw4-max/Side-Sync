import Link from "next/link";

interface WorkspaceHeaderProps {
  activeNav?: "dashboard" | "notices" | "tasks";
}

export default function WorkspaceHeader({ activeNav = "notices" }: WorkspaceHeaderProps) {
  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", href: "#" },
    { id: "notices" as const, label: "Notices", href: "/workspace/notices/new" },
    { id: "tasks" as const, label: "Tasks", href: "#" },
  ];

  return (
    <header className="flex items-center justify-between border-b border-gray-100 bg-white px-8 py-4">
      <Link href="/workspace/files" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path d="m7 17 5-5-5-5" />
            <path d="m17 7-5 5 5 5" />
          </svg>
        </div>
        <span className="text-xl font-semibold text-gray-800">Side-Sync Workspace</span>
      </Link>
      <nav className="flex items-center gap-8">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                isActive
                  ? "text-[#2563EB] border-b-2 border-[#2563EB] pb-0.5"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <div className="h-8 w-8 rounded-full bg-gray-200" />
      </nav>
    </header>
  );
}
