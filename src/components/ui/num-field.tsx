import React from "react";

export function NumField({
  label,
  value,
  step = 1,
  onChange,
  suffix,
  readOnly,
  placeholder,
}: {
  label: string;
  value: number;
  step?: number;
  suffix?: string;
  onChange?: (n: number) => void;
  readOnly?: boolean;
  placeholder?: number | string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <input
          className="w-full rounded-md border px-2 py-1"
          type="number"
          step={step}
          value={Number.isFinite(value) ? (value === 0 && !readOnly ? "" : value) : ""}
          onChange={(e) => onChange?.(Number(e.target.value))}
          readOnly={readOnly}
          placeholder={placeholder ? String(placeholder) : undefined}
        />
        {suffix ? <span className="text-slate-500 dark:text-slate-400 text-xs">{suffix}</span> : null}
      </div>
    </label>
  );
}

