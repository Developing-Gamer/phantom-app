import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RootProviders } from "@/components/root-providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Phantom App",
  description: "App built on Phantom",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body
        className={`${inter.className} ${inter.variable} antialiased`}
      >
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
