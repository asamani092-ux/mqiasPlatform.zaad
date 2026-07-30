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
  ACHIEVED: "badge-success",
  ON_TRACK: "badge-primary",
  AT_RISK: "badge-warning",
  CRITICAL: "badge-danger",
  NO_DATA: "badge-neutral",
};

export const APPROVAL_LABEL: Record<string, string> = {
  DRAFT: "مسودة",
  SUBMITTED: "مقدَّم",
  INITIAL_APPROVED: "معتمد مبدئياً",
  FINAL_APPROVED: "معتمد نهائياً",
  REJECTED_WORDING: "مرفوض صياغة",
  REJECTED_EVIDENCE: "مرفوض شواهد",
  PENDING: "مقدَّم",
  APPROVED: "معتمد نهائياً",
  REJECTED: "مرفوض صياغة",
};

export const APPROVAL_BADGE: Record<string, string> = {
  DRAFT: "badge-neutral",
  SUBMITTED: "badge-warning",
  INITIAL_APPROVED: "badge-primary",
  FINAL_APPROVED: "badge-success",
  REJECTED_WORDING: "badge-danger",
  REJECTED_EVIDENCE: "badge-danger",
  PENDING: "badge-warning",
  APPROVED: "badge-success",
  REJECTED: "badge-danger",
};

export const FILLER_ROLE_LABEL: Record<string, string> = {
  EMPLOYEE: "موظف",
  SECTION_HEAD: "رئيس قسم",
  DEPT_MANAGER: "مدير إدارة",
};

export const POLARITY_LABEL: Record<string, string> = {
  HIGHER_BETTER: "أعلى أفضل",
  LOWER_BETTER: "أقل أفضل",
};

export const ROLE_LABEL: Record<string, string> = {
  SYSTEM_ADMIN: "مشرف النظام",
  EXECUTIVE: "الإدارة العليا",
  DEPT_MANAGER: "مدير إدارة",
  SECTION_HEAD: "رئيس قسم",
  EMPLOYEE: "موظف",
};

export const ROLE_VALUES = [
  "SYSTEM_ADMIN",
  "EXECUTIVE",
  "DEPT_MANAGER",
  "SECTION_HEAD",
  "EMPLOYEE",
] as const;

export type AppRole = (typeof ROLE_VALUES)[number];

export const USER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "نشط",
  INACTIVE: "معطّل",
};
