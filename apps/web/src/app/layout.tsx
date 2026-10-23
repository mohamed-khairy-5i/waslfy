import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "وصلّي Waslfy — من رسالة واتساب لإيصال شحن",
  description:
    "محرك استخراج محلي يقرأ رسائل الطلبات المصرية ويحوّلها لإيصال شحن جاهز للطباعة — بدون سيرفر وبدون رفع بيانات. بيانات عملائك عمرها ما بتسيب جهازك.",
  keywords: ["Waslfy", "وصلّي", "استخراج بيانات", "شحن", "COD", "e-commerce", "parser", "open source"],
  authors: [{ name: "Waslfy" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "وصلّي Waslfy — من رسالة واتساب لإيصال شحن",
    description:
      "الصق رسالة العميل — المحرك يقرأ الاسم والرقم والمحافظة والعنوان والمبلغ، ويحجب أي بيانات ناقصة قبل الطباعة.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C3B2E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${plexArabic.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
