/**
 * المصدر الوحيد لقيم hex في المكونات — يعكس --tmkeen-* من tokens.css
 */
export const CHART_COLORS = {
  primary: "#8b1538",
  primaryDark: "#6e102c",
  secondary: "#f2b824",
  brandGray: "#706f6f",
  surface: "#ffffff",
  surfaceMuted: "#f5f5f5",
  surfaceBorder: "#e8e8e8",
  background: "#f5f5f5",
  foreground: "#706f6f",
  success: "#15803d",
  successBg: "#dcfce7",
  warning: "#854d0e",
  warningBg: "#fef9c3",
  danger: "#991b1b",
  dangerBg: "#fee2e2",
  targetLine: "#991b1b",
} as const;

export type ChartColorKey = keyof typeof CHART_COLORS;
