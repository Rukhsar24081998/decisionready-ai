import Link from "next/link";
import {
  ArrowRight,
  FileCheck2,
  GitCompareArrows,
  LayoutDashboard,
  Scale,
} from "lucide-react";
import { DotGrid } from "@/components/landing/dot-grid";
import { ProductPreview } from "@/components/landing/product-preview";
import { Reveal } from "@/components/landing/reveal";
import {
  landingBtnPrimaryLg,
  landingCard,
  landingCardHover,
  landingContainer,
  landingSerif,
} from "@/components/landing/landing-tokens";
import { cn } from "@/lib/utils";

const highlights = [
  {
    title: "Evidence Coverage",
    description: "See what's covered and what's missing",
    icon: FileCheck2,
  },
  {
    title: "Conflict Detection",
    description: "Surface disagreements across interviewers",
    icon: GitCompareArrows,
  },
  {
    title: "Decision Readiness",
    description: "Know when you're ready to decide",
    icon: Scale,
  },
  {
    title: "AI Decision Brief",
    description: "Get a clear, evidence-backed summary",
    icon: LayoutDashboard,
  },
] as const;

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(22,163,74,0.05),transparent_60%)]"
      />
      <DotGrid className="opacity-[0.35] [mask-image:linear-gradient(to_bottom,black_0%,black_55%,transparent_100%)]" />

      <div className={cn(landingContainer, "relative pt-8 pb-8 lg:pt-9 lg:pb-10")}>
        <div className="grid items-center gap-8 lg:grid-cols-[0.45fr_0.55fr] lg:gap-11 xl:gap-12">
          <Reveal>
            <div className="max-w-[560px]">
              <span className="inline-flex items-center rounded-full bg-[#E8F5EF] px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-[#064E3B] uppercase">
                AI Decision Intelligence Platform
              </span>

              <h1
                className={cn(
                  landingSerif,
                  "mt-4 max-w-[560px] text-[40px] leading-[1.14] tracking-[-0.025em] sm:text-[44px] lg:text-[48px] lg:leading-[1.12]"
                )}
              >
                Decision Intelligence for Modern Hiring
              </h1>

              <p className="mt-4 max-w-[540px] text-[17px] leading-[1.65] text-[#475569]">
                Turn fragmented interview feedback into structured decision
                intelligence. Know when your hiring team has enough evidence to
                make a fair and confident hiring decision.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
                <Link
                  href="/analyses/new"
                  className={cn(landingBtnPrimaryLg)}
                  aria-label="Start Your First Analysis"
                >
                  Start Your First Analysis
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-1.5 text-[15px] font-medium text-[#0F172A] transition-colors duration-200 ease-out hover:text-[#064E3B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30 focus-visible:ring-offset-2"
                >
                  See How It Works
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </a>
              </div>

              <ul className="mt-6 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4 sm:gap-3">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.title}
                      className={cn(
                        landingCard,
                        landingCardHover,
                        "min-w-0 px-3.5 py-3.5"
                      )}
                    >
                      <span className="flex size-8 items-center justify-center rounded-full bg-[#E8F5EF]">
                        <Icon
                          className="size-4 text-[#064E3B]"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                      </span>
                      <p className="mt-2.5 text-[13px] font-semibold leading-snug text-[#0F172A]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[12px] leading-snug text-[#475569]">
                        {item.description}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Reveal>

          <Reveal delayMs={100} className="min-w-0 w-full">
            <ProductPreview />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
