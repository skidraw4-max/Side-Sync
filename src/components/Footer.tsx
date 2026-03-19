const footerLinks = ["Terms", "Privacy", "Contact", "Help Center"];
const stitchFooterLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Help Center", href: "#" },
];

interface FooterProps {
  variant?: "default" | "compact" | "stitch";
}

export default function Footer({ variant = "default" }: FooterProps) {
  if (variant === "stitch") {
    return (
      <footer className="mt-24 border-t border-gray-100 px-6 py-12 md:px-12 lg:px-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m7 17 5-5-5-5" />
                <path d="m17 7-5 5 5 5" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-gray-800">Side-Sync</span>
          </div>
          <nav className="flex gap-6">
            {stitchFooterLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
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
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m7 17 5-5-5-5" />
              <path d="m17 7-5 5 5 5" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-gray-800">Side-Sync</span>
        </div>
        <nav className="flex gap-6">
          {footerLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {link}
            </a>
          ))}
        </nav>
      </div>
      <p className="mt-6 text-center text-sm text-gray-500">
        © 2024 Side-Sync Platform. All rights reserved.
      </p>
    </footer>
  );
}
