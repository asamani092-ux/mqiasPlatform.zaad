const DEPT_ALIASES: Record<string, string> = {
  "الرعاية والتمكين": "الرعاية والتمكين",
  "التكافل المجتمعي": "التكافل المجتمعي",
  "الاستدامة": "الاستدامة",
  "الإستدامة": "الاستدامة",
  "الأداء والنمو": "الأداء والنمو",
  "الشؤون المالية والإدارية": "الشؤون المالية والإدارية",
  "الاتصال المؤسسي": "الاتصال المؤسسي",
  "الإتصال المؤسسي": "الاتصال المؤسسي",
};

export function normalizeDeptText(raw: string): string {
  return raw
    .replace(/إدارة\s*/g, "")
    .replace(/[،,]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*و\s*/g, " ")
    .trim()
    .toLowerCase();
}

export function mapDepartmentName(
  raw: string,
  departments: { id: number; name: string }[],
): { departmentId: number | null; ownerLabel: string | null } {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.includes("جميع الإدارات")) {
    return { departmentId: null, ownerLabel: trimmed || null };
  }

  if (trimmed.includes("،") || trimmed.includes(",")) {
    return { departmentId: null, ownerLabel: trimmed };
  }

  const norm = normalizeDeptText(trimmed);
  for (const dept of departments) {
    const deptNorm = normalizeDeptText(dept.name);
    if (norm === deptNorm || norm.includes(deptNorm) || deptNorm.includes(norm)) {
      return { departmentId: dept.id, ownerLabel: null };
    }
    const alias = DEPT_ALIASES[dept.name];
    if (alias && normalizeDeptText(alias) === norm) {
      return { departmentId: dept.id, ownerLabel: null };
    }
  }

  for (const [key, val] of Object.entries(DEPT_ALIASES)) {
    if (normalizeDeptText(key) === norm || normalizeDeptText(val) === norm) {
      const found = departments.find((d) => d.name === key || d.name === val);
      if (found) return { departmentId: found.id, ownerLabel: null };
    }
  }

  return { departmentId: null, ownerLabel: trimmed };
}
