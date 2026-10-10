import type { Metadata, Viewport } from "next";
import { Cormorant, Karla, Noto_Naskh_Arabic, Space_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-cormorant" });
const karla = Karla({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-karla" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: "400", variable: "--font-space-mono" });

// Only Urdu uses it, so it is not preloaded on every page.
const notoNaskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-urdu",
  preload: false,
});

// Vercel sets this at build time; locally the share image resolves against the dev server.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const title = "Ask Pearl · Pearl Club travel concierge";
const description =
  "Ask for a place the way you'd text a friend who lives there. Answers come from Pearl Club's local curators.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "Ask Pearl",
  openGraph: { title, description, siteName: "Ask Pearl", type: "website", locale: "en" },
  twitter: { card: "summary_large_image", title, description },
  // A prototype built for Pearl Club, not an official Pearl Club site: keep it out of search results.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${karla.variable} ${spaceMono.variable} ${notoNaskh.variable} h-full antialiased`}
    >
      <body className="h-full">{children}</body>
    </html>
  );
}
