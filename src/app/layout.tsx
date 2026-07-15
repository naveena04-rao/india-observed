import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const merriweather = Merriweather({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "India Observed",
  description: "A curated, source-linked repository of protests and civic movements in India."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${merriweather.variable}`}>{children}</body>
    </html>
  );
}
