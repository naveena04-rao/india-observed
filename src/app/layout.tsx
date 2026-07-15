import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "India Observed",
  description: "A curated, source-linked repository of protests and civic movements in India.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
