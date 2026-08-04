import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-landing-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://decisionready.ai";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DecisionReady AI | Evidence-backed Hiring Intelligence",
    template: "%s | DecisionReady AI",
  },
  description:
    "Professional hiring intelligence powered by structured evidence.",
  applicationName: "DecisionReady AI",
  keywords: [
    "hiring intelligence",
    "decision readiness",
    "recruiting evidence",
    "debrief",
    "talent acquisition",
  ],
  authors: [{ name: "DecisionReady AI" }],
  creator: "DecisionReady AI",
  publisher: "DecisionReady AI",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "DecisionReady AI",
    title: "DecisionReady AI | Evidence-backed Hiring Intelligence",
    description:
      "Professional hiring intelligence powered by structured evidence.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DecisionReady AI | Evidence-backed Hiring Intelligence",
    description:
      "Professional hiring intelligence powered by structured evidence.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#064E3B" },
    { media: "(prefers-color-scheme: dark)", color: "#064E3B" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${newsreader.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
