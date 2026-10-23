import type { Metadata } from "next";
import "@fontsource-variable/ibm-plex-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sensor Reliability Analytics",
  description:
    "Engineering analytics for a simulated multi-ion blood sensor manufacturing and reliability dataset.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
