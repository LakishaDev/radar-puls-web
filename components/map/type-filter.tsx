"use client";

import type {ReactNode} from "react";
import type {MapEventType} from "@/lib/api";
import {cn} from "@/lib/utils";
import {AlertTriangle, Car, Construction, HelpCircle, Radio, Shield} from "lucide-react";

const order: MapEventType[] = ["police", "radar", "checkpoint", "accident", "traffic_jam", "unknown"];

const defaultLabels: Record<MapEventType, string> = {
  police: "Policija",
  radar: "Radar",
  checkpoint: "Kontrola",
  accident: "Udes",
  traffic_jam: "Guzva",
  unknown: "Ostalo",
};

const typeIcons: Record<MapEventType, ReactNode> = {
  police: <Shield size={12} />,
  radar: <Radio size={12} />,
  checkpoint: <Construction size={12} />,
  accident: <AlertTriangle size={12} />,
  traffic_jam: <Car size={12} />,
  unknown: <HelpCircle size={12} />,
};

interface TypeFilterProps {
  selected: MapEventType[];
  labels?: Partial<Record<MapEventType, string>>;
  onChange: (next: MapEventType[]) => void;
}

export function TypeFilter({selected, labels, onChange}: TypeFilterProps) {
  const toggle = (type: MapEventType) => {
    if (selected.includes(type)) {
      const next = selected.filter((value) => value !== type);
      onChange(next.length > 0 ? next : order);
      return;
    }
    onChange([...selected, type]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {order.map((type) => {
        const active = selected.includes(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => toggle(type)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
              active
                ? "border-[var(--rp-primary)] bg-[var(--rp-primary)]/10 text-[var(--rp-primary)]"
                : "border-[var(--rp-border)] text-[var(--rp-ink-soft)] hover:bg-[var(--rp-surface)]"
            )}
          >
            <span className="mr-1 inline-flex align-middle">{typeIcons[type]}</span>
            {labels?.[type] ?? defaultLabels[type]}
          </button>
        );
      })}
    </div>
  );
}
