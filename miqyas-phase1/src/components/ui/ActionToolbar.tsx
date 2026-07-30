"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ICON_PROPS } from "@/lib/icon-props";
import type { LucideIcon } from "lucide-react";

/** شريط إجراءات موحّد */
export default function ActionToolbar({
  children,
  className = "",
  align = "start",
}: {
  children: ReactNode;
  className?: string;
  align?: "start" | "end" | "between";
}) {
  return (
    <div className={`action-toolbar action-toolbar--${align} ${className}`.trim()}>
      {children}
    </div>
  );
}

type IconBtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  variant?: "default" | "danger" | "primary";
  size?: "sm" | "md";
  showLabel?: boolean;
};

export function IconActionButton({
  icon: Icon,
  label,
  variant = "default",
  size = "sm",
  showLabel = false,
  className = "",
  type = "button",
  ...rest
}: IconBtnProps) {
  const variantClass =
    variant === "danger"
      ? "icon-btn icon-btn--danger"
      : variant === "primary"
        ? "icon-btn icon-btn--primary"
        : "icon-btn";
  const sizeClass = size === "sm" ? "icon-btn--sm" : "";

  return (
    <button
      type={type}
      className={`${variantClass} ${sizeClass} ${className}`.trim()}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon {...ICON_PROPS} />
      {showLabel ? <span className="icon-btn-label">{label}</span> : null}
    </button>
  );
}
