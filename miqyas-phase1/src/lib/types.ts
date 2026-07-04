export type KpiStatus = "ACHIEVED" | "ON_TRACK" | "AT_RISK" | "CRITICAL" | "NO_DATA";
export type Period = "Q1" | "Q2" | "Q3" | "Q4" | "H1" | "H2" | "Y";

export const PERIOD_LABEL: Record<Period, string> = {
  Q1: "الربع الأول",
  Q2: "الربع الثاني",
  Q3: "الربع الثالث",
  Q4: "الربع الرابع",
  H1: "النصف الأول",
  H2: "النصف الثاني",
  Y: "سنوي",
};

export const STATUS_LABEL: Record<KpiStatus, string> = {
  ACHIEVED: "محقق",
  ON_TRACK: "على المسار",
  AT_RISK: "معرّض للخطر",
  CRITICAL: "حرج",
  NO_DATA: "لا بيانات",
};

export const STATUS_BADGE: Record<KpiStatus, string> = {
  ACHIEVED: "achieved",
  ON_TRACK: "ontrack",
  AT_RISK: "atrisk",
  CRITICAL: "critical",
  NO_DATA: "nodata",
};

export const ROLE_LABEL: Record<string, string> = {
  SYSTEM_ADMIN: "مشرف النظام",
  EXECUTIVE: "الإدارة العليا",
  DEPT_MANAGER: "مدير إدارة",
  SECTION_HEAD: "رئيس قسم",
  EMPLOYEE: "موظف",
};
