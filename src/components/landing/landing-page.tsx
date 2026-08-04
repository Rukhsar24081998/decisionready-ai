import { CoreCapabilities } from "@/components/landing/core-capabilities";
import { FinalCta } from "@/components/landing/final-cta";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNav } from "@/components/landing/landing-nav";
import { MetricsStrip } from "@/components/landing/metrics-strip";
import { WhyDecisionReady } from "@/components/landing/why-decisionready";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#0F172A]">
      <LandingNav />
      <main>
        <LandingHero />
        <MetricsStrip />
        <HowItWorks />
        <CoreCapabilities />
        <WhyDecisionReady />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
