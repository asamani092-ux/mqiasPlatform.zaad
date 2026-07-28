type BrandMarkProps = {
  variant?: "login" | "sidebar";
};

/** يعرض ملف الشعار كما هو دون قص أو نسب أبعاد مفروضة */
export default function BrandMark({ variant = "login" }: BrandMarkProps) {
  return (
    <div className={`brand-mark brand-mark--${variant}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo_logo.webp"
        alt="جمعية الزاد"
        className="brand-mark-logo"
        decoding="async"
      />
    </div>
  );
}
