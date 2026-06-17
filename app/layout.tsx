import type { Metadata } from "next";
import { DM_Sans, DM_Mono, Archivo, Archivo_Black, Newsreader } from "next/font/google";
import "./globals.css";
import AppFooter from "@/components/AppFooter";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import { AudiencesProvider } from "@/lib/personas";

// Primary UI typeface — Archivo (grotesque). Full weight range.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// Occasional display — Archivo Black.
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  variable: "--font-archivo-black",
  weight: ["400"],
  display: "swap",
});

// Editorial accents (in the report).
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Kept for legacy components that still rely on DM Sans.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Synthetic",
  description: "Test ideas against synthetic audiences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${archivo.variable} ${archivoBlack.variable} ${newsreader.variable} ${dmSans.variable} ${dmMono.variable} antialiased`}
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <AudiencesProvider>
          <ImpersonationBanner />
          <div style={{ flex: 1 }}>{children}</div>
          <AppFooter />
        </AudiencesProvider>
      </body>
    </html>
  );
}
