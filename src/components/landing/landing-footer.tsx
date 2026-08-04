import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { landingContainer } from "@/components/landing/landing-tokens";
import { cn } from "@/lib/utils";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Decision Dashboard", href: "/dashboard" },
      { label: "Start Analysis", href: "/analyses/new" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Features", href: "#capabilities" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Decision Intelligence", href: "#capabilities" },
      { label: "Evidence Workflow", href: "#how-it-works" },
      { label: "Why DecisionReady", href: "#why" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Product Principles", href: "#why" },
      { label: "Why DecisionReady", href: "#why" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "hello@decisionready.ai", href: "mailto:hello@decisionready.ai" },
      { label: "Support", href: "mailto:hello@decisionready.ai" },
    ],
  },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-[#E7ECEF] bg-white">
      <div className={cn(landingContainer, "py-12 lg:py-14")}>
        <div className="grid gap-10 lg:grid-cols-[1fr_2.2fr] lg:gap-16">
          <div>
            <Logo iconClassName="size-7" textClassName="text-[17px]" />
            <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-[#475569]">
              AI Decision Intelligence Platform for modern hiring—evidence
              readiness, not hire or reject.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="text-[12px] font-semibold tracking-[0.06em] text-[#0F172A] uppercase">
                  {column.title}
                </p>
                <ul className="mt-3 list-none space-y-2 p-0">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[14px] text-[#64748B] transition-colors duration-200 ease-out hover:text-[#064E3B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30 focus-visible:ring-offset-2"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-[#E7ECEF] pt-5">
          <p className="text-[13px] text-[#64748B]">
            © {new Date().getFullYear()} DecisionReady AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
