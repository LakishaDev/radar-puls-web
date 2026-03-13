"use client";

import {cn} from "@/lib/utils";

export type TimeWindow = "1h" | "6h" | "12h" | "24h";

const options: Array<{value: TimeWindow; label: string}> = [
  {value: "1h", label: "1h"},
  {value: "6h", label: "6h"},
  {value: "12h", label: "12h"},
  {value: "24h", label: "24h"},
];

interface TimeFilterProps {
  selected: TimeWindow;
  labels?: Partial<Record<TimeWindow, string>>;
  onChange: (value: TimeWindow) => void;
}

export function TimeFilter({selected, labels, onChange}: TimeFilterProps) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-[var(--rp-border)]">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-semibold transition-colors",
            selected === option.value
              ? "bg-[var(--rp-primary)] text-white"
              : "bg-[var(--rp-card)] text-[var(--rp-ink-soft)] hover:bg-[var(--rp-surface)]"
          )}
        >
          {labels?.[option.value] ?? option.label}
        </button>
      ))}
    </div>
  );
}
