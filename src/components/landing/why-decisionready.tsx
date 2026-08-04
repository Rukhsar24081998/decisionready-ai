import { Reveal } from "@/components/landing/reveal";
import {
  landingCard,
  landingCardHover,
  landingContainer,
  landingSerif,
} from "@/components/landing/landing-tokens";
import { cn } from "@/lib/utils";

const reasons = [
  {
    title: "Works alongside existing ATS",
    description:
      "DecisionReady AI is a Decision Intelligence Layer—not a replacement for sourcing, pipelines, or scheduling.",
  },
  {
    title: "Does not recommend Hire / Reject",
    description:
      "The product answers readiness: whether you have enough evidence for a fair decision.",
  },
  {
    title: "Evidence-first AI",
    description:
      "Insights map back to job requirements, scorecards, and notes. Missing evidence stays visible.",
  },
  {
    title: "Human remains in control",
    description:
      "Recruiters and hiring managers own the final call. Mark Ready for Debrief is a human confirmation.",
  },
  {
    title: "Explainable Decision Intelligence",
    description:
      "Transparency shows what was evaluated, what was missing, and what the system did not do.",
  },
  {
    title: "Built for Hiring Debriefs",
    description:
      "Generate structured, evidence-backed summaries that help hiring teams conduct focused, consistent, and fair hiring discussions.",
  },
] as const;

export function WhyDecisionReady() {
  return (
    <section id="why" className="scroll-mt-16 bg-[#FAFCFA]">
      <div className={cn(landingContainer, "py-14 lg:py-16")}>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2
              className={cn(
                landingSerif,
                "text-[30px] leading-tight sm:text-[34px]"
              )}
            >
              Why DecisionReady AI
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-[#475569]">
              Built for trust at the decision stage—calm, precise, and
              human-in-the-loop.
            </p>
          </div>
        </Reveal>

        <ul className="mt-10 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {reasons.map((reason, index) => (
            <Reveal key={reason.title} delayMs={index * 40}>
              <li
                className={cn(
                  landingCard,
                  landingCardHover,
                  "flex h-full flex-col p-7"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-[#064E3B]"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="text-[17px] font-semibold text-[#0F172A]">
                      {reason.title}
                    </h3>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-[#475569]">
                      {reason.description}
                    </p>
                  </div>
                </div>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
