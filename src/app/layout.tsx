import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SessionGuard } from "@/components/session-guard";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Absensi Enthalphy",
  description: "Sistem absensi karyawan PT Enthalphy Environergy Consulting",
};

export const viewport: Viewport = {
  themeColor: "#087683",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SessionGuard />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
