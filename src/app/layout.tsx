import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

// Bypass google font remote fetch during offline compilation
const inter = {
  variable: "font-sans",
};

const backoneFont = localFont({
  src: "../../public/fonts/BackOneLogo-Regular.ttf",
  variable: "--font-backone",
});

export const metadata: Metadata = {
  title: "BackOne - Deep Package Inspection",
  description: "BackOne by PT. Data Bisnis Solusi - Network Intelligence Dashboard",
  icons: {
    icon: "/backone-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${backoneFont.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
