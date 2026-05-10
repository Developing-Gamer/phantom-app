import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "@/stack/client";
import { AppProviders } from "@/components/app-providers";
import { AuthSyncProvider } from "@/components/auth-sync-provider";
import { Inter } from "next/font/google";
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
        <StackProvider app={stackClientApp}>
          <StackTheme>
            <AppProviders>
              <AuthSyncProvider>
                {children}
              </AuthSyncProvider>
            </AppProviders>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
