"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PERIOD_LABEL, type Period } from "@/lib/types";

export default function PeriodSelector({ year, period }: { year: number; period: Period }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(y: number, p: Period) {
    const q = new URLSearchParams(params.toString());
    q.set("year", String(y));
    q.set("period", p);
    router.push(`${pathname}?${q.toString()}`);
  }

  const periods: Period[] = ["Q1", "Q2", "Q3", "Q4", "H1", "H2", "Y"];

  return (
    <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
      <select className="inp" style={{ width: "auto" }} value={year} onChange={(e) => update(+e.target.value, period)}>
        {[year - 1, year, year + 1].map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select className="inp" style={{ width: "auto" }} value={period} onChange={(e) => update(year, e.target.value as Period)}>
        {periods.map((p) => (
          <option key={p} value={p}>{PERIOD_LABEL[p]}</option>
        ))}
      </select>
    </div>
  );
}
