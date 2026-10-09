import type { Metadata, Viewport } from "next";
import { Cormorant, Karla, Space_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-cormorant" });
const karla = Karla({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-karla" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono" });

export const metadata: Metadata = {
  title: "Ask Pearl · Pearl Club travel concierge",
  description: "Chat with Pearl to find places hand-picked by Pearl Club's local curators.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cormorant.variable} ${karla.variable} ${spaceMono.variable} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
