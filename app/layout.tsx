import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BSC V3 Liquidity Analyzer",
  description: "Analyze V3 Liquidity Pools on BSC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
