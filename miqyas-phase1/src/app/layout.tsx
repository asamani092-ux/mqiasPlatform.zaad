import type { Metadata, Viewport } from "next";
import "@zaad/design-system/tokens.css";
import "@zaad/design-system/components.css";
import "@zaad/design-system/zaad-addons.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "منصة مِقياس | جمعية الزاد",
  description: "منصة قياس الأداء المؤسسي — جمعية الزاد",
  icons: {
    icon: [
      { url: "/icon-mark.png", type: "image/png", sizes: "180x180" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "180x180" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rubik:wght@500;700&family=Tajawal:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="zad-root tmkeen-root miqyas-root" data-theme="light">
        {children}
      </body>
    </html>
  );
}
