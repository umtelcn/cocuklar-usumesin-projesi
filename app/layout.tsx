import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

config.autoAddCss = false;

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Çocuklar Üşümesin - Yardımlaşma ve Dayanışma Derneği",
  description: "Desteğinizle çocuklarımızın hayallerini gerçeğe dönüştürüyoruz.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${inter.className} flex min-h-screen flex-col antialiased`}
      >
        <Header />

        <main className="mx-auto w-full max-w-md flex-1 px-3 py-3 sm:px-4">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
