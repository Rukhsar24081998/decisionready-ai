import { LandingNav } from "@/components/landing/landing-nav";

export default function PrepareLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen bg-[#FCFCFA] font-sans text-[#0F172A]">
      <LandingNav />
      {children}
    </div>
  );
}
