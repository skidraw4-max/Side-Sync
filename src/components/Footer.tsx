import { BrandLogoMark } from "@/components/BrandLogo";

const CONTACT_EMAIL = "contact@sidesync.io";
const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

const footerLinks = [
  { label: "이용약관", href: "/terms" },
  { label: "개인정보처리방침", href: "/privacy" },
  { label: CONTACT_EMAIL, href: CONTACT_MAILTO },
];
const stitchFooterLinks = [...footerLinks];

interface FooterProps {
  variant?: "default" | "compact" | "stitch";
}

export default function Footer({ variant = "default" }: FooterProps) {
  if (variant === "stitch") {
    return (
      <footer className="mt-24 border-t border-gray-100 px-6 py-12 md:px-12 lg:px-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-2">
            <BrandLogoMark size={32} />
            <span className="text-xl font-semibold text-gray-800">Side-Sync</span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 md:justify-end">
            {stitchFooterLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-gray-600 md:mx-auto md:text-center">
          Side-Sync는 사이드 프로젝트 팀 빌딩을 돕기 위해 기획자가 독학으로 운영하는 1인 개발 서비스입니다.
        </p>
        <p className="mt-4 text-center text-sm text-gray-500">
          © 2024 Side-Sync Platform. All rights reserved.
        </p>
      </footer>
    );
  }

  if (variant === "compact") {
    return (
      <footer className="mt-auto py-8 text-center">
        <p className="text-sm text-gray-400">© 2024 Side-Sync. All rights reserved.</p>
      </footer>
    );
  }

  return (
    <footer className="mt-24 border-t border-gray-100 px-6 py-12 md:px-12 lg:px-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-2">
          <BrandLogoMark size={32} />
          <span className="text-xl font-semibold text-gray-800">Side-Sync</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 md:justify-end">
          {footerLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-gray-600 md:mx-auto md:text-center">
        Side-Sync는 사이드 프로젝트 팀 빌딩을 돕기 위해 기획자가 독학으로 운영하는 1인 개발 서비스입니다.
      </p>
      <p className="mt-4 text-center text-sm text-gray-500">
        © 2024 Side-Sync Platform. All rights reserved.
      </p>
    </footer>
  );
}
