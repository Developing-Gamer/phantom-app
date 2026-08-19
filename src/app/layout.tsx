import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import { RootProviders } from "@/components/root-providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hello World",
  description: "A simple website template.",
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
        className={`${inter.className} ${inter.variable} ${newsreader.variable} antialiased`}
      >
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
