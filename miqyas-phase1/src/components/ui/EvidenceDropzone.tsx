"use client";

import { useRef, useState } from "react";

/** منطقة رفع شواهد — عقد Dropzone · يبقي onFile كما هو */
export default function EvidenceDropzone({
  disabled,
  onFile,
  accept = ".pdf,.png,.jpg,.jpeg,.xlsx,.docx",
  label = "اسحب الشاهد هنا أو استعرض ملفًا",
}: {
  disabled?: boolean;
  onFile: (file: File) => void;
  accept?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function take(file: File | undefined | null) {
    if (!file || disabled) return;
    setError(null);
    onFile(file);
  }

  return (
    <div
      className={`zad-dropzone ${active ? "is-dragover" : ""}`.trim()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) inputRef.current?.click();
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setActive(false);
        take(e.dataTransfer.files?.[0]);
      }}
    >
      <strong className="zad-dropzone__title">{label}</strong>
      <span className="text-muted" style={{ fontSize: "var(--text-xs)" }}>
        PDF · PNG/JPG · XLSX/DOCX — حد 10 ميغابايت
      </span>
      {error ? <span role="alert">{error}</span> : null}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        disabled={disabled}
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
