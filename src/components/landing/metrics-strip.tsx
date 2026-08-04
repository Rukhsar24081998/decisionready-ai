import {
  FileStack,
  Gauge,
  Link2,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { landingContainer, landingIconWell } from "@/components/landing/landing-tokens";
import { cn } from "@/lib/utils";

const capabilities = [
  { label: "Multi-document Analysis", icon: FileStack },
  { label: "Decision Intelligence", icon: Gauge },
  { label: "Evidence-backed Insights", icon: Sparkles },
  { label: "Human-in-the-loop AI", icon: Scale },
  { label: "Grounded AI Responses", icon: ShieldCheck },
  { label: "Competency Mapping", icon: Link2 },
] as const;

/** Product capability highlights — not adoption or accuracy claims. */
export function MetricsStrip() {
  return (
    <section
      aria-label="DecisionReady AI capabilities"
      className="border-y border-[#E7ECEF] bg-white"
    >
      <div className={cn(landingContainer, "py-8 lg:py-9")}>
        <Reveal>
          <ul className="grid list-none grid-cols-2 gap-y-8 p-0 sm:grid-cols-3 lg:grid-cols-6 lg:gap-0">
            {capabilities.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <li
                  key={capability.label}
                  className={cn(
                    "flex flex-col gap-3 px-2 sm:px-3 lg:px-4",
                    index > 0 && "lg:border-l lg:border-[#E7ECEF]"
                  )}
                >
                  <span className={cn(landingIconWell, "size-10")}>
                    <Icon
                      className="size-[18px] text-[#064E3B]"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </span>
                  <p className="text-[18px] font-bold leading-none tracking-tight text-[#064E3B]">
                    ✓
                  </p>
                  <p className="text-[13px] leading-snug font-medium text-[#0F172A] sm:text-[14px]">
                    {capability.label}
                  </p>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
