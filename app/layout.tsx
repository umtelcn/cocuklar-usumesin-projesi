import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from '@/components/Header';

import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false;

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Çocuklar Üşümesin - Yardım Sayfası",
  description: "Desteğinizle hayalleri gerçeğe dönüştürüyoruz.",
};

// ## DÜZELTME BURADA ##
// children prop'una React.ReactNode türünü atıyoruz.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-gradient-to-b from-blue-50 to-white`}>
        <Header />
        <main className="flex flex-col items-center px-4 py-8 w-full">
          {children}
        </main>
        <footer className="w-full text-center py-6 px-4">
            <p className="text-xs text-gray-500">© 2025 Çocuklar Üşümesin Yardımlaşma ve Dayanışma Derneği</p>
        </footer>
      </body>
    </html>
  );
}