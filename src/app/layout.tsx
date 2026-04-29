import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShopPilot AI Shopping Assistant",
  description:
    "Conversational e-commerce assistant with OpenRouter, budget filters, image search, and vector search architecture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
