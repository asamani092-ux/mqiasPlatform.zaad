"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import FilterBar, { FilterField } from "@/components/ui/FilterBar";

export type EvidenceChip = "all" | "with" | "without" | "awaiting";

export type SearchableReviewCard = {
  code: string;
  name: string;
  departmentName?: string | null;
  ownerName?: string | null;
  enteredByName?: string | null;
  statusLabel?: string | null;
  kpiCodes?: string[];
  evidenceCount: number;
  awaiting?: boolean;
};

export default function ReviewSmartSearch<T extends SearchableReviewCard>({
  items,
  showAwaitingChip = false,
  children,
}: {
  items: T[];
  showAwaitingChip?: boolean;
  children: (filtered: T[]) => ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [chip, setChip] = useState<EvidenceChip>("all");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (chip === "with" && item.evidenceCount <= 0) return false;
      if (chip === "without" && item.evidenceCount > 0) return false;
      if (chip === "awaiting" && !item.awaiting) return false;
      const words = debounced
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      if (words.length === 0) return true;
      const hay = [
        item.code,
        item.name,
        item.departmentName,
        item.ownerName,
        item.enteredByName,
        item.statusLabel,
        ...(item.kpiCodes ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [items, debounced, chip]);

  const chips: { id: EvidenceChip; label: string }[] = [
    { id: "all", label: "الكل" },
    { id: "with", label: "بشواهد" },
    { id: "without", label: "بدون شواهد" },
    ...(showAwaitingChip ? [{ id: "awaiting" as const, label: "بانتظارك" }] : []),
  ];

  return (
    <>
      <FilterBar
        actions={
          <span className="text-muted" style={{ fontSize: ".82rem", whiteSpace: "nowrap" }}>
            عرض {filtered.length} من {items.length}
          </span>
        }
      >
        <FilterField label="بحث ذكي">
          <input
            className="input-field"
            style={{ width: "100%", minWidth: 0, flex: 1 }}
            placeholder="رمز، اسم، إدارة، مسؤول، مدخل..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </FilterField>
        <div className="review-search-chips">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`review-chip ${chip === c.id ? "active" : ""}`}
              onClick={() => setChip(c.id)}
            >
              {c.label}
            </button>
          ))}
          {(query || chip !== "all") && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                setQuery("");
                setChip("all");
              }}
            >
              مسح
            </button>
          )}
        </div>
      </FilterBar>
      {filtered.length === 0 && items.length > 0 ? (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <p className="text-muted" style={{ margin: 0 }}>
            لا نتائج لهذا البحث.{" "}
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                setQuery("");
                setChip("all");
              }}
            >
              مسح البحث
            </button>
          </p>
        </div>
      ) : null}
      {children(filtered)}
    </>
  );
}
