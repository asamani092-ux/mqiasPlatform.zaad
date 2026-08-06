import type { Metadata } from "next";
import "@zaad/design-system/tokens.css";
import "@zaad/design-system/components.css";
import "./zaad-addons.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "منصة مِقياس | جمعية الزاد",
  description: "منصة قياس الأداء المؤسسي — جمعية الزاد",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="zad-root tmkeen-root miqyas-root" data-theme="light">
        {children}
      </body>
    </html>
  );
}
