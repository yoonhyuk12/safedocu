import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "안전점검 체크리스트",
  description: "건설현장 안전점검 체크리스트 작성 시스템",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-512x512.png",
    apple: "/icon-192x192.png",
  },
  themeColor: "#0071e3",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#0071e3" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
