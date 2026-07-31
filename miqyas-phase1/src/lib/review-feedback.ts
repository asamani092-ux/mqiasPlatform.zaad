/** قرارات وملاحظات مراجعة الحقول/الشواهد */

export type FieldKey = "actual" | "what" | "how";
export type Decision = "accept" | "reject" | null;

export type FieldDecisions = Record<FieldKey, Decision>;

export type EvidenceDecision = {
  evidenceId: number;
  decision: Exclude<Decision, null>;
  reason?: string;
};

export type ReviewFeedback = {
  fields: Partial<Record<FieldKey, { decision: "reject"; note?: string }>>;
  evidences: { evidenceId: number; fileName?: string; reason?: string }[];
  notes: string;
  at?: string;
  layer?: "dept" | "final";
};

export const FIELD_LABELS: Record<FieldKey, string> = {
  actual: "المتحقق",
  what: "ماذا حصل؟",
  how: "كيف حصل؟",
};

export function emptyFieldDecisions(): FieldDecisions {
  return { actual: null, what: null, how: null };
}

export function allFieldsAccepted(fields: FieldDecisions, evidenceIds: number[], evidenceDecisions: Record<number, Decision>): boolean {
  if (fields.actual !== "accept" || fields.what !== "accept" || fields.how !== "accept") return false;
  return evidenceIds.every((id) => evidenceDecisions[id] === "accept");
}

export function anyRejected(fields: FieldDecisions, evidenceDecisions: Record<number, Decision>): boolean {
  if (fields.actual === "reject" || fields.what === "reject" || fields.how === "reject") return true;
  return Object.values(evidenceDecisions).some((d) => d === "reject");
}

export function buildRejectSummary(
  fields: FieldDecisions,
  evidenceDecisions: Record<number, Decision>,
  evidenceNames: Record<number, string>,
  notes: string
): { feedback: ReviewFeedback; rejectReason: string; rejectedEvidenceIds: number[] } {
  const feedbackFields: ReviewFeedback["fields"] = {};
  const parts: string[] = [];
  (["actual", "what", "how"] as FieldKey[]).forEach((key) => {
    if (fields[key] === "reject") {
      feedbackFields[key] = { decision: "reject" };
      parts.push(`رُفض: ${FIELD_LABELS[key]}`);
    }
  });
  const evidences: ReviewFeedback["evidences"] = [];
  const rejectedEvidenceIds: number[] = [];
  for (const [idStr, decision] of Object.entries(evidenceDecisions)) {
    if (decision !== "reject") continue;
    const evidenceId = parseInt(idStr, 10);
    rejectedEvidenceIds.push(evidenceId);
    evidences.push({
      evidenceId,
      fileName: evidenceNames[evidenceId],
      reason: notes,
    });
    parts.push(`رُفض شاهد: ${evidenceNames[evidenceId] || evidenceId}`);
  }
  const notesTrim = notes.trim();
  if (notesTrim) parts.push(`الملاحظات: ${notesTrim}`);
  return {
    feedback: {
      fields: feedbackFields,
      evidences,
      notes: notesTrim,
      at: new Date().toISOString(),
    },
    rejectReason: parts.join(" · ") || notesTrim,
    rejectedEvidenceIds,
  };
}

export function normalizeSearch(q: string): string[] {
  return q
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

/** تطابق AND بين كلمات الاستعلام وحقول البطاقة */
export function matchesSmartSearch(haystackParts: Array<string | null | undefined>, query: string): boolean {
  const words = normalizeSearch(query);
  if (words.length === 0) return true;
  const hay = haystackParts
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return words.every((w) => hay.includes(w));
}
