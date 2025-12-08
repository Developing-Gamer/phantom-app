import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "@/stack/client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Your App",
  description: "Built with Stack Auth & InstantDB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Don't remove this script. It is used to notify the parent frame of navigation changes. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (window.parent === window) return;
                var lastPath = location.pathname + location.search;
                function notify() {
                  var path = location.pathname + location.search;
                  if (path !== lastPath) lastPath = path;
                  window.parent.postMessage({ type: "navigation", path: path }, "*");
                }
                notify();
                window.addEventListener("popstate", notify);
                var push = history.pushState;
                history.pushState = function() { push.apply(this, arguments); setTimeout(notify, 0); };
                var replace = history.replaceState;
                history.replaceState = function() { replace.apply(this, arguments); setTimeout(notify, 0); };
              })();
            `,
          }}
        />
        <StackProvider app={stackClientApp}>
          <StackTheme>{children}</StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
