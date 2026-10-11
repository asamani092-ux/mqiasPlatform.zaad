"use client";

import { usePathname } from "next/navigation";
import {
  PHASE_LABEL,
  PHASE_TITLE,
  resolveToolPhase,
} from "@/lib/phase-registry";

/** شريط وسم المرحلة فوق محتوى الأداة — للتجربة والرجوع */
export default function ToolPhaseBar() {
  const pathname = usePathname();
  const meta = resolveToolPhase(pathname);
  if (!meta) return null;

  return (
    <div className="tool-phase-bar no-print" role="status">
      <span className={`nav-badge-phase nav-badge-phase--${meta.phase}`} aria-label={PHASE_TITLE[meta.phase]}>
        {PHASE_LABEL[meta.phase]}
      </span>
      <span className="tool-phase-bar-title">{PHASE_TITLE[meta.phase]}</span>
      <span className="tool-phase-bar-sep" aria-hidden>
        ·
      </span>
      <span className="tool-phase-bar-integrate">{meta.integratesWith}</span>
    </div>
  );
}
