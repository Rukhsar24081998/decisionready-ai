import Link from "next/link";
import {
  ArrowRight,
  FileCheck2,
  GitCompareArrows,
  LayoutList,
  NotebookPen,
  Scale,
  SearchX,
} from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import {
  landingCard,
  landingCardHover,
  landingContainer,
  landingIconWell,
  landingSerif,
} from "@/components/landing/landing-tokens";
import { cn } from "@/lib/utils";

const capabilities = [
  {
    title: "Competency Mapping",
    description:
      "Extract required competencies from the job description and map interview evidence to each one.",
    icon: LayoutList,
  },
  {
    title: "Evidence Coverage",
    description:
      "Measure how completely each competency has been evaluated.",
    icon: FileCheck2,
  },
  {
    title: "Evidence Gap Detection",
    description:
      "Identify missing or insufficient evidence before a hiring decision.",
    icon: SearchX,
  },
  {
    title: "Interviewer Conflict Detection",
    description:
      "Surface disagreements across interviewers without averaging them away.",
    icon: GitCompareArrows,
  },
  {
    title: "Decision Readiness",
    description:
      "Assess whether enough reliable evidence exists to conduct a fair hiring discussion.",
    icon: Scale,
  },
  {
    title: "Decision Brief",
    description:
      "Generate a concise, structured summary for the hiring debrief.",
    icon: NotebookPen,
  },
] as const;

export function CoreCapabilities() {
  return (
    <section
      id="capabilities"
      className="scroll-mt-16 border-t border-[#E7ECEF] bg-[#F3F6F4]"
    >
      <div className={cn(landingContainer, "py-14 lg:py-16")}>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2
              className={cn(
                landingSerif,
                "text-[30px] leading-tight sm:text-[34px]"
              )}
            >
              Core Capabilities
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-[#475569]">
              Structured Decision Intelligence built for the post-interview moment.
            </p>
          </div>
        </Reveal>

        <ul className="mt-10 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <Reveal key={capability.title} delayMs={index * 40}>
                <li
                  className={cn(
                    landingCard,
                    landingCardHover,
                    "flex h-full flex-col p-7"
                  )}
                >
                  <span className={landingIconWell}>
                    <Icon
                      className="size-[18px] text-[#064E3B]"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </span>
                  <h3 className="mt-5 text-[17px] font-semibold text-[#0F172A]">
                    {capability.title}
                  </h3>
                  <p className="mt-2.5 flex-1 text-[15px] leading-relaxed text-[#475569]">
                    {capability.description}
                  </p>
                  <Link
                    href="#how-it-works"
                    className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#064E3B] transition-colors duration-200 ease-out hover:text-[#053528] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30 focus-visible:ring-offset-2"
                  >
                    Learn more
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </li>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
