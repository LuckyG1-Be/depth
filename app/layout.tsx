import "./globals.css";
import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import GeoUpdater from "@/components/GeoUpdater";

export const metadata: Metadata = {
  title: "Depth",
  description: "High trust dating",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-screen text-white bg-[#1e1b27]">
        <GeoUpdater />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}