"use client";

import dynamic from "next/dynamic";
import {MapPin} from "lucide-react";
import {Reveal} from "@/components/motion/reveal";

const MapClient = dynamic(() => import("./map-client"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] items-center justify-center rounded-xl border border-[var(--rp-border)] bg-[var(--rp-surface)]">
      <div className="flex flex-col items-center gap-3 text-[var(--rp-ink-soft)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--rp-border)] border-t-[var(--rp-primary)]" />
        <p className="text-sm">Učitavanje mape…</p>
      </div>
    </div>
  ),
});

export function MapSection() {
  return (
    <Reveal>
      <section id="mapa" className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[var(--rp-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--rp-deep)]">Live Mapa – Niš</h2>
          </div>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-700">
            Preview
          </span>
        </div>
        <p className="hidden text-xs text-[var(--rp-ink-soft)] sm:block">
          Klikni na marker za detalje
        </p>
      </div>

      {/* Map */}
      <MapClient />

      {/* Disclaimer */}
      <p className="mt-3 text-[11px] text-[var(--rp-ink-soft)]">
        * Prikazani izveštaji su demo podaci. Prava mapa će biti dostupna uz aplikaciju.
      </p>
      </section>
    </Reveal>
  );
}
