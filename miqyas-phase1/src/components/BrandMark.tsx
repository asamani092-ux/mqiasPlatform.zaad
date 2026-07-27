import Image from "next/image";

type BrandMarkProps = {
  variant?: "login" | "topbar" | "sidebar";
  showTitle?: boolean;
};

const SIZES = {
  login: { width: 220, height: 147 },
  topbar: { width: 140, height: 93 },
  sidebar: { width: 160, height: 107 },
} as const;

export default function BrandMark({
  variant = "topbar",
  showTitle = false,
}: BrandMarkProps) {
  const size = SIZES[variant];

  return (
    <div className={`brand-mark brand-mark--${variant}`}>
      <Image
        src="/brand/zaad-logo.png"
        alt="جمعية الزاد"
        width={size.width}
        height={size.height}
        className="brand-mark-logo"
        priority={variant === "login"}
      />
      {showTitle && (
        <div className="brand-mark-text">
          <span className="brand-mark-product">مِقياس</span>
          <span className="brand-mark-org">جمعية الزاد</span>
        </div>
      )}
    </div>
  );
}
