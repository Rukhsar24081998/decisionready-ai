import {
  BarChart3,
  Clock3,
  Crosshair,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { landingContainer, landingIconWell } from "@/components/landing/landing-tokens";
import { cn } from "@/lib/utils";

const metrics = [
  { value: "92%", label: "Avg. Decision Readiness", icon: ShieldCheck },
  { value: "98%", label: "Evidence Coverage", icon: Crosshair },
  { value: "0", label: "Avg. Interview Conflicts", icon: Users },
  { value: "5 min", label: "Avg. Analysis Time", icon: Clock3 },
  { value: "10k+", label: "Analyses Completed", icon: BarChart3 },
] as const;

/** Illustrative product metrics — not customer usage claims. */
export function MetricsStrip() {
  return (
    <section
      aria-label="Illustrative Decision Intelligence metrics"
      className="border-y border-[#E7ECEF] bg-white"
    >
      <div className={cn(landingContainer, "py-8 lg:py-9")}>
        <Reveal>
          <ul className="grid list-none grid-cols-2 gap-y-8 p-0 sm:grid-cols-3 lg:grid-cols-5 lg:gap-0">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <li
                  key={metric.label}
                  className={cn(
                    "flex flex-col gap-3 px-2 sm:px-4 lg:px-6",
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
                  <p className="text-[26px] font-bold leading-none tracking-tight text-[#0F172A] tabular-nums">
                    {metric.value}
                  </p>
                  <p className="text-[14px] leading-snug text-[#475569]">
                    {metric.label}
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
