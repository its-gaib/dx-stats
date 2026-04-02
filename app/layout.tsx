import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import { Header } from "@/components/header";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DX Stats — Pubky Developer Experience Metrics",
  description: "Internal DevRel dashboard tracking developer adoption across the Pubky ecosystem.",
  icons: {
    icon: "/pubky-favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0d11",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${interTight.variable} antialiased`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
