import { DotGrid } from "@/components/landing/dot-grid";
import { landingContainer } from "@/components/landing/landing-tokens";
import { cn } from "@/lib/utils";

/**
 * Route-level skeleton while Decision Brief resolves.
 */
export default function BriefLoading() {
  return (
    <main className="relative overflow-hidden pb-16" aria-busy="true">
      <DotGrid className="opacity-15" />
      <div className={cn(landingContainer, "relative py-4 lg:py-5")}>
        <p className="sr-only">Preparing Decision Brief…</p>
        <div className="h-8 w-40 animate-pulse rounded-lg bg-[#E5E7EB]" />
        <div className="mt-5 h-40 animate-pulse rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]" />
        <div className="mt-5 h-72 animate-pulse rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]" />
        <p className="mt-4 text-[12px] text-[#64748B]">
          Assembling executive hiring report…
        </p>
      </div>
    </main>
  );
}
