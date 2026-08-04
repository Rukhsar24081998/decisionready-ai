import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import {
  landingBtnPrimary,
  landingContainer,
} from "@/components/landing/landing-tokens";
import { cn } from "@/lib/utils";

const centerLinks = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Features", href: "/#capabilities" },
  { label: "Dashboard", href: "/dashboard" },
] as const;

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E7ECEF]/80 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
      <div
        className={cn(
          landingContainer,
          "relative flex h-[68px] items-center justify-between"
        )}
      >
        <Link
          href="/"
          className="relative z-10 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30 focus-visible:ring-offset-2"
          aria-label="DecisionReady AI home"
        >
          <Logo />
        </Link>

        <nav
          className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 lg:flex"
          aria-label="Primary"
        >
          {centerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[14px] font-medium text-[#475569] transition-colors duration-200 ease-out hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30 focus-visible:ring-offset-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/analyses/new"
          className={cn(landingBtnPrimary, "relative z-10")}
          aria-label="Start Analysis"
        >
          Start Analysis
        </Link>
      </div>
    </header>
  );
}
