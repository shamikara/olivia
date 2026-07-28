import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Olivia Glow Admin", description: "Olivia Glow commerce administration" };
export default function Layout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
