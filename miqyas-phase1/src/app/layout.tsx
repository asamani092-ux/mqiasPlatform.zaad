import type { Metadata } from "next";
import "./tokens.css";
import "./components.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "منصة مِقياس | جمعية الزاد",
  description: "منصة قياس الأداء المؤسسي — جمعية الزاد",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="tmkeen-root">{children}</body>
    </html>
  );
}
