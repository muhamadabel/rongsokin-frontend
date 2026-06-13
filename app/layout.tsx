import type { Metadata, Viewport } from "next";
import { Manrope, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

import QueryProvider from "@/components/providers/QueryProvider";

const fontDisplay = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const fontBody = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rongsok.in",
  description: "Platform Ekosistem Daur Ulang Sirkular",
};

// Matikan zoom (pinch / double-tap) di mobile supaya tidak mengganggu saat tap.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body bg-surface text-ink pb-20 md:pb-0">
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "16px",
              background: "#0e0f0c",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              padding: "12px 16px",
            },
            success: { iconTheme: { primary: "#9fe870", secondary: "#0e0f0c" } },
          }}
        />
      </body>
    </html>
  );
}
