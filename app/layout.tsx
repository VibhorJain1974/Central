import type { Metadata } from "next";

// The three faces are shipped with the app, not fetched from Google at build
// time or at page load. Nothing on this page depends on a third party being
// reachable, and no visitor's browser announces itself to a font CDN.
import "@fontsource/saira-condensed/400.css";
import "@fontsource/saira-condensed/600.css";
import "@fontsource/saira-condensed/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";

import "./globals.css";

export const metadata: Metadata = {
  title: "AARVAK CENTRAL",
  description: "Tech Sprint Journey 2026. Five teams, seventy-five days, one record.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ink text-bone font-sans antialiased">{children}</body>
    </html>
  );
}
