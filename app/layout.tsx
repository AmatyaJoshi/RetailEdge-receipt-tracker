import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RetailEdge - AI-Powered Receipt Scanning & Expense Tracking",
  description: "Transform your expense tracking with AI-powered receipt scanning. Scan, analyze, and organize your receipts with intelligent data extraction and insights.",
  keywords: "receipt scanner, expense tracking, AI receipt processing, PDF analysis, expense management",
  authors: [{ name: "RetailEdge Team" }],
  openGraph: {
    title: "RetailEdge - AI-Powered Receipt Scanning",
    description: "Transform your expense tracking with AI-powered receipt scanning and intelligent data extraction.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RetailEdge - AI-Powered Receipt Scanning",
    description: "Transform your expense tracking with AI-powered receipt scanning and intelligent data extraction.",
  },
  icons: {
    icon: "/convex.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-950`}
      >
        <ClerkProvider dynamic>
          <ConvexClientProvider>
            <Header />
            <main className="pt-16 md:pt-20">{children}</main>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
