import Link from "next/link";
import Image from "next/image";

const HEADER_LOGO = "/images/image-2.png";
const HEADER_LOGO_DIM = { w: 1024, h: 1024 } as const;

/**
 * 벤토: Welcome / Profile·Onboarding — 연한 블루 그라데이션, 글래스 CTA
 * (시안 image_5: PROFILE/ONBOARDING, synergy access, BUILD YOUR SYNERGY.)
 */
export default function BentoProfileOnboarding() {
  return (
    <article
      className="flex h-full flex-col rounded-xl bg-gradient-to-br from-[#8eb4e3] via-[#6b9bd9] to-[#4f83c9] p-6 text-white shadow-[0_4px_24px_rgba(15,39,68,0.12)] ring-1 ring-white/20"
      aria-labelledby="bento-profile-heading"
    >
      <h2
        id="bento-profile-heading"
        className="text-xs font-bold uppercase tracking-[0.2em] text-white md:text-sm"
      >
        Profile / Onboarding
      </h2>
      <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-white/95">
        Welcome to Side-Sync, your synergy access!
      </p>
      <Link
        href="/signup"
        className="mt-5 flex min-h-[5.5rem] flex-1 items-center justify-center gap-3 rounded-xl border-2 border-white/90 bg-white/15 px-4 py-5 text-center shadow-[0_4px_20px_rgba(0,0,0,0.12)] backdrop-blur-md transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Image
          src={HEADER_LOGO}
          alt=""
          width={HEADER_LOGO_DIM.w}
          height={HEADER_LOGO_DIM.h}
          className="h-11 w-11 shrink-0 rounded-2xl object-contain shadow-sm ring-2 ring-white/50"
        />
        <span className="text-sm font-bold uppercase tracking-[0.14em] text-white md:text-base">
          BUILD YOUR SYNERGY.
        </span>
      </Link>
    </article>
  );
}
