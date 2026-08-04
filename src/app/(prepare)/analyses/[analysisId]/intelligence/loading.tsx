import { DotGrid } from "@/components/landing/dot-grid";
import { landingContainer } from "@/components/landing/landing-tokens";
import { cn } from "@/lib/utils";

/**
 * Route-level skeleton while Decision Intelligence data resolves.
 */
export default function IntelligenceLoading() {
  return (
    <main className="relative overflow-hidden pb-12" aria-busy="true">
      <DotGrid className="opacity-20" />
      <div className={cn(landingContainer, "relative py-4 lg:py-5")}>
        <p className="sr-only">Preparing Decision Intelligence report…</p>
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[#E5E7EB]" />
        <div className="mt-4 h-10 max-w-xl animate-pulse rounded-lg bg-[#E5E7EB]" />
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]"
            />
          ))}
        </div>
        <div className="mt-4 h-64 animate-pulse rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]" />
        <div className="mt-3 h-96 animate-pulse rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]" />
        <p className="mt-4 text-[12px] text-[#64748B]">
          Preparing analysis · Building evidence views · Generating executive
          summary…
        </p>
      </div>
    </main>
  );
}
