import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Olivia Glow — Rituals for radiant skin",
  description: "Thoughtful skincare for your softest glow.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
