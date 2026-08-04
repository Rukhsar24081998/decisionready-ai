import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DotGrid } from "@/components/landing/dot-grid";
import { Reveal } from "@/components/landing/reveal";
import {
  landingBtnPrimaryXl,
  landingContainer,
  landingSerif,
} from "@/components/landing/landing-tokens";
import { cn } from "@/lib/utils";

export function FinalCta() {
  return (
    <section
      id="start"
      className="relative scroll-mt-16 overflow-hidden border-t border-[#E7ECEF] bg-[#F3F6F4]"
    >
      <DotGrid className="opacity-20" />
      <div className={cn(landingContainer, "relative py-16 text-center lg:py-20")}>
        <Reveal>
          <div className="mx-auto max-w-xl">
            <h2
              className={cn(
                landingSerif,
                "text-balance text-[30px] leading-tight sm:text-[34px]"
              )}
            >
              Start assessing decision readiness
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-[#475569]">
              Turn fragmented interview feedback into structured decision
              intelligence—before your next hiring debrief.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/analyses/new"
                className={cn(landingBtnPrimaryXl)}
                aria-label="Start New Decision Analysis"
              >
                Start New Decision Analysis
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
