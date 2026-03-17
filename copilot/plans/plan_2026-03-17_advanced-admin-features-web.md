# Plan: Web — Napredne Admin funkcionalnosti (Predlozi iz plana za Location Moderation)

**Datum:** 2026-03-17  
**Zavisnost:** Implementirati POSLE `plan_2026-03-17_admin-location-moderation-web.md`  
**Sinhronizovano sa:** `radar-puls-api/copilot/plans/plan_2026-03-17_advanced-admin-features-api.md`

---

## Sadržaj

1. [Konfirmacioni dijalog za potvrdu lokacije](#1-konfirmacioni-dijalog)
2. [Bulk Edit mod](#2-bulk-edit-mod)
3. [Event History / Changelog Timeline](#3-event-history-changelog)
4. [Keyboard Shortcuts](#4-keyboard-shortcuts)
5. [Geocoding Cache Browser](#5-geocoding-cache-browser)
6. [Map View za Event listu](#6-map-view-za-event-listu)
7. [Real-time Admin Updates](#7-real-time-admin-updates)
8. [Dark/Light Mode za Admin](#8-darklight-mode-za-admin)

---

## 1. Konfirmacioni dijalog

### Cilj
Pre nego admin klikne "Potvrdi lokaciju", prikazati modal sa jasnim pregledom šta će se desiti. Sprečava accidental click-ove, daje uvid u posledice.

### 1.1 Nova komponenta: `components/admin/confirm-location-dialog.tsx`

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin, X, AlertTriangle } from "lucide-react";

interface ConfirmLocationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  locationText: string;
  lat: number;
  lng: number;
}

export function ConfirmLocationDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
  locationText,
  lat,
  lng,
}: ConfirmLocationDialogProps) {
  const t = useTranslations("admin");
  // ... implementacija ...
}
```

**Dizajn specifikacija:**

- **Overlay:** `fixed inset-0 z-50 bg-black/60 backdrop-blur-sm` — fade in sa Framer Motion
- **Dialog box:** `bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md mx-auto mt-[20vh] shadow-2xl`
- **Header:** MapPin ikona (emerald) + naslov "Potvrdite lokaciju"
- **Body:**
  - Sekcija sa informacijama u `bg-slate-800/50 rounded-lg p-4`:
    - Lokacija: `{locationText}` — bold, slate-100
    - Koordinate: `{lat.toFixed(6)}, {lng.toFixed(6)}` — mono font, cyan-300
    - Google Maps link — eksternalni link, emerald
  - Upozorenje u `bg-amber-500/10 border border-amber-500/20 rounded-lg p-3`:
    - AlertTriangle ikona + tekst: "Ove koordinate će biti sačuvane kao verifikovani fallback. Svi budući eventi sa tekstom lokacije '{locationText}' će automatski koristiti ove koordinate."
- **Footer:** Dva dugmeta
  - "Otkaži" — `border border-slate-600 text-slate-300 hover:bg-slate-800` 
  - "Potvrdi lokaciju" — `bg-emerald-600 text-white hover:bg-emerald-500` sa loading spinner

**Animacija (Framer Motion):**
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 z-50 ..."
>
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 10 }}
    transition={{ duration: 0.15 }}
    className="bg-slate-900 ..."
  >
```

**Keyboard:** `Escape` zatvara dialog, `Enter` potvrđuje.

### 1.2 Integracija sa `location-panel.tsx`

U `LocationPanel` komponenti (iz prethodnog plana):
- Klik na "Potvrdi lokaciju" → otvara `ConfirmLocationDialog`
- Dialog `onConfirm` → poziva `confirmEventLocation()` API
- Po uspehu → zatvara dialog, prikazuje toast, ažurira badge

---

## 2. Bulk Edit mod

### Cilj
Checkbox-ovi u admin events tabeli sa toolbar-om koji se pojavljuje kada je selektiran 1+ event. Masovne akcije: approve all, reject all, confirm locations, re-enrich.

### 2.1 Nova API funkcija: `lib/admin-api.ts`

```typescript
export async function bulkConfirmLocations(
  token: string,
  eventIds: string[],
): Promise<{ confirmed: number; cached: number }> {
  return adminRequest("/api/admin/events/bulk-confirm-location", {
    method: "POST",
    token,
    body: { eventIds },
  });
}

export async function bulkApproveEvents(
  token: string,
  eventIds: string[],
): Promise<void> {
  // Sekvencijalno — nema bulk approve endpoint-a na API-ju pa pozivam approve za svaki
  for (const id of eventIds) {
    await approveAdminEvent(id, token);
  }
}

export async function bulkRejectEvents(
  token: string,
  eventIds: string[],
  note?: string,
): Promise<void> {
  for (const id of eventIds) {
    await rejectAdminEvent(id, token, note);
  }
}

// Kandidati za bulk potvrdu
export async function fetchConfirmLocationCandidates(
  token: string,
  signal?: AbortSignal,
): Promise<Array<{
  location_text: string;
  lat: number;
  lng: number;
  geo_source: string;
  occurrence_count: number;
  event_ids: string[];
}>> {
  return adminRequest("/api/admin/events/confirm-location-candidates", { token, signal });
}
```

### 2.2 Proširiti `components/admin/admin-events-client.tsx`

**State:**
```tsx
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [bulkMode, setBulkMode] = useState(false);
const [bulkAction, setBulkAction] = useState<string | null>(null);
```

**Checkbox kolona u tabeli:**
```tsx
// U <thead>:
<th className="w-10 px-2 py-3">
  <input
    type="checkbox"
    checked={selectedIds.size === tableRows.length && tableRows.length > 0}
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedIds(new Set(tableRows.map(r => r.id)));
      } else {
        setSelectedIds(new Set());
      }
    }}
    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
  />
</th>

// U <tr>:
<td className="w-10 px-2 py-3">
  <input
    type="checkbox"
    checked={selectedIds.has(row.id)}
    onChange={(e) => {
      const next = new Set(selectedIds);
      if (e.target.checked) next.add(row.id);
      else next.delete(row.id);
      setSelectedIds(next);
    }}
    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
  />
</td>
```

### 2.3 Nova komponenta: `components/admin/bulk-action-toolbar.tsx`

**Dizajn specifikacija:**

- **Position:** Sticky bottom toolbar, pojavljuje se kada `selectedIds.size > 0`
- **Container:** `fixed bottom-0 left-0 right-0 z-40 border-t border-slate-700 bg-slate-900/95 backdrop-blur-md px-4 py-3 md:left-64`
- **Layout:** Flex row sa:
  - Levo: Counter badge `"N selekovano"` — `bg-cyan-500/20 text-cyan-300 rounded-full px-3 py-1 text-sm font-semibold`
  - Desno: Dugmad za akcije

**Dugmad:**

| Akcija | Boja | Ikona (Lucide) | Tekst |
|--------|------|---------|-------|
| Odobri sve | `bg-emerald-600 hover:bg-emerald-500` | CheckCheck | "Odobri (N)" |
| Odbij sve | `bg-rose-600 hover:bg-rose-500` | XCircle | "Odbij (N)" |
| Potvrdi lokacije | `bg-cyan-600 hover:bg-cyan-500` | MapPinCheck | "Potvrdi lokacije (N)" |
| Re-enrich | `bg-violet-600 hover:bg-violet-500` | RefreshCw | "Re-enrich (N)" |
| Poništi selekciju | `border border-slate-600 text-slate-300` | X | "Poništi" |

**Animacija:**
```tsx
<AnimatePresence>
  {selectedIds.size > 0 && (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="fixed bottom-0 ..."
    >
```

**Ponašanje:**
- Svaka bulk akcija prikazuje konfirmacioni toast sa brojem uspešnih/neuspešnih
- Progress indicator tokom bulk operacija (npr. "Odobravanje 3/10...")
- Po završetku: automatski refetch events liste, clear selekciju

### 2.4 Nova komponenta: `components/admin/bulk-confirm-candidates.tsx`

Prikazuje listu kandidata za bulk potvrdu lokacija (sa API endpoint-a `/api/admin/events/confirm-location-candidates`).

**Dizajn:**
- Kartica za svakog kandidata u `bg-slate-800/50 border border-slate-700 rounded-lg p-4`
- Prikazuje: location_text, koordinate, Google Maps link, broj ponavljanja, geo_source
- "Potvrdi sve (N)" dugme za svaki kandidat red
- Globalno "Potvrdi sve kandidate" dugme na vrhu

**Layout:** Lista ili grid, sortirana po `occurrence_count` DESC.

Dostupna sa novog taba na events stranici ili kao posebna pod-sekcija.

---

## 3. Event History / Changelog

### Cilj
Timeline prikaz svih admin akcija za event: kreiran, AI obogaćen, admin izmenio, potvrdio lokaciju, odobren/odbijen, restauriran.

### 3.1 Nova API funkcija: `lib/admin-api.ts`

```typescript
export interface ActivityLogEntry {
  id: string;
  eventId: string;
  action: string;
  performedBy: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  note: string | null;
  createdAt: string;
}

export async function fetchEventActivityLog(
  eventId: string,
  token: string,
  signal?: AbortSignal,
): Promise<ActivityLogEntry[]> {
  const raw = await adminRequest<unknown[]>(
    `/api/admin/events/${encodeURIComponent(eventId)}/activity-log`,
    { token, signal },
  );
  return (raw ?? []).map(normalizeActivityLogEntry);
}

function normalizeActivityLogEntry(raw: unknown): ActivityLogEntry {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ""),
    eventId: String(r.event_id ?? r.eventId ?? ""),
    action: String(r.action ?? "unknown"),
    performedBy: String(r.performed_by ?? r.performedBy ?? "system"),
    oldValues: (r.old_values ?? r.oldValues ?? null) as Record<string, unknown> | null,
    newValues: (r.new_values ?? r.newValues ?? null) as Record<string, unknown> | null,
    note: typeof (r.note) === "string" ? r.note : null,
    createdAt: String(r.created_at ?? r.createdAt ?? new Date().toISOString()),
  };
}
```

### 3.2 Nova komponenta: `components/admin/event-timeline.tsx`

**Dizajn specifikacija:**

```
┌──────────────────────────────────────────┐
│ 📜 Istorija izmena                       │
├──────────────────────────────────────────┤
│                                          │
│  ● Admin potvrdio lokaciju   pre 2h      │
│  │ admin · Bul. Medijana → 43.32, 21.91 │
│  │                                       │
│  ● Admin izmenio podatke     pre 3h      │
│  │ admin · tip: unknown → police         │
│  │                                       │
│  ● AI obogaćen               pre 5h      │
│  │ sistem · confidence: 85, geo: google  │
│  │                                       │
│  ● Kreiran                   pre 6h      │
│  │ viber · grupa: NIS Info               │
│                                          │
└──────────────────────────────────────────┘
```

**Stilovi za svaku akciju:**

| Akcija | Boja tačke | Ikona |
|--------|----------|-------|
| `approve` | emerald-400 | CheckCircle |
| `reject` | rose-400 | XCircle |
| `update` | amber-400 | PenLine |
| `confirm_location` | cyan-400 | MapPinCheck |
| `re_enrich` | violet-400 | RefreshCw |
| `restore` | blue-400 | RotateCcw |
| `bulk_confirm` | emerald-400 | MapPin |

**Implementacija:**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getAdminToken } from "@/lib/admin-auth";
import { fetchEventActivityLog, type ActivityLogEntry } from "@/lib/admin-api";
import {
  CheckCircle, XCircle, PenLine, MapPinCheck,
  RefreshCw, RotateCcw, MapPin, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EventTimelineProps {
  eventId: string;
}

// Action config map
const ACTION_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  approve: { icon: CheckCircle, color: "text-emerald-400", label: "Odobren" },
  reject: { icon: XCircle, color: "text-rose-400", label: "Odbijen" },
  update: { icon: PenLine, color: "text-amber-400", label: "Izmenjen" },
  confirm_location: { icon: MapPinCheck, color: "text-cyan-400", label: "Lokacija potvrđena" },
  re_enrich: { icon: RefreshCw, color: "text-violet-400", label: "Re-enrich" },
  restore: { icon: RotateCcw, color: "text-blue-400", label: "Restauriran" },
  bulk_confirm: { icon: MapPin, color: "text-emerald-400", label: "Bulk potvrda" },
};

export function EventTimeline({ eventId }: EventTimelineProps) {
  const t = useTranslations("admin");
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;

    const controller = new AbortController();
    fetchEventActivityLog(eventId, token, controller.signal)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [eventId]);

  if (loading) {
    return <div className="animate-pulse h-20 bg-slate-800/50 rounded-lg" />;
  }

  if (logs.length === 0) {
    return (
      <p className="text-xs text-slate-500 italic">
        {t("eventDetail.timeline.empty")}
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertikalna linija */}
      <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-700" />

      {logs.map((log) => {
        const config = ACTION_CONFIG[log.action] ?? {
          icon: Clock, color: "text-slate-400", label: log.action,
        };
        const Icon = config.icon;

        return (
          <div key={log.id} className="relative flex gap-3 py-2.5 pl-1">
            {/* Tačka */}
            <div className={cn("relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 ring-2 ring-slate-800", config.color)}>
              <Icon className="h-3 w-3" />
            </div>

            {/* Sadržaj */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("text-sm font-medium", config.color)}>
                  {config.label}
                </span>
                <span className="text-xs text-slate-500">
                  {formatRelativeTime(log.createdAt)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                {log.performedBy}
                {log.note ? ` · ${log.note}` : ""}
              </p>
              {/* Prikaz promena old → new */}
              {log.oldValues || log.newValues ? (
                <div className="mt-1 rounded bg-slate-800/50 px-2 py-1 text-xs text-slate-300">
                  {renderChangeDiff(log.oldValues, log.newValues)}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderChangeDiff(
  oldVals: Record<string, unknown> | null,
  newVals: Record<string, unknown> | null,
): React.ReactNode {
  const allKeys = new Set([
    ...Object.keys(oldVals ?? {}),
    ...Object.keys(newVals ?? {}),
  ]);

  return (
    <div className="space-y-0.5">
      {[...allKeys].map((key) => {
        const oldV = oldVals?.[key];
        const newV = newVals?.[key];
        if (oldV === newV) return null;
        return (
          <div key={key}>
            <span className="text-slate-500">{key}: </span>
            {oldV !== undefined && (
              <span className="text-rose-400 line-through mr-1">{String(oldV)}</span>
            )}
            {newV !== undefined && (
              <span className="text-emerald-400">{String(newV)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(deltaMs / 1000));
  if (sec < 60) return `pre ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `pre ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `pre ${hr}h`;
  const days = Math.floor(hr / 24);
  return `pre ${days}d`;
}
```

### 3.3 Integracija u Event Detail stranicu

U `admin-event-detail-client.tsx`, dodati novu sekciju ISPOD moderacije:

```tsx
<section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
    {t("eventDetail.timeline.title")}
  </h2>
  <div className="mt-3">
    <EventTimeline eventId={id} />
  </div>
</section>
```

---

## 4. Keyboard Shortcuts

### Cilj
Omogućiti brze admin akcije putem tastature: `Ctrl+S` za save, `Ctrl+Enter` za confirm location, `Escape` za cancel edit mode.

### 4.1 Novi hook: `lib/hooks/use-keyboard-shortcut.ts`

```typescript
"use client";

import { useEffect, useCallback } from "react";

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
};

export function useKeyboardShortcut(
  combo: KeyCombo,
  callback: () => void,
  enabled = true,
) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ne reaguj ako je focus u textarea/input (osim za Escape)
      const tag = (e.target as HTMLElement)?.tagName;
      if (combo.key !== "Escape" && (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")) {
        // Ali za Ctrl+S i Ctrl+Enter — dozvoli i u inputima
        if (!combo.ctrl) return;
      }

      const ctrlMatch = combo.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
      const shiftMatch = combo.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = combo.alt ? e.altKey : !e.altKey;

      if (e.key.toLowerCase() === combo.key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault();
        callback();
      }
    },
    [combo, callback, enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler, enabled]);
}
```

### 4.2 Integracija u Event Detail

U `admin-event-detail-client.tsx`:

```tsx
import { useKeyboardShortcut } from "@/lib/hooks/use-keyboard-shortcut";

// Unutar komponente:
const isEditing = /* ... state koji prati da li je bilo koje polje u edit modu */;

useKeyboardShortcut({ key: "s", ctrl: true }, handleSaveAll, isEditing);
useKeyboardShortcut({ key: "Enter", ctrl: true }, handleConfirmLocation, hasCoordinates);
useKeyboardShortcut({ key: "Escape" }, handleCancelEdit, isEditing);
```

### 4.3 Keyboard hints UI

Na dnu Event Detail stranice, prikazati shortcut hints (suptilno):

```tsx
<footer className="mt-6 flex flex-wrap gap-4 text-xs text-slate-600">
  <span><kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-400">Ctrl+S</kbd> Sačuvaj</span>
  <span><kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-400">Ctrl+Enter</kbd> Potvrdi lokaciju</span>
  <span><kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-400">Esc</kbd> Otkaži</span>
</footer>
```

**Dizajn `<kbd>` elementa:**
- `rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 font-mono text-xs text-slate-400`

---

## 5. Geocoding Cache Browser

### Cilj
Nova admin stranica `/admin/geocoding-cache` sa pregledom svih cache unosa, pretraga, filtriranje po verified statusu, izmena i brisanje.

### 5.1 Nova stranica: `app/[locale]/admin/geocoding-cache/page.tsx`

```tsx
import { GeocodingCacheBrowser } from "@/components/admin/geocoding-cache-browser";

export default function GeocodingCachePage() {
  return <GeocodingCacheBrowser />;
}
```

### 5.2 Nova API funkcija: `lib/admin-api.ts`

```typescript
export interface GeocodingCacheEntry {
  id: string;
  locationText: string;
  normalizedText: string;
  lat: number;
  lng: number;
  isPartial: boolean;
  locationType: string | null;
  formattedAddr: string | null;
  placeId: string | null;
  hitCount: number;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeocodingCacheResponse {
  items: GeocodingCacheEntry[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchGeocodingCache(
  token: string,
  params?: {
    search?: string;
    verified?: "true" | "false";
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
  },
  signal?: AbortSignal,
): Promise<GeocodingCacheResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.verified) query.set("verified", params.verified);
  if (params?.sortBy) query.set("sortBy", params.sortBy);
  if (params?.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const queryStr = query.toString();
  const path = `/api/admin/geocoding-cache${queryStr ? `?${queryStr}` : ""}`;
  const raw = await adminRequest<Record<string, unknown>>(path, { token, signal });

  return {
    items: (Array.isArray(raw.items) ? raw.items : []).map(normalizeCacheEntry),
    total: asNumber(raw.total),
    page: asNumber(raw.page, 1),
    limit: asNumber(raw.limit, 20),
  };
}

export async function updateGeocodingCacheEntry(
  id: string,
  token: string,
  data: { lat?: number; lng?: number; locationText?: string; verified?: boolean; formattedAddr?: string },
): Promise<{ id: string }> {
  return adminRequest(`/api/admin/geocoding-cache/${encodeURIComponent(id)}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export async function deleteGeocodingCacheEntry(
  id: string,
  token: string,
): Promise<{ deleted: boolean }> {
  // DELETE metoda treba proxy support — dodati u route.ts
  return adminRequest(`/api/admin/geocoding-cache/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
}

function normalizeCacheEntry(raw: unknown): GeocodingCacheEntry {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ""),
    locationText: String(r.location_text ?? r.locationText ?? ""),
    normalizedText: String(r.normalized_text ?? r.normalizedText ?? ""),
    lat: Number(r.lat ?? 0),
    lng: Number(r.lng ?? 0),
    isPartial: Boolean(r.is_partial ?? r.isPartial ?? false),
    locationType: typeof r.location_type === "string" ? r.location_type : (typeof r.locationType === "string" ? r.locationType : null),
    formattedAddr: typeof r.formatted_addr === "string" ? r.formatted_addr : (typeof r.formattedAddr === "string" ? r.formattedAddr : null),
    placeId: typeof r.place_id === "string" ? r.place_id : null,
    hitCount: Number(r.hit_count ?? r.hitCount ?? 0),
    verified: Boolean(r.verified ?? false),
    createdAt: String(r.created_at ?? r.createdAt ?? new Date().toISOString()),
    updatedAt: String(r.updated_at ?? r.updatedAt ?? new Date().toISOString()),
  };
}
```

### 5.3 Proširiti API proxy za DELETE metodu

**Fajl:** `app/api/proxy/[...path]/route.ts`

Dodati:
```typescript
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const { path } = await params;
  const backendUrl = `${BACKEND}/api/${path.join("/")}`;

  const res = await fetch(backendUrl, {
    method: "DELETE",
    headers: buildProxyHeaders(request),
    signal: request.signal,
  });

  const resBody = await res.text();
  return new NextResponse(resBody, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
```

Takodje dodati `PATCH`:
```typescript
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const { path } = await params;
  const backendUrl = `${BACKEND}/api/${path.join("/")}`;

  const body = await request.text();
  const res = await fetch(backendUrl, {
    method: "PATCH",
    headers: buildProxyHeaders(request),
    body,
    signal: request.signal,
  });

  const resBody = await res.text();
  return new NextResponse(resBody, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
```

### 5.4 Nova komponenta: `components/admin/geocoding-cache-browser.tsx`

**Layout:**

```
┌──────────────────────────────────────────────────────────────┐
│ Geocoding Cache                                              │
│ Keširane lokacije iz Google Geocoding API-ja                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 🔍 [Pretraga________]  [Verified ▼]  [Sort: Hit Count ▼]   │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Lokacija    | Koordinate | Hits | Verified | Akcije     │  │
│ ├─────────────────────────────────────────────────────────┤  │
│ │ Bul. Med..  | 43.32,21.91| 47   | ✅       | ✏️ 🗑️ 🔗 │  │
│ │ Kalkan      | 43.32,21.90| 23   | ✅       | ✏️ 🗑️ 🔗 │  │
│ │ Pantelej    | 43.33,21.91| 12   | ❌       | ✏️ 🗑️ 🔗 │  │
│ │ ...         |            |      |          |            │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ Prikazano 1-20 od 156 unosa          < 1 2 3 4 5 ... 8 >    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Kolone tabele:**
- **Lokacija** — `location_text` sa `formatted_addr` ispod (if exists) u manjem fontu
- **Koordinate** — `lat, lng` skraćeno na 4 decimale, clickable → Google Maps
- **Hits** — `hit_count` sa opcojim badge-om za top entries
- **Tip** — `location_type` (ROOFTOP, GEOMETRIC_CENTER, ADMIN_CONFIRMED, itd.)
- **Verified** — Badge: ✅ emerald za true, ❌ slate za false
- **Akcije:**
  - ✏️ Edit — otvara inline edit mode (lat, lng, locationText, verified)
  - 🗑️ Delete — sa konfirmacionim dialogom
  - 🔗 Google Maps link

**Verified badge dizajn:**
```tsx
verified
  ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
      <CheckCircle2 className="h-3 w-3" /> Verified
    </span>
  : <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2 py-0.5 text-xs text-slate-400">
      <Circle className="h-3 w-3" /> Unverified
    </span>
```

**Paginacija:**
- Reusable `Pagination` komponenta sa `< 1 2 3 ... N >` pattern
- `rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800`
- Active page: `bg-cyan-500/15 text-cyan-300 border-cyan-500/30`

### 5.5 Dodati u admin sidebar

**Fajl:** `components/admin/admin-sidebar.tsx`

Dodati novi nav item:
```tsx
import { LayoutDashboard, ListTree, MapPin, ShieldCheck } from "lucide-react";

const items = [
  { href: "/admin", key: "sidebar.dashboard", icon: LayoutDashboard },
  { href: "/admin/events", key: "sidebar.events", icon: ListTree },
  { href: "/admin/geocoding-cache", key: "sidebar.geocodingCache", icon: MapPin },  // ← NOVO
];
```

---

## 6. Map View za Event listu

### Cilj
Toggle dugme na admin events stranici koji menja prikaz između tabele i Leaflet mape. Na mapi se vide svi filtrirani eventi sa kliker-markerima.

### 6.1 Nova komponenta: `components/admin/admin-events-map.tsx`

```tsx
"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { AdminEventListItem } from "@/lib/admin-api";

// Dynamic import za Leaflet (SSR not supported)
const MapContainer = dynamic(
  () => import("react-leaflet").then(m => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then(m => m.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then(m => m.Marker),
  { ssr: false },
);
const Popup = dynamic(
  () => import("react-leaflet").then(m => m.Popup),
  { ssr: false },
);

interface AdminEventsMapProps {
  events: AdminEventListItem[];
  onEventClick: (id: string) => void;
}

export function AdminEventsMap({ events, onEventClick }: AdminEventsMapProps) {
  // Filtriraj samo evente sa koordinatama
  const geoEvents = useMemo(
    () => events.filter(e => e.lat != null && e.lng != null),
    [events],
  );

  // Centar: Niš, Srbija
  const center: [number, number] = [43.32, 21.90];

  return (
    <div className="h-[500px] w-full rounded-lg border border-slate-800 overflow-hidden">
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        style={{ background: "#0f172a" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        {geoEvents.map((evt) => (
          <Marker key={evt.id} position={[evt.lat!, evt.lng!]}>
            <Popup>
              <div className="text-xs">
                <p className="font-semibold">{evt.eventType}</p>
                <p>{evt.locationText}</p>
                <p className="text-slate-500">{evt.moderationStatus}</p>
                <button
                  type="button"
                  onClick={() => onEventClick(evt.id)}
                  className="mt-1 text-cyan-500 underline"
                >
                  Detalji →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
```

**Napomena:** Koristiti dark tile layer (`carto dark_all`) za konzistentnost sa admin temom.

### 6.2 Toggle u `admin-events-client.tsx`

```tsx
const [viewMode, setViewMode] = useState<"table" | "map">("table");

// U header sekciji dodati toggle:
<div className="flex items-center gap-1 rounded-lg border border-slate-700 p-0.5">
  <button
    type="button"
    onClick={() => setViewMode("table")}
    className={cn(
      "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
      viewMode === "table"
        ? "bg-cyan-500/15 text-cyan-300"
        : "text-slate-400 hover:text-slate-200"
    )}
  >
    <ListTree className="mr-1 inline h-3.5 w-3.5" />
    Tabela
  </button>
  <button
    type="button"
    onClick={() => setViewMode("map")}
    className={cn(
      "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
      viewMode === "map"
        ? "bg-cyan-500/15 text-cyan-300"
        : "text-slate-400 hover:text-slate-200"
    )}
  >
    <MapIcon className="mr-1 inline h-3.5 w-3.5" />
    Mapa
  </button>
</div>

// Uslovni prikaz:
{viewMode === "table" ? (
  <table>...</table>
) : (
  <AdminEventsMap events={tableRows} onEventClick={(id) => router.push(`/admin/events/${id}`)} />
)}
```

---

## 7. Real-time Admin Updates

### Cilj
Socket.io konekcija u admin panelu koja prima live event-e (novi event, izmena, approve/reject od drugog admina) i automatski osvežava UI.

### 7.1 Novi hook: `lib/hooks/use-admin-realtime.ts`

```typescript
"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { getAdminToken } from "@/lib/admin-auth";

type RealtimeEvent = {
  type: "new_report" | "report_updated" | "report_removed";
  reportId: string;
  payload?: unknown;
};

type AdminRealtimeCallbacks = {
  onNewReport?: (event: RealtimeEvent) => void;
  onReportUpdated?: (event: RealtimeEvent) => void;
  onReportRemoved?: (event: RealtimeEvent) => void;
};

export function useAdminRealtime(callbacks: AdminRealtimeCallbacks) {
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;

    // Konekcija na isti API server
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "https://api.radarpuls.com";
    const socket = io(apiBase, {
      transports: ["websocket", "polling"],
      auth: { token },
    });

    socket.on("event", (data: RealtimeEvent) => {
      switch (data.type) {
        case "new_report":
          callbacksRef.current.onNewReport?.(data);
          break;
        case "report_updated":
          callbacksRef.current.onReportUpdated?.(data);
          break;
        case "report_removed":
          callbacksRef.current.onReportRemoved?.(data);
          break;
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);
}
```

### 7.2 Integracija u Dashboard

**Fajl:** `components/admin/admin-dashboard-client.tsx`

```tsx
import { useAdminRealtime } from "@/lib/hooks/use-admin-realtime";

// U komponenti:
useAdminRealtime({
  onNewReport: () => {
    // Refetch stats i recent events
    void loadData();
  },
  onReportUpdated: () => {
    void loadData();
  },
});
```

### 7.3 Integracija u Events listu

**Fajl:** `components/admin/admin-events-client.tsx`

```tsx
useAdminRealtime({
  onNewReport: () => void loadEvents(),
  onReportUpdated: () => void loadEvents(),
  onReportRemoved: () => void loadEvents(),
});
```

### 7.4 Live indikator u admin header-u

Dodati pulsing zeleni dot u `admin-header.tsx` koji indikuje kada je Socket.io konekcija aktivna:

```tsx
<div className="flex items-center gap-2">
  <span className="relative flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
  </span>
  <span className="text-xs text-slate-500">Live</span>
</div>
```

---

## 8. Dark/Light Mode za Admin

### Cilj
Dodati toggle za dark/light mode u admin panelu koristeći postojeći `ThemeProvider`. Admin panel je trenutno hardkodiran na dark temu.

### 8.1 Novi hook: `lib/hooks/use-admin-theme.ts`

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";

type AdminTheme = "dark" | "light";

export function useAdminTheme() {
  const [theme, setThemeState] = useState<AdminTheme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("rp-admin-theme") as AdminTheme | null;
    setThemeState(stored ?? "dark");
  }, []);

  const setTheme = useCallback((t: AdminTheme) => {
    setThemeState(t);
    localStorage.setItem("rp-admin-theme", t);
    // Staviti CSS klasu na admin container
    document.documentElement.dataset.adminTheme = t;
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}
```

### 8.2 CSS varijable za admin light mode

**Fajl:** `app/globals.css`

Dodati:
```css
/* Admin light theme */
[data-admin-theme="light"] .admin-shell {
  --admin-bg: #f8fafc;        /* slate-50 */
  --admin-surface: #ffffff;    /* white */
  --admin-card: #ffffff;
  --admin-border: #e2e8f0;    /* slate-200 */
  --admin-text: #0f172a;       /* slate-900 */
  --admin-text-secondary: #475569; /* slate-600 */
  --admin-text-muted: #94a3b8; /* slate-400 */
  --admin-accent: #0891b2;     /* cyan-600 */
  --admin-accent-soft: #ecfeff; /* cyan-50 */
}

/* Admin dark theme (default) */
[data-admin-theme="dark"] .admin-shell,
.admin-shell {
  --admin-bg: #020617;         /* slate-950 */
  --admin-surface: #0f172a;    /* slate-900 */
  --admin-card: #0f172a;
  --admin-border: #1e293b;     /* slate-800 */
  --admin-text: #f1f5f9;       /* slate-100 */
  --admin-text-secondary: #94a3b8;
  --admin-text-muted: #64748b;
  --admin-accent: #22d3ee;     /* cyan-400 */
  --admin-accent-soft: rgba(6, 182, 212, 0.15);
}
```

### 8.3 Ažurirati sve admin Tailwind klase

Umesto hardkodiranih `bg-slate-950`, `text-slate-100`, itd. → koristiti CSS varijable:

```
bg-slate-950 → bg-[var(--admin-bg)]
bg-slate-900 → bg-[var(--admin-surface)]
border-slate-800 → border-[var(--admin-border)]
text-slate-100 → text-[var(--admin-text)]
text-slate-400 → text-[var(--admin-text-secondary)]
text-slate-500 → text-[var(--admin-text-muted)]
text-cyan-300 → text-[var(--admin-accent)]
```

**Napomena:** Ovo je obimna promena — SVE admin komponente moraju se ažurirati. Preporučujem refactor u fazama:
1. Najpre kreirati CSS varijable
2. Ažurirati `admin-shell.tsx` (outer container)
3. Ažurirati sidebar, header
4. Ažurirati dashboard, events tabela, event detail
5. Testirati oba moda

### 8.4 Toggle dugme u admin header-u

**Fajl:** `components/admin/admin-header.tsx`

Dodati pored logout dugmeta:
```tsx
import { Moon, Sun } from "lucide-react";
import { useAdminTheme } from "@/lib/hooks/use-admin-theme";

// U komponenti:
const { theme, toggle } = useAdminTheme();

<button
  type="button"
  onClick={toggle}
  className="inline-flex items-center rounded-md border border-[var(--admin-border)] p-1.5 text-[var(--admin-text-secondary)] transition-colors hover:bg-[var(--admin-surface)]"
  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
>
  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
</button>
```

---

## Internacionalizacija — Novi ključevi

### Za sve tri locale fajla (`sr-latn.json`, `sr-cyrl.json`, `en.json`)

Dodati pod `"admin"`:

```json
{
  "sidebar": {
    "geocodingCache": "Geocoding Cache / Keš geokodiranja / Geocoding Cache"
  },
  "eventDetail": {
    "timeline": {
      "title": "Istorija izmena / Историја измена / Change History",
      "empty": "Nema zabeleženih izmena. / Нема забележених измена. / No changes recorded."
    },
    "confirmDialog": {
      "title": "Potvrdite lokaciju / Потврдите локацију / Confirm Location",
      "warning": "Ove koordinate će biti sačuvane kao verifikovani fallback. Svi budući eventi sa tekstom lokacije \"{location}\" će automatski koristiti ove koordinate.",
      "confirm": "Potvrdi lokaciju / Потврди локацију / Confirm Location",
      "cancel": "Otkaži / Откажи / Cancel"
    },
    "shortcuts": {
      "save": "Sačuvaj / Сачувај / Save",
      "confirmLocation": "Potvrdi lokaciju / Потврди локацију / Confirm location",
      "cancel": "Otkaži / Откажи / Cancel"
    }
  },
  "events": {
    "viewMode": {
      "table": "Tabela / Табела / Table",
      "map": "Mapa / Мапа / Map"
    },
    "bulk": {
      "selected": "{count} selektovano / {count} селектовано / {count} selected",
      "approveAll": "Odobri ({count}) / Одобри ({count}) / Approve ({count})",
      "rejectAll": "Odbij ({count}) / Одбиј ({count}) / Reject ({count})",
      "confirmLocations": "Potvrdi lokacije ({count}) / Потврди локације ({count}) / Confirm locations ({count})",
      "reEnrich": "Re-enrich ({count})",
      "clearSelection": "Poništi / Поништи / Clear"
    }
  },
  "geocodingCache": {
    "title": "Geocoding Cache / Геокодирање Кеш / Geocoding Cache",
    "subtitle": "Keširane lokacije iz Google Geocoding API-ja. / ... / Cached locations from Google Geocoding API.",
    "columns": {
      "location": "Lokacija / Локација / Location",
      "coordinates": "Koordinate / Координате / Coordinates",
      "hits": "Pogodci / Погодци / Hits",
      "type": "Tip / Тип / Type",
      "verified": "Verifikovan / Верификован / Verified",
      "actions": "Akcije / Акције / Actions"
    },
    "delete": {
      "confirm": "Da li ste sigurni da želite da obrišete ovaj keš unos?",
      "success": "Keš unos uspešno obrisan.",
      "failed": "Greška pri brisanju keš unosa."
    },
    "edit": {
      "success": "Keš unos uspešno ažuriran.",
      "failed": "Greška pri ažuriranju keš unosa."
    }
  },
  "theme": {
    "switchToLight": "Svetla tema / Светла тема / Light mode",
    "switchToDark": "Tamna tema / Тамна тема / Dark mode"
  },
  "realtime": {
    "connected": "Uživo / Уживо / Live",
    "disconnected": "Offline"
  }
}
```

**NAPOMENA:** Gornje vrednosti razdvojene sa "/" su SAMO prikaz za ovaj plan — u svakom locale fajlu ide samo odgovarajuća vrednost. Agent mora da razdvoji i stavi u odgovarajući fajl.

---

## Kompletni pregled novih fajlova

| Fajl | Opis |
|------|------|
| `components/admin/confirm-location-dialog.tsx` | Modal za potvrdu lokacije |
| `components/admin/bulk-action-toolbar.tsx` | Sticky toolbar za masovne akcije |
| `components/admin/bulk-confirm-candidates.tsx` | Lista kandidata za bulk confirm |
| `components/admin/event-timeline.tsx` | Timeline prikaz activity log-a |
| `components/admin/geocoding-cache-browser.tsx` | CRUD stranica za geocoding cache |
| `components/admin/admin-events-map.tsx` | Leaflet mapa za event listu |
| `app/[locale]/admin/geocoding-cache/page.tsx` | Next.js page za cache browser |
| `lib/hooks/use-keyboard-shortcut.ts` | Hook za keyboard shortcut-ove |
| `lib/hooks/use-admin-realtime.ts` | Hook za Socket.io konekciju |
| `lib/hooks/use-admin-theme.ts` | Hook za admin dark/light toggle |

## Fajlovi koji se menjaju

| Fajl | Promene |
|------|---------|
| `lib/admin-api.ts` | Novi tipovi i API funkcije za: activity log, geocoding cache CRUD, bulk confirm, location aliases, restore event |
| `components/admin/admin-event-detail-client.tsx` | Konfirmacioni dialog integracija, EventTimeline sekcija, keyboard shortcuts, restore dugme |
| `components/admin/admin-events-client.tsx` | Checkbox kolona, bulk toolbar, table/map toggle, realtime hook |
| `components/admin/admin-dashboard-client.tsx` | Realtime hook za live refresh |
| `components/admin/admin-sidebar.tsx` | Novi nav item za geocoding cache |
| `components/admin/admin-header.tsx` | Dark/light toggle dugme, live indikator |
| `components/admin/admin-shell.tsx` | CSS klasa `admin-shell` za temu |
| `app/api/proxy/[...path]/route.ts` | DELETE i PATCH metode za proxy |
| `app/globals.css` | Admin light/dark CSS varijable |
| `messages/sr-latn.json` | Novi i18n ključevi |
| `messages/sr-cyrl.json` | Novi i18n ključevi |
| `messages/en.json` | Novi i18n ključevi |

## Redosled implementacije

1. **API proxy proširenje** — DELETE i PATCH metode (blokira cache browser i editing)
2. **Toast sistem** (iz prethodnog plana — koristi se svuda)
3. **Keyboard shortcuts hook** — `use-keyboard-shortcut.ts`
4. **Konfirmacioni dijalog** — `confirm-location-dialog.tsx` + integracija
5. **Event Timeline** — API funkcija + komponenta + integracija u detail
6. **Bulk Edit mod** — Checkbox-ovi, toolbar, bulk API funkcije
7. **Geocoding Cache Browser** — API funkcije, page, komponenta, sidebar link
8. **Map View** — `admin-events-map.tsx`, toggle u events tabeli
9. **Real-time** — `use-admin-realtime.ts` hook + integracija u dashboard i events
10. **Dark/Light mode** — CSS varijable, hook, toggle, refactor klasa (najobimnije — na kraju)
11. **i18n** — Dodati sve nove ključeve

---

## Zavisnosti između stavki

```
Konfirmacioni dijalog ← Zavisi od: Toast sistema (prethodni plan)
Bulk Edit             ← Zavisi od: API bulk-confirm endpoint (API plan)
Event Timeline        ← Zavisi od: Activity Log tabela i endpoint-i (API plan)
Geocoding Cache       ← Zavisi od: Cache CRUD endpoint-i (API plan), proxy DELETE/PATCH
Map View              ← Nezavisno (samo klijentska komponenta)
Real-time             ← Nezavisno (Socket.io već radi na API-ju)
Dark/Light mode       ← Nezavisno (samo CSS + klijentski state)
Keyboard shortcuts    ← Nezavisno (hook + integracija)
```
