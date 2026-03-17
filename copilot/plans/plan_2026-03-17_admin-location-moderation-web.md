# Plan: Admin Location Moderation & Confirmation — Web Frontend

**Datum:** 2026-03-17  
**Sinhronizovano sa:** `radar-puls-api/copilot/plans/plan_2026-03-17_admin-location-moderation-api.md`

---

## Cilj

Modernizovati admin panel sa:
1. **Prikaz koordinata** i **Google Maps link** za svaki event
2. **Dugme "Potvrdi lokaciju"** — šalje potvrđene koordinate u geocoding cache
3. **Inline editing** svih event podataka (lokacija, tip, opis, sender, koordinate, confidence...)
4. **Status badge-ovi** sa jasnom vizuelnom razlikom: `ai_raw`, `admin_edited`, `admin_confirmed`, `web_submitted`
5. Moderan, profesionalan dizajn konzistentan sa postojećim dark-theme admin UI-jem

---

## Trenutno stanje

- Admin event detail: prikazuje `eventType`, `locationText`, `geoSource`, `confidence`, `moderationStatus`
- **NE prikazuje**: `latitude`, `longitude`, `description`, `senderName`, `editSource`
- **NE linkuje** na Google Maps
- **NE podržava** inline editing (osim approve/reject akcija)
- Admin API klijent (`lib/admin-api.ts`): ima `fetchAdminEventDetail()` ali `AdminEventDetail` nema `editSource`
- Stilovi: Dark theme (slate palette), cyan akcent, emerald/rose za akcije

---

## Faze implementacije

### Faza 1: Proširiti tipove i API klijent

**Fajl:** `lib/admin-api.ts`

1. Dodati `editSource` u `AdminEventDetail` interfejs:
```typescript
export type EditSource = "ai_raw" | "admin_edited" | "admin_confirmed" | "web_submitted";

export interface AdminEventDetail extends AdminEventListItem {
  // ...postojeća polja...
  editSource: EditSource;
  enrichStatus: string | null;
  enrichedAt: string | null;
  enrichAttempts: number;
}
```

2. Dodati `editSource` u `AdminEventListItem`:
```typescript
export interface AdminEventListItem {
  // ...postojeća polja...
  editSource: EditSource;
  lat: number | null;
  lng: number | null;
}
```

3. Nova API funkcija — `updateAdminEvent()`:
```typescript
export async function updateAdminEvent(
  id: string,
  token: string,
  data: {
    eventType?: string;
    locationText?: string;
    senderName?: string;
    description?: string;
    latitude?: number | null;
    longitude?: number | null;
    confidence?: number | null;
    eventTime?: string | null;
    expiresAt?: string | null;
  }
): Promise<{ id: string }> {
  return adminRequest(`/api/admin/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    token,
    body: data,
  });
}
```

4. Nova API funkcija — `confirmEventLocation()`:
```typescript
export async function confirmEventLocation(
  id: string,
  token: string,
  data?: {
    latitude?: number;
    longitude?: number;
    locationText?: string;
    confirmedBy?: string;
  }
): Promise<{ id: string; cached: boolean }> {
  return adminRequest(`/api/admin/events/${encodeURIComponent(id)}/confirm-location`, {
    method: "POST",
    token,
    body: data ?? {},
  });
}
```

5. Proširiti `AdminStats`:
```typescript
export interface AdminStats {
  // ...postojeća polja...
  admin_edited_count: number;
  admin_confirmed_count: number;
  admin_geo_count: number;
}
```

6. Obraditi `edit_source` / `editSource` u `normalizeDetail()` i `normalizeListItem()`

---

### Faza 2: Redizajn Admin Event Detail stranice

**Fajl:** `components/admin/admin-event-detail-client.tsx`

#### Layout (3-sekcije umesto 2):

```
┌──────────────────────────────────────────────────────────────┐
│ < Nazad na listu                     ID: abc-123...          │
│                                      Status Badge            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─── Sirova poruka ──────────┐ ┌─── Parsirani podaci ─────┐ │
│ │                            │ │                           │ │
│ │ [Pun tekst poruke]         │ │ Tip:     🔴 Policija [✏] │ │
│ │                            │ │ Lokacija: Bul. Medijana[✏]│ │
│ │                            │ │ Sender:   Marko123    [✏] │ │
│ │                            │ │ Opis:     Racija...   [✏] │ │
│ │                            │ │ Confidence: 85%       [✏] │ │
│ │                            │ │ Vreme:  14:30         [✏] │ │
│ │                            │ │ Izvor: ai_raw → badge     │ │
│ │                            │ │                           │ │
│ └────────────────────────────┘ └───────────────────────────┘ │
│                                                              │
│ ┌─── Lokacija & Mapa ───────────────────────────────────────┐│
│ │                                                           ││
│ │  📍 Koordinate: 43.3203, 21.8958                          ││
│ │  🔗 Otvori u Google Maps                                  ││
│ │  📌 Geo Source: google  |  Formatted: Bulevar Medijana... ││
│ │                                                           ││
│ │  ┌─────────────────────────────────────────────────┐      ││
│ │  │                                                 │      ││
│ │  │        [Mini Leaflet mapa sa pin-om]            │      ││
│ │  │        (klikabilna za promenu lokacije)         │      ││
│ │  │                                                 │      ││
│ │  └─────────────────────────────────────────────────┘      ││
│ │                                                           ││
│ │  [✅ Potvrdi lokaciju]  [✏️ Izmeni koordinate]             ││
│ │                                                           ││
│ └───────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─── Moderacija ────────────────────────────────────────────┐│
│ │  Napomena: [textarea]                                     ││
│ │  [✅ Odobri]  [❌ Odbij]  [🔄 Re-enrich]                  ││
│ └───────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

#### Komponente za izgraditi:

**A) `EditableField` komponenta** — Reusable inline edit
```
Normalno: prikazuje vrednost + olovka ikona
Klik na olovku: input polje sa save/cancel dugmićima
Tip: text | number | select | datetime
```

Dizajn:
- Normalan: `text-slate-200` + hover ikona `text-slate-500 hover:text-cyan-400`
- Edit mode: `border-cyan-500 bg-slate-950` input + `text-xs` save/cancel linkovi
- Animacija: Framer Motion `layout` tranzicija

**B) `LocationPanel` komponenta** — Koordinate + mapa + Google Maps link
- Prikazuje `latitude`, `longitude` sa 6 decimala
- Google Maps link: `https://www.google.com/maps?q={lat},{lng}` → otvara se u novom tabu
- Mini Leaflet mapa (200px visine) sa markerom na koordinatama
  - Marker je draggable za promenu lokacije
  - Na `dragend` → update koordinata u inline polju
- "Potvrdi lokaciju" dugme:
  - Zeleno, sa MapPin ikonom
  - Poziva `confirmEventLocation()` API
  - Po uspehu: toast notifikacija, badge promeni na `admin_confirmed`
- "Izmeni koordinate" dugme:
  - Cyan outline, otvara manualni input za lat/lng
- Ako nema koordinata: prikazuje placeholder sa tekstom "Lokacija nije geocodirana"

**C) `EditSourceBadge` komponenta** — Vizuelni status badge

| Vrednost | Boja | Ikona | Tekst |
|----------|------|-------|-------|
| `ai_raw` | `bg-violet-500/20 text-violet-300 border-violet-500/30` | Brain | AI parsirano |
| `admin_edited` | `bg-amber-500/20 text-amber-300 border-amber-500/30` | PenLine | Admin izmenio |
| `admin_confirmed` | `bg-emerald-500/20 text-emerald-300 border-emerald-500/30` | CheckCircle2 | Admin potvrdio |
| `web_submitted` | `bg-blue-500/20 text-blue-300 border-blue-500/30` | Globe | Web prijava |

Dizajn: `rounded-full px-2.5 py-0.5 text-xs font-medium border` — chip stil

**D) `GeoSourceBadge` komponenta** — Postojeći geo_source vizuelno

| Vrednost | Boja |
|----------|------|
| `google` | emerald |
| `google_partial` | amber |
| `cache` | cyan |
| `fallback` | slate |
| `admin` | amber |
| `admin_confirmed` | emerald |
| `nominatim` | blue |

---

### Faza 3: Proširiti Events tabelu (listu)

**Fajl:** `components/admin/admin-events-client.tsx`

Dodati kolone:
- **Koordinate** — skraćeno `43.32, 21.90` ili `—` ako nema. Clickable → otvara Google Maps
- **Edit Source** — `EditSourceBadge` komponenta
- **Geo Source** — `GeoSourceBadge` komponenta

Filter proširenja:
- Dodati filter po `editSource`: `ai_raw | admin_edited | admin_confirmed | web_submitted | all`
- Dodati filter po `enrichStatus`: `pending | enriched | failed | all`

Dizajn:
- Sticky header
- Sortiranje po created_at (default desc), po confidence, po editSource
- Hover red: `hover:bg-slate-800/50` za bolju interaktivnost

---

### Faza 4: Proširiti Dashboard statistike

**Fajl:** `components/admin/admin-dashboard-client.tsx`

Dodati nove stat kartice:
- **Admin izmenio** — `admin_edited_count` (amber boja, PenLine ikona)
- **Admin potvrdio** — `admin_confirmed_count` (emerald boja, MapPinCheck ikona)
- **Admin geo** — `admin_geo_count` (cyan boja, MapPin ikona)

Raspored: Umesto 4 kartice u redu → 2 reda × 4 kartice (responsive grid):
```
Red 1: Ukupno | Na čekanju | Odobreno | Odbijeno
Red 2: AI parsiranih | Admin izmenjeno | Admin potvrđeno | Admin geo
```

---

### Faza 5: Internacionalizacija (i18n)

**Fajlovi:** `messages/sr-latn.json`, `messages/sr-cyrl.json`, `messages/en.json`

Dodati ključeve:

```json
{
  "admin": {
    "eventDetail": {
      "fields": {
        "latitude": "Geografska širina",
        "longitude": "Geografska dužina",
        "coordinates": "Koordinate",
        "editSource": "Izvor podataka",
        "enrichStatus": "Status obogaćivanja",
        "senderName": "Pošiljalac",
        "description": "Opis",
        "eventTime": "Vreme događaja",
        "expiresAt": "Ističe"
      },
      "location": {
        "title": "Lokacija i mapa",
        "openGoogleMaps": "Otvori u Google Maps",
        "confirmLocation": "Potvrdi lokaciju",
        "editCoordinates": "Izmeni koordinate",
        "noCoordinates": "Lokacija nije geocodirana",
        "confirmSuccess": "Lokacija uspešno potvrđena i sačuvana u keš",
        "confirmFailed": "Greška pri potvrđivanju lokacije"
      },
      "editSource": {
        "ai_raw": "AI parsiranje",
        "admin_edited": "Admin izmenio",
        "admin_confirmed": "Admin potvrdio lokaciju",
        "web_submitted": "Web prijava"
      },
      "editing": {
        "save": "Sačuvaj",
        "cancel": "Otkaži",
        "saveSuccess": "Uspešno sačuvano",
        "saveFailed": "Greška pri čuvanju"
      }
    },
    "stats": {
      "adminEdited": "Admin izmenjeno",
      "adminConfirmed": "Admin potvrđeno",  
      "adminGeo": "Admin geokodiranja"
    },
    "filters": {
      "editSource": "Izvor podataka",
      "enrichStatus": "Status obogaćivanja",
      "all": "Svi"
    }
  }
}
```

---

### Faza 6: Toast notifikacija sistem

**Novi fajl:** `components/ui/toast.tsx`

Minimalni toast sistem za admin:
- Pozicija: gornji desni ugao
- Tipovi: success (emerald), error (rose), info (cyan)
- Auto-dismiss: 4 sekunde
- Animacija: Framer Motion slide in/out
- Koristi se za: confirm-location success/error, save success/error

Implementacija: React context + portal, bez eksterne biblioteke.

---

## Dizajn smernice

### Paleta boja (dark theme — proširenje postojećeg)

```
Pozadina:     slate-950 (#020617)
Površina:     slate-900 (#0f172a)
Karta:        slate-900 sa slate-800 borderom
Tekst:        slate-100 (#f1f5f9)
Sekundarni:   slate-400 (#94a3b8)
Muted:        slate-500 (#64748b)
Border:       slate-800 (#1e293b)
Akcent:       cyan-400 (#22d3ee) / cyan-500 (#06b6d4)
Uspeh:        emerald-500 (#10b981) / emerald-600 (#059669)
Greška:       rose-500 (#f43f5e) / rose-600 (#e11d48)
Upozorenje:   amber-400 (#fbbf24)
AI badge:     violet-400 (#a78bfa)
```

### Tipografija
- Naslovi: `font-semibold text-slate-100`
- Labele: `text-xs uppercase tracking-[0.14em] text-slate-400`
- Vrednosti: `text-sm text-slate-200`
- Badge: `text-xs font-medium`

### Interakcije
- Hover stanja na svim interaktivnim elementima
- Focus ring: `focus:ring-2 focus:ring-cyan-500/40`
- Disabled stanje: `opacity-60 cursor-not-allowed`
- Tranzicije: `transition-colors duration-150`

### Responsive
- Desktop: Dve kolone za parsed data + raw message
- Tablet: Single column, lokacija panel ispod
- Mobile: Full width, stackovano

---

## Fajlovi koji se menjaju

| Fajl | Vrsta promene |
|------|--------------|
| `lib/admin-api.ts` | Novi tipovi, nove API funkcije, prošireni normalizer-i |
| `components/admin/admin-event-detail-client.tsx` | Potpuni redizajn sa inline editing, lokacija panel, novi layout |
| `components/admin/admin-events-client.tsx` | Nove kolone, filteri, clickable koordinate |
| `components/admin/admin-dashboard-client.tsx` | Nove stat kartice |
| `components/admin/editable-field.tsx` | **Novi fajl** — reusable inline edit komponenta |
| `components/admin/location-panel.tsx` | **Novi fajl** — koordinate, mapa, Google Maps link |
| `components/admin/edit-source-badge.tsx` | **Novi fajl** — edit source status badge |
| `components/admin/geo-source-badge.tsx` | **Novi fajl** — geo source badge |
| `components/ui/toast.tsx` | **Novi fajl** — toast notifikacije |
| `messages/sr-latn.json` | Novi i18n ključevi |
| `messages/sr-cyrl.json` | Novi i18n ključevi |
| `messages/en.json` | Novi i18n ključevi |

---

## Predlozi za poboljšanje

1. **Konfirmacioni dijalog** — Pre "Potvrdi lokaciju" prikazati modal sa pregledom šta će se desiti: "Koordinate 43.32, 21.90 za lokaciju 'Bulevar Medijana' će biti sačuvane kao verifikovani fallback. Budući eventi sa istim tekstom lokacije će automatski koristiti ove koordinate."

2. **Bulk edit mod** — Checkbox-ovi u tabeli + toolbar za masovne akcije (approve all, confirm locations, change type).

3. **Event history/changelog** — Timeline koji prikazuje sve izmene eventa: kreiran → AI obogaćen → admin izmenio → admin potvrdio lokaciju.

4. **Keyboard shortcuts** — `Ctrl+S` za save u edit modu, `Ctrl+Enter` za confirm location, `Escape` za cancel.

5. **Geocoding cache browser** — Nova admin stranica `/admin/geocoding-cache` sa pregledom svih cache unosa, mogućnošću brisanja ili izmene.

6. **Map view za event listu** — Toggle između table/map prikaza evenata. Na mapi se vide svi eventi sa markerima, klikabilnim za detalje.

7. **Real-time admin updates** — Socket.io konekcija u admin panelu za live update kada drugi admin menja event ili kada stigne novi event.

8. **Dark/Light mode za admin** — Trenutno je samo dark. Dodati toggle za light mode koristeći postojeći ThemeProvider.

---

## Redosled implementacije (predlog)

1. **API plan prvo** — Migracija + novi endpoint-i + prošireni DTO-i
2. **Web Faza 1** — Tipovi i API klijent (brzo, ne zahteva UI)
3. **Web Faza 2** — Event detail redizajn (najsloženije, najveći uticaj)
4. **Web Faza 3** — Events tabela proširenje
5. **Web Faza 4** — Dashboard statistike
6. **Web Faza 5** — i18n (paralelno sa Fazom 2-4)
7. **Web Faza 6** — Toast notifikacije (koristi se u Fazi 2, ali može stub prvo)
