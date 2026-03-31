import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import TopNav from "@/components/layout/TopNav"
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
  title: "VIO AGRI - Nông nghiệp 4.0",
  description: "Nền tảng quản lý nông sản toàn diện",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
  <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <TopNav />
        <main className="flex-1 min-h-[calc(100vh-5rem)] bg-gradient-to-b from-zinc-50 to-slate-50 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
