import {
  ArrowRight,
  BrainCircuit,
  ClipboardList,
  LayoutDashboard,
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

const steps = [
  {
    step: "01",
    title: "Prepare Decision Analysis",
    description:
      "Add the job description, resume, and interviewer feedback into one evidence package.",
    icon: ClipboardList,
  },
  {
    step: "02",
    title: "AI Reasons Over Evidence",
    description:
      "Map evidence to competencies, detect conflicts, and measure coverage—without hire/reject.",
    icon: BrainCircuit,
  },
  {
    step: "03",
    title: "Decision Intelligence Dashboard",
    description:
      "Review readiness, gaps, and a Decision Brief ready for the hiring debrief.",
    icon: LayoutDashboard,
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-[#FAFCFA]">
      <div className={cn(landingContainer, "py-14 lg:py-16")}>
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-12">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.1em] text-[#064E3B] uppercase">
                How It Works
              </p>
              <h2
                className={cn(
                  landingSerif,
                  "mt-3 text-[30px] leading-[1.22] sm:text-[34px]"
                )}
              >
                A focused path from evidence to decision readiness
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-[#475569]">
                Three steps. One question answered.
              </p>
            </div>

            <ol className="flex list-none flex-col gap-3 p-0 md:flex-row md:items-stretch md:gap-0">
              {steps.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.step}
                    className="flex flex-1 flex-col md:flex-row md:items-center"
                  >
                    <div
                      className={cn(
                        landingCard,
                        landingCardHover,
                        "relative flex-1 p-7"
                      )}
                    >
                      <span className="absolute top-5 right-5 text-[13px] font-semibold tabular-nums text-[#064E3B]">
                        {item.step}
                      </span>
                      <span className={landingIconWell}>
                        <Icon
                          className="size-5 text-[#064E3B]"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                      </span>
                      <h3 className="mt-5 pr-8 text-[16px] font-semibold leading-snug text-[#0F172A]">
                        {item.title}
                      </h3>
                      <p className="mt-2.5 text-[14px] leading-relaxed text-[#475569]">
                        {item.description}
                      </p>
                    </div>

                    {index < steps.length - 1 ? (
                      <div
                        className="flex items-center justify-center py-1 text-[#064E3B] md:w-10 md:shrink-0"
                        aria-hidden="true"
                      >
                        <ArrowRight className="size-4 rotate-90 opacity-70 md:rotate-0" />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
