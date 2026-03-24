import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import AppFooter from "@/components/AppFooter";

// Roobert is the brand font (commercial license required).
// DM Sans is the closest freely available alternative.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Synthetic Personas",
  description: "AI-powered persona generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} antialiased`} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <AppFooter />
      </body>
    </html>
  );
}
