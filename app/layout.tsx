import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SATOSHI LP TOOL",
  description: "BSC V3 Liquidity & Whale Position Analyzer",
  icons: {
    icon: "https://img.icons8.com/color/96/satoshi-nakamoto.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
