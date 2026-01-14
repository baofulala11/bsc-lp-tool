import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SATOSHI LP TOOL",
  description: "BSC V3 Liquidity & Whale Position Analyzer",
  icons: {
    icon: "https://img.icons8.com/external-flaticons-lineal-color-flat-icons/64/external-satoshi-nakamoto-cryptocurrency-flaticons-lineal-color-flat-icons-2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="shortcut icon" href="https://img.icons8.com/external-flaticons-lineal-color-flat-icons/64/external-satoshi-nakamoto-cryptocurrency-flaticons-lineal-color-flat-icons-2.png" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
