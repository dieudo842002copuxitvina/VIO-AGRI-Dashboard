import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MainLayout } from "@/components/layout/MainLayout";
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
  title: "VIO AGRI - NÃ´ng nghiá»‡p 4.0",
  description: "Ná»n táº£ng quáº£n lÃ½ nÃ´ng sáº£n toÃ n diá»‡n",
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
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
