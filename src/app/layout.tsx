import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://divescotty.com"),
  title: {
    default: "Scotty's Action Sports Network — Dive deeper. Live louder.",
    template: "%s | Scotty's Action Sports Network",
  },
  description:
    "Scuba diving, freediving, watersports and island tours across Cebu, Bohol and Boracay. Operating in the Philippines since 1986.",
  openGraph: {
    title: "Scotty's Action Sports Network",
    description:
      "Scuba diving, freediving, watersports and island tours in the Philippines.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="abyss"
      className={`${inter.variable} ${bebas.variable}`}
    >
      <body className="bg-base-100 text-base-content antialiased">
        {children}
      </body>
    </html>
  );
}
