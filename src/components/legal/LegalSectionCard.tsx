import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface LegalSectionCardProps {
  id: string;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}

export default function LegalSectionCard({ id, title, icon: Icon, children }: LegalSectionCardProps) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]"
            aria-hidden
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <h2 className="text-xl font-bold leading-snug text-[#2563EB]">{title}</h2>
        </div>
        <div className="prose prose-blue max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-[#2563EB] prose-a:text-[#2563EB] prose-a:no-underline hover:prose-a:underline">
          {children}
        </div>
      </div>
    </section>
  );
}
