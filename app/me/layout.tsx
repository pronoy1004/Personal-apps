import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pronoy Pant — Senior Software Engineer",
  description:
    "Pronoy Pant — Senior Software Engineer · AI Agents & iPaaS. 4+ years across enterprise iPaaS, multi-agent AI, and cloud-native microservices.",
  robots: { index: true, follow: true },
};

/**
 * Standalone public layout for the recruiter-facing portfolio.
 * No hub chrome (no sidebar / bottom nav) — this surface can't reach the
 * authenticated apps.
 */
export default function MeLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
