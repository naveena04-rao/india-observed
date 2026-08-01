import type { Metadata } from "next";
import { assertProductionLaunchConfiguration, getPublicSiteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getPublicSiteUrl(),
  title: {
    default: "India Observed",
    template: "%s | India Observed",
  },
  description: "A curated, source-linked repository of protests and civic movements in India.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "India Observed",
    description: "Independent records of protests and civic movements across India.",
    url: "/",
    siteName: "India Observed",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "India Observed",
    description: "Independent records of protests and civic movements across India.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  assertProductionLaunchConfiguration();
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
