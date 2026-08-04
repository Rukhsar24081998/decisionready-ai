/** Landing tokens — premium SaaS visual system (8px rhythm). */
export const landing = {
  bg: "#FAFCFA",
  card: "#FFFFFF",
  tint: "#F3F6F4",
  mint: "#E8F5EF",
  emerald: "#064E3B",
  emeraldMid: "#0B6E4F",
  emeraldBright: "#10B981",
  text: "#0F172A",
  body: "#475569",
  muted: "#64748B",
  soft: "#94A3B8",
  border: "#E7ECEF",
} as const;

export const LANDING_TINT = landing.tint;

/** Shared page container — 1440px, aligned across every section. */
export const landingContainer =
  "mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10";

export const landingSerif =
  "font-[family-name:var(--font-landing-serif)] font-semibold tracking-[-0.02em] text-[#0F172A]";

export const landingIconWell =
  "flex size-11 items-center justify-center rounded-full bg-[#E8F5EF]";

export const landingBtnPrimary =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#064E3B] px-5 text-[13px] font-medium text-white shadow-[0_2px_8px_rgba(6,78,59,0.2)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#053528] hover:shadow-[0_6px_16px_rgba(6,78,59,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30 focus-visible:ring-offset-2";

export const landingBtnPrimaryLg =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#064E3B] px-6 text-[15px] font-medium text-white shadow-[0_2px_10px_rgba(6,78,59,0.2)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#053528] hover:shadow-[0_8px_20px_rgba(6,78,59,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30 focus-visible:ring-offset-2";

export const landingBtnPrimaryXl =
  "inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#064E3B] px-7 text-[15px] font-medium text-white shadow-[0_2px_10px_rgba(6,78,59,0.2)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#053528] hover:shadow-[0_8px_22px_rgba(6,78,59,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30 focus-visible:ring-offset-2";

export const landingCard =
  "rounded-2xl border border-[#E7ECEF] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition-all duration-[250ms] ease-out";

export const landingCardHover =
  "hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.09)]";
