import "./globals.css";
import type { Metadata, Viewport } from "next";
import AppShell from "@/components/AppShell";
import GeoUpdater from "@/components/GeoUpdater";

function normalizeOrigin(value?: string | null) {
  const raw = value?.trim().replace(/\/+$/, "");
  if (!raw) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try { return new URL(withProtocol).origin; } catch { return null; }
}

const appOrigin = normalizeOrigin(process.env.APP_URL) || normalizeOrigin(process.env.VERCEL_URL) || "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(appOrigin),
  title: { default: "Depth", template: "%s · Depth" },
  description: "Matching minds before faces.",
  applicationName: "Depth",
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }, { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }], apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }] },
  appleWebApp: { capable: true, title: "Depth", statusBarStyle: "black-translucent" },
  openGraph: { title: "Depth", description: "Matching minds before faces.", url: appOrigin, siteName: "Depth", type: "website" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, viewportFit: "cover", themeColor: "#1e1b27" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-[#1e1b27] text-white">
        <GeoUpdater />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
