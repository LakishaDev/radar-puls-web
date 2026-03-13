# Phase 7 — Potpuni upgrade: Raw message, Push notifikacije, Live tracking, Zvukovi, Emoji, Raspored, Ikonice

**Datum**: 13. mart 2026  
**Status**: U TOKU — delimično implementirano  
**Autor**: Copilot (na zahtev Lakisha)

**Ažurirano (13. mart 2026)**:
- Implementirano: sekcija 1 (rawMessage u popup/feed + admin detail + admin lista)
- Implementirano: sekcija 5 (zvukovi: `use-sound`, toggle, `localStorage`, WS hook)
- Implementirano: sekcija 6 (live tracking + Haversine proximity alert + vibracija/notifikacija)
- Implementirano: sekcija 7 (custom SVG set i zamena emoji markera na mapi/feed-u)

---

## Sadržaj

1. [Raw message prikaz svuda](#1-raw-message-prikaz-svuda)
2. [Web Push notifikacije (popravka + upgrade)](#2-web-push-notifikacije)
3. [Vreme isticanja — 1 sat](#3-vreme-isticanja--1-sat)
4. [Raspored sajta — mapa prioritet](#4-raspored-sajta--mapa-prioritet)
5. [Custom zvukovi upozorenja](#5-custom-zvukovi-upozorenja)
6. [Live tracking lokacije + auto-upozorenje (200–300m)](#6-live-tracking-lokacije--auto-upozorenje)
7. [Custom emoji alati](#7-custom-emoji-alati)
8. [Ikonice na svim mestima gde mogu da se ubace](#8-ikonice-svuda)
9. [Dodatni predlozi i opcije](#9-dodatni-predlozi-i-opcije)
10. [Redosled implementacije](#10-redosled-implementacije)

---

## 1. Raw message prikaz svuda

### Problem
Trenutno se `rawMessage` ne prikazuje nigde na javnoj mapi, samo na admin panelu. Korisnici ne vide originalnu prijavu.

### Šta treba uraditi

#### 1.1 Map popup (marker klik)
**Fajl**: `components/landing/map-client.tsx` — `<Popup>` blok (~linija 815–850)

Dodati `rawMessage` blok **iznad** opisa (`description`):

```tsx
{report.rawMessage ? (
  <div className="mt-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Originalna prijava</p>
    <p className="mt-0.5 text-xs italic text-slate-600">"{report.rawMessage}"</p>
  </div>
) : null}
{report.description ? (
  <p className="mt-1 text-xs text-slate-500">{report.description}</p>
) : null}
```

#### 1.2 Sidebar feed lista
**Fajl**: `components/landing/map-client.tsx` — feed `<li>` (~linija 880–910)

Promeniti red prikaza u sidebar kartici:

```tsx
{/* Lokacija */}
<p className="mt-0.5 text-[11px] leading-4 text-[var(--rp-ink-soft)]">{report.locationText}</p>
{/* Raw message — NOVO */}
{report.rawMessage ? (
  <p className="mt-0.5 truncate text-[11px] italic text-[var(--rp-accent)]">"{report.rawMessage}"</p>
) : null}
{/* Opis (fallback ako nema raw) */}
<p className="mt-0.5 text-[10px] text-[var(--rp-ink-soft)]">
  {report.description ?? t("feed.noDescription")}
</p>
```

#### 1.3 Admin event detail
**Fajl**: `components/admin/admin-event-detail-client.tsx`

Proveriti da se `rawMessage` prikazuje prominentno (vec postoji). Bez promene ako je OK.

#### 1.4 Admin events lista (tabela)
**Fajl**: `components/admin/admin-events-client.tsx`

Dodati kolonu `Raw Message` (truncated na 60 chars) u tabelu. Staviti je posle kolone "Location":

```tsx
<th>Raw Message</th>
...
<td className="max-w-[200px] truncate text-xs italic">
  {event.rawMessage ?? "—"}
</td>
```

#### 1.5 i18n ključevi
**Fajlovi**: `messages/sr-latn.json`, `messages/sr-cyrl.json`, `messages/en.json`

Dodati ključeve:
```json
{
  "map": {
    "rawMessage": {
      "label": "Originalna prijava",
      "labelEn": "Original report"
    }
  }
}
```

---

## 2. Web Push notifikacije

### Problem
Push notifikacija setup postoji ali ima probleme:
- Service worker ikona pokazuje na `/manifest.json` umesto na pravu ikonu
- Nema zvuka, nema akcija, nema badge/tag
- Nema notifikacije klikom (ne otvara app)
- Korisnik ne zna šta je tačno prijavljeno

### Šta treba uraditi

#### 2.1 Dodati pravu PWA ikonu
**Fajl**: `public/manifest.json`

Dodati ikone raznih veličina:
```json
{
  "icons": [
    {"src": "/images/icon-72.png", "sizes": "72x72", "type": "image/png"},
    {"src": "/images/icon-96.png", "sizes": "96x96", "type": "image/png"},
    {"src": "/images/icon-128.png", "sizes": "128x128", "type": "image/png"},
    {"src": "/images/icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "/images/icon-512.png", "sizes": "512x512", "type": "image/png"}
  ]
}
```

**Kreirati** ikonice u `public/images/` — generisati iz SVG logoa ili napraviti novi

#### 2.2 Popraviti sw.js — kompletna notifikacija
**Fajl**: `public/sw.js`

```js
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "Radar Puls",
    body: "Stigla je nova prijava u tvojoj zoni.",
    url: "/sr-latn/mapa",
  };

  try {
    if (event.data) {
      const data = event.data.json();
      payload = { ...payload, ...data };
    }
  } catch {
    // zadrži default
  }

  const options = {
    body: payload.body,
    icon: "/images/icon-192.png",
    badge: "/images/icon-96.png",
    vibrate: [200, 100, 200],
    tag: "radar-puls-alert",
    renotify: true,
    data: { url: payload.url || "/sr-latn/mapa" },
    actions: [
      { action: "open", title: "Otvori mapu" },
      { action: "dismiss", title: "Zatvori" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "Radar Puls", options)
  );
});

// Klik na notifikaciju otvara mapu
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/sr-latn/mapa";

  if (event.action === "dismiss") return;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/mapa") && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
```

#### 2.3 Push payload na backend strani
Potrebno je da backend šalje push payload sa raw message-om najnovije prijave:

```json
{
  "title": "🚨 Radar Puls — Nova prijava!",
  "body": "📡 Radar na Bulevaru Nemanjića — \"radar na keju kod mosta\"",
  "url": "/sr-latn/mapa"
}
```

**NAPOMENA**: Ovo zahteva backend promenu — poslati push sa rawMessage + locationText + eventType. Ako backend trenutno ne šalje push-ove, onda je potrebno:
1. Ugraditi `web-push` NPM paket na backend
2. Na svaki novi approved event, slati push svim pretplaćenim korisnicima
3. Payload: `{ title: emoji + "Radar Puls", body: rawMessage || locationText, url: "/sr-latn/mapa" }`

#### 2.4 WebSocket → browser Notification (fallback dok backend ne podržava push)
**Fajl**: `components/landing/map-client.tsx` — ws.onmessage handler

Dodati browser notification kad stigne novi izveštaj preko WebSocket-a:

```tsx
if (kind === "new_report" && payload) {
  setReports((current) => [payload, ...current.filter((item) => item.id !== payload.id)]);

  // Browser notification za nove izveštaje
  if (Notification.permission === "granted") {
    const emoji = markerConfig[payload.eventType]?.emoji ?? "📢";
    new Notification(`${emoji} Radar Puls`, {
      body: payload.rawMessage || payload.locationText || "Nova prijava",
      icon: "/images/icon-192.png",
      tag: `report-${payload.id}`,
    });
  }
}
```

---

## 3. Vreme isticanja — 1 sat

### Problem
Trenutno je default expiry 2 sata (`resolveExpiry` — linija ~233).

### Šta treba uraditi

**Fajl**: `components/landing/map-client.tsx`

```diff
function resolveExpiry(report: MapReport): string {
  if (report.expiresAt) {
    return report.expiresAt;
  }
- return new Date(new Date(report.createdAt).getTime() + 2 * 60 * 60 * 1000).toISOString();
+ return new Date(new Date(report.createdAt).getTime() + 1 * 60 * 60 * 1000).toISOString();
}
```

Promena: `2 * 60 * 60 * 1000` → `1 * 60 * 60 * 1000` (1 sat)

**Opciono**: Dodati konfigurabilni constant:
```tsx
const DEFAULT_EXPIRY_MS = 60 * 60 * 1000; // 1 sat
```

---

## 4. Raspored sajta — mapa prioritet

### Problem
Mapa je trenutno na 6. poziciji (ispod countdown-a i testimonials). Treba da bude odmah posle hero-a.

### Šta treba uraditi

**Fajl**: `app/[locale]/page.tsx`

Novi redosled:

```tsx
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--rp-bg)] text-[var(--rp-ink)]">
      <SiteNavbar />
      <HeroSection />
      <MapSection />          {/* ← POMEREN NA 2. POZICIJU */}
      <ContentSections />
      <CountdownSection />
      <TestimonialsSection />
      <NewsletterSection />
      <FaqSection />
      <DownloadCtaSection />
      <SiteFooter />
    </main>
  );
}
```

### Opcija B: Mapa u hero sekciju (full-width)
Ako želiš još agresivniji pristup, mapa može biti DÉO hero-a — split layout:
- Levo: CTA + tekst
- Desno: live mapa (umesto phone mockup-a)

**Preporuka**: Opcija A (mapa odmah ispod hero-a) — najjednostavnije, ne remeti hero CTA.

---

## 5. Custom zvukovi upozorenja

### Pregled alata

| Biblioteka | Veličina | Opis | Preporuka |
|-----------|---------|------|-----------|
| **use-sound** | ~1kb + 9kb async (howler) | React hook za zvukove, wraper oko Howler.js | ✅ **PREPORUKA #1** — najlakše za React |
| **howler.js** | ~7kb gzip | Direktan audio library, nema React dependency | ✅ Odlično ako hoćeš veću kontrolu |
| **Tone.js** | ~5.4MB unpacked | Full audio framework za sintezu | ❌ Prevelik za alertne zvukove |
| **Web Audio API** (native) | 0kb | Browser API, nema dependency | ⚠️ Može, ali više koda za pisanje |

### Preporuka: `use-sound` (wraper oko Howler.js)

#### 5.1 Instalacija
```bash
npm install use-sound
npm install -D @types/howler
```

#### 5.2 Zvučni fajlovi
Kreirati folder `public/sounds/` sa zvukovima:

```
public/sounds/
  alert-police.mp3        # Kratki beep za policiju (0.5–1s)
  alert-radar.mp3         # Radar upozorenje (distinktivan ton)
  alert-checkpoint.mp3    # Checkpoint zvuk
  alert-accident.mp3      # Opasnost/accident
  alert-traffic.mp3       # Saobraćaj
  alert-default.mp3       # Generički alert
  alert-proximity.mp3     # Blizina radara (urgentni zvuk)
```

**Gde naći besplatne zvukove**:
- [Freesound.org](https://freesound.org) — besplatni soundovi, CC licenca
- [Pixabay Sound Effects](https://pixabay.com/sound-effects/) — royalty-free
- [Mixkit](https://mixkit.co/free-sound-effects/) — besplatni zvukovi
- [Zapsplat](https://www.zapsplat.com) — profesionalni zvukovi
- [SoundBible](https://soundbible.com) — javni domen zvukovi

**Preporučeni zvukovi za svaki tip**:
- 🚨 police: Kratki siren zvuk (1 beep, 0.5s)
- 📡 radar: Elektronski ping (kao detector)
- 🚧 checkpoint: Dvojni beep
- 💥 accident: Urgentni alarma ton
- 🚗 traffic: Soft notification
- ⚠️ proximity: Rastuća urgencija (3 brza beep-a)

#### 5.3 Sound hook
**Kreirati fajl**: `lib/hooks/use-alert-sound.ts`

```tsx
"use client";

import useSound from "use-sound";

type AlertType = "police" | "radar" | "checkpoint" | "accident" | "traffic_jam" | "proximity" | "default";

const SOUND_MAP: Record<AlertType, string> = {
  police: "/sounds/alert-police.mp3",
  radar: "/sounds/alert-radar.mp3",
  checkpoint: "/sounds/alert-checkpoint.mp3",
  accident: "/sounds/alert-accident.mp3",
  traffic_jam: "/sounds/alert-traffic.mp3",
  proximity: "/sounds/alert-proximity.mp3",
  default: "/sounds/alert-default.mp3",
};

export function useAlertSound(type: AlertType = "default") {
  const [play] = useSound(SOUND_MAP[type], {
    volume: 0.7,
    interrupt: true,
  });

  return play;
}
```

#### 5.4 Integracija u map-client
Dodati u `ws.onmessage` kad stiže nova prijava:

```tsx
// Pušten zvuk za novu prijavu
if (kind === "new_report" && payload && soundEnabled) {
  playAlertSound(payload.eventType);
}
```

#### 5.5 Sound toggle dugme
Dodati Mute/Unmute dugme u toolbar mapy sa ikonom zvučnika:

```tsx
<button onClick={() => setSoundEnabled(!soundEnabled)}>
  {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
</button>
```

#### 5.6 localStorage persistencija za sound preference
```tsx
const [soundEnabled, setSoundEnabled] = useState(() => {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("rp_sound") !== "off";
});

useEffect(() => {
  localStorage.setItem("rp_sound", soundEnabled ? "on" : "off");
}, [soundEnabled]);
```

---

## 6. Live tracking lokacije + auto-upozorenje

### Problem
Trenutno postoji samo jednosmerna lokacija (`getCurrentPosition`). Nema kontinualnog praćenja i automatskog upozorenja.

### Šta treba uraditi

#### 6.1 Hook za live tracking
**Kreirati fajl**: `lib/hooks/use-live-location.ts`

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface LiveLocationState {
  position: [number, number] | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  error: string | null;
  isTracking: boolean;
}

export function useLiveLocation() {
  const [state, setState] = useState<LiveLocationState>({
    position: null,
    accuracy: null,
    heading: null,
    speed: null,
    error: null,
    isTracking: false,
  });

  const watchIdRef = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: "Geolokacija nije podržana" }));
      return;
    }

    setState((prev) => ({ ...prev, isTracking: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          position: [pos.coords.latitude, pos.coords.longitude],
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          error: null,
          isTracking: true,
        });
      },
      (err) => {
        setState((prev) => ({ ...prev, error: err.message, isTracking: false }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 5_000,
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((prev) => ({ ...prev, isTracking: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { ...state, startTracking, stopTracking };
}
```

#### 6.2 Haversine distanca za proximity detekciju
**Dodati u**: `lib/geo-utils.ts`

```tsx
/** Haversine razdaljina u metrima */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6_371_000; // Radijus Zemlje u metrima
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

#### 6.3 Proximity alert logika
**Fajl**: `components/landing/map-client.tsx`

```tsx
const PROXIMITY_RADIUS_M = 300; // metar
const ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minuta cooldown po radaru

const alertedRef = useRef<Map<string, number>>(new Map());

useEffect(() => {
  if (!liveLocation.position || !liveLocation.isTracking) return;

  const [userLat, userLng] = liveLocation.position;

  for (const report of filteredReports) {
    const distance = haversineDistance(userLat, userLng, report.lat, report.lng);
    if (distance > PROXIMITY_RADIUS_M) continue;

    const lastAlerted = alertedRef.current.get(report.id) ?? 0;
    if (Date.now() - lastAlerted < ALERT_COOLDOWN_MS) continue;

    alertedRef.current.set(report.id, Date.now());

    // Zvučno upozorenje
    playProximityAlert();

    // Browser notifikacija
    if (Notification.permission === "granted") {
      const emoji = markerConfig[report.eventType]?.emoji ?? "⚠️";
      new Notification(`${emoji} UPOZORENJE — ${Math.round(distance)}m`, {
        body: report.rawMessage || report.locationText,
        icon: "/images/icon-192.png",
        tag: `proximity-${report.id}`,
        requireInteraction: true,
      });
    }

    // Vibration API
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 300]);
    }
  }
}, [liveLocation.position, filteredReports]);
```

#### 6.4 UI za live tracking
Dodati toggle dugme u toolbar mapy:

```tsx
<button
  onClick={() => {
    if (liveLocation.isTracking) {
      liveLocation.stopTracking();
    } else {
      liveLocation.startTracking();
    }
  }}
  className={cn(
    "rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
    liveLocation.isTracking
      ? "border-emerald-500 bg-emerald-50 text-emerald-700 animate-pulse"
      : "border-[var(--rp-border)] text-[var(--rp-ink-soft)] hover:bg-[var(--rp-surface)]"
  )}
>
  <Navigation size={12} className="mr-1 inline" />
  {liveLocation.isTracking ? "Tracking ON" : "Live praćenje"}
</button>
```

#### 6.5 Vizuelni prikaz na mapi
Kad je tracking aktivan, korisnik vidi:
- **Plavi krug** sa animiranom pulsacijom (accuracy radius)
- **Smer kretanja** (heading arrow)
- **Radius upozorenja** (300m providni krug)

```tsx
{liveLocation.isTracking && liveLocation.position ? (
  <>
    <CircleMarker
      center={liveLocation.position}
      radius={8}
      pathOptions={{color: "#2563EB", fillColor: "#60A5FA", fillOpacity: 0.9, weight: 3}}
    />
    <Circle
      center={liveLocation.position}
      radius={PROXIMITY_RADIUS_M}
      pathOptions={{color: "#2563EB", fillColor: "#60A5FA", fillOpacity: 0.08, weight: 1, dashArray: "5,5"}}
    />
  </>
) : null}
```

#### 6.6 Opciono: Podešavanja radijusa
Dodati slider za radijus upozorenja (200–500m):

```tsx
<input
  type="range"
  min={200}
  max={500}
  step={50}
  value={proximityRadius}
  onChange={(e) => setProximityRadius(Number(e.target.value))}
/>
<span>{proximityRadius}m</span>
```

---

## 7. Custom emoji alati

### Problem
Trenutno se koriste Unicode emoji (👮📡🚧💥🚗❓) koji izgledaju različito na različitim platformama.

### Opcije

| Opcija | Opis | Bundle size | Preporuka |
|--------|------|-------------|-----------|
| **A) Twemoji (Twitter emoji)** | SVG/PNG emoji set, konsistentni na svim platformama | ~50KB za korišćene | ✅ **PREPORUKA** |
| **B) emoji-mart** | Full emoji picker sa custom emoji support | ~200KB + data | ⚠️ Prevelik za samo markere |
| **C) Noto Emoji (Google)** | SVG set, moderan izgled | ~50KB za korišćene | ✅ Dobra alternativa |
| **D) Fluentui Emoji (Microsoft)** | 3D i flat emoji | ~50KB za korišćene | ✅ Jedinstven izgled |
| **E) OpenMoji** | Otvoreni emoji set | ~50KB za korišćene | ⚠️ Manje poliran |
| **F) Custom SVG ikonice** | Potpuno prilagođene | ~20KB | ✅ Potpuna kontrola |

### Preporuka: Twemoji SVG + Custom SVG kao fallback

#### 7.1 Pristup: Statički SVG fajlovi

Ne trebamo ceo emoji-mart za naše potrebe. Trebamo samo 6–8 ikonica.

**Kreirati folder**: `public/images/markers/`

```
public/images/markers/
  police.svg      # Policajac/sirena
  radar.svg       # Radar/antena
  checkpoint.svg  # Kontrolna tačka
  accident.svg    # Opasnost/sudar
  traffic.svg     # Saobraćaj/gužva
  unknown.svg     # Upitnik
  user.svg        # Korisnik lokacija
```

**Opcija A — Twemoji**:
Download the specific emojis we need from https://github.com/twitter/twemoji (MIT license):
- 👮 → `1f46e.svg`
- 📡 → `1f4e1.svg`
- 🚧 → `1f6a7.svg`
- 💥 → `1f4a5.svg`
- 🚗 → `1f697.svg`
- ❓ → `2753.svg`

Preimenovati u naše nazive i staviti u `public/images/markers/`.

**Opcija B — Custom SVG design**:
Dizajnirati potpuno custom ikonice u brending bojama:
- Policija: Plava sirena
- Radar: Narandžasti radar/speed camera
- Checkpoint: Plavi štit
- Accident: Crveni trougao
- Traffic: Zeleni semafori
- Unknown: Sivi upitnik

#### 7.2 Ažurirati marker config

```tsx
const markerConfig: Record<MapEventType, {bg: string; border: string; emoji: string; icon: string}> = {
  police:      {bg: "#DC2626", border: "#FCA5A5", emoji: "👮", icon: "/images/markers/police.svg"},
  radar:       {bg: "#D97706", border: "#FCD34D", emoji: "📡", icon: "/images/markers/radar.svg"},
  checkpoint:  {bg: "#2563EB", border: "#93C5FD", emoji: "🚧", icon: "/images/markers/checkpoint.svg"},
  accident:    {bg: "#7C3AED", border: "#C4B5FD", emoji: "💥", icon: "/images/markers/accident.svg"},
  traffic_jam: {bg: "#059669", border: "#6EE7B7", emoji: "🚗", icon: "/images/markers/traffic.svg"},
  unknown:     {bg: "#6B7280", border: "#D1D5DB", emoji: "❓", icon: "/images/markers/unknown.svg"},
};
```

#### 7.3 Ažurirati createMarkerIcon

```tsx
function createMarkerIcon(type: MapEventType) {
  const cfg = markerConfig[type];
  return L.divIcon({
    html: `<div style="
      background:${cfg.bg};
      width:40px;height:40px;
      border-radius:50%;
      border:2.5px solid ${cfg.border};
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 10px rgba(0,0,0,0.3);
      cursor:pointer;
    "><img src="${cfg.icon}" width="22" height="22" alt="" style="filter:brightness(0) invert(1);" /></div>`,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
  });
}
```

#### 7.4 Opcija: emoji-mart za report form
Ako u budućnosti korisnici mogu birati sopstvene emoji u prijavama, onda instalirati emoji-mart:

```bash
npm install emoji-mart @emoji-mart/data @emoji-mart/react
```

**Koristiti samo** u report form-u kao opcioni picker, ne za markere.

**NAPOMENA**: Ovo sada nije neophodno. Preporučujem da se uradi u kasnijoj fazi.

---

## 8. Ikonice svuda

### Problem
Mnogi elementi UI-ja nemaju ikonice. Koristimo `lucide-react` (već instaliran).

### Gde dodati ikonice

#### 8.1 Map toolbar (filter bar)
Trenutno imamo samo tekst u dugmadima. Dodati ikonice:

```tsx
import {
  MapPin, Clock, Eye, Flame, Navigation, Bell, BellOff,
  Plus, Volume2, VolumeX, LocateFixed, Crosshair,
  ThumbsUp, ThumbsDown, AlertTriangle, Shield, Radio,
  Car, Construction, HelpCircle, Send
} from "lucide-react";

// Primeri:
// "Moja lokacija" dugme → <LocateFixed size={12} className="mr-1" />
// "Prijavi" dugme → <Plus size={12} className="mr-1" />
// "Obavesti me" dugme → <Bell size={12} className="mr-1" />
// "Markers" mode → <MapPin size={12} className="mr-1" />
// "Heatmap" mode → <Flame size={12} className="mr-1" />
// "Live praćenje" → <Navigation size={12} className="mr-1" />
// "Zvuk on/off" → <Volume2 size={12} /> / <VolumeX size={12} />
```

#### 8.2 Feed sidebar
```tsx
// Svakom tipu dodati ikonu pored emoji-a:
{markerConfig[report.eventType].emoji} → dodati i lucide ikonu za konzistentnost
// Lokacija: <MapPin size={10} className="mr-0.5 inline" />
// Vreme: <Clock size={10} className="mr-0.5 inline" />
// Confidence: <Shield size={10} className="mr-0.5 inline" />
```

#### 8.3 Marker popup
```tsx
// Dodati ikonice:
// Lokacija → <MapPin size={12} className="mr-1 inline text-slate-400" />
// Vreme → <Clock size={12} className="mr-1 inline text-slate-400" />
// Glasanje → <ThumbsUp size={12} /> / <ThumbsDown size={12} />
```

#### 8.4 Type filter komponenta
**Fajl**: `components/map/type-filter.tsx`

Dodati ikonice ispred svakog tipa:

```tsx
const typeIcons: Record<MapEventType, React.ReactNode> = {
  police:      <Shield size={12} />,
  radar:       <Radio size={12} />,
  checkpoint:  <Construction size={12} />,
  accident:    <AlertTriangle size={12} />,
  traffic_jam: <Car size={12} />,
  unknown:     <HelpCircle size={12} />,
};
```

#### 8.5 Time filter komponenta
**Fajl**: `components/map/time-filter.tsx`

Dodati `<Clock size={12} />` pored svakog vremenskog filtera.

#### 8.6 Report form
```tsx
// Lokacija input → <MapPin size={14} />
// Lat/Lng → <Crosshair size={14} />
// Opis → <FileText size={14} />
// Submit → <Send size={14} />
```

#### 8.7 Hero sekcija
**Fajl**: `components/landing/hero-section.tsx`

Na mestima gde stoji tekst bez ikone, dodati:
- Download dugmad: Već imaju ikone ✅
- Live badge: dodati `<Radio size={14} className="animate-pulse" />`

#### 8.8 Navbar
**Fajl**: `components/landing/site-navbar.tsx`

- Mapa link → `<MapPin size={14} />`
- Statistika → `<BarChart2 size={14} />`

#### 8.9 Admin panel
Već ima ikone iz lucide-react (LayoutDashboard, ListTree itd). ✅

#### 8.10 Footer
Dodati ikone za socijalne mreže:
```tsx
import { Instagram, Facebook, Youtube } from "lucide-react";
```

---

## 9. Dodatni predlozi i opcije

### 🟢 PREPORUČUJEM (visok prioritet)

#### 9.1 Dark mode marker fix
Marker popup-i koriste hardkodirane bele boje (`text-slate-800`, `bg-emerald-50`). U dark mode-u ovo izgleda loše. Treba da koriste CSS varijable.

#### 9.2 Offline support (Service Worker caching)
Dodati cache strategiju u `sw.js`:
```js
self.addEventListener("fetch", (event) => {
  // Cache tile-ove i statičke resurse
  // Network-first za API pozive
});
```

#### 9.3 Animated marker za nove prijave
Kada stigne nova prijava preko WebSocket-a, marker treba da "pulsa" prvih 30s:
```css
@keyframes marker-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}
```

#### 9.4 Toast notifikacije (in-app)
Umesto `setPushInfo()` i `setError()` koje zavise od pozicije, koristiti toast sistem:

**Opcije**:
| Biblioteka | Veličina | Preporuka |
|-----------|---------|-----------|
| **react-hot-toast** | ~5kb | ✅ Najjednostavniji |
| **sonner** | ~5kb | ✅ Moderan, animiran |
| **Custom** | 0kb | ✅ Jednostavna DIY komponenta |

Preporuka: `sonner` — lep, moderan, mali.

```bash
npm install sonner
```

#### 9.5 Konfig za proximity alert zvuk (vibration pattern)
Dati korisniku izbor da podesi tip vibracije/zvuka za blizinu.

#### 9.6 Heading indicator (smer kretanja)
Ako korisnik koristi live tracking, prikazati strelicu smera kretanja na mapi.

### 🟡 OPCIONO (srednji prioritet)

#### 9.7 Report expiry progress bar
U feed-u prikazati vizuelni progress bar koliko vremena je ostalo pre isteka.

#### 9.8 Cluster info (koliko prijava u gruplji)
Kada se klikne na cluster, prikazati summary:
- "3 radara, 1 policija u ovom području"

#### 9.9 Glasovne notifikacije (Text-to-Speech)
Koristiti Web Speech API za glasovno upozorenje:
```tsx
const utterance = new SpeechSynthesisUtterance("Upozorenje: radar na 200 metara");
utterance.lang = "sr";
speechSynthesis.speak(utterance);
```

#### 9.10 Geofencing zone
Korisnik može nacrtati zonu na mapi i dobijati upozorenja samo za tu zonu.

#### 9.11 Report starost vizuelno
Stariji izveštaji imaju bledi marker (opacity smanjenje bazirano na starosti).

### 🔴 NE PREPORUČUJEM (za sada)

#### 9.12 ❌ Full Tone.js integracija
Prevelik (5.4MB). `use-sound` je sasvim dovoljan za alertne zvukove.

#### 9.13 ❌ Full emoji-mart picker
200KB+ za picker koji nam ne treba na mapi. Bolje koristiti statički SVG set.

#### 9.14 ❌ WebGL mapa (Mapbox GL)
Leaflet je dovoljan za Niš-scale (grad). WebGL se isplati tek za country/continent scale.

---

## 10. Redosled implementacije

### Faza A — Brzi vizuelni/UX upgrade (1. iteracija)

| # | Zadatak | Fajlovi | Složenost |
|---|---------|---------|-----------|
| A1 | Vreme isticanja → 1 sat | `map-client.tsx` | Trivijalno |
| A2 | Raspored sajta — mapa odmah posle hero-a | `app/[locale]/page.tsx` | Trivijalna |
| A3 | Raw message u popup + feed | `map-client.tsx` | Lako |
| A4 | Raw message u admin tabeli | `admin-events-client.tsx` | Lako |
| A5 | Ikonice u toolbar dugmadima | `map-client.tsx` | Lako |
| A6 | Ikonice u type/time filter | `type-filter.tsx`, `time-filter.tsx` | Lako |

### Faza B — Push notifikacije + zvukovi (2. iteracija)

| # | Zadatak | Fajlovi | Složenost |
|---|---------|---------|-----------|
| B1 | Popraviti sw.js (ikone, akcije, klik) | `public/sw.js` | Srednje |
| B2 | PWA ikone generisanje | `public/images/icon-*.png` | Lako |
| B3 | Manifest ikone update | `public/manifest.json` | Trivijalno |
| B4 | WebSocket → browser notification | `map-client.tsx` | Lako |
| B5 | Install use-sound + zvučni fajlovi | `package.json`, `public/sounds/` | Srednje |
| B6 | Alert sound hook | `lib/hooks/use-alert-sound.ts` | Lako |
| B7 | Sound toggle + localStorage | `map-client.tsx` | Lako |
| B8 | Zvuk na novu prijavu (WS) | `map-client.tsx` | Lako |

### Faza C — Live tracking + proximity alert (3. iteracija)

| # | Zadatak | Fajlovi | Složenost |
|---|---------|---------|-----------|
| C1 | Live location hook | `lib/hooks/use-live-location.ts` | Srednje |
| C2 | Geo utils (haversine) | `lib/geo-utils.ts` | Lako |
| C3 | Proximity detection logika | `map-client.tsx` | Srednje |
| C4 | Proximity alert zvuk + vibracija | `map-client.tsx` | Lako |
| C5 | UI za live tracking (dugme + vizuelni krug) | `map-client.tsx` | Srednje |
| C6 | Radius slider | `map-client.tsx` | Lako |

### Faza D — Custom emoji/ikonice (4. iteracija)

| # | Zadatak | Fajlovi | Složenost |
|---|---------|---------|-----------|
| D1 | Download/kreiranje SVG marker ikona | `public/images/markers/` | Srednje-lako |
| D2 | Update markerConfig sa icon poljem | `map-client.tsx` | Lako |
| D3 | Update createMarkerIcon za SVG | `map-client.tsx` | Lako |
| D4 | Ikonice u ostalim sekcijama (hero, nav, footer) | Razni | Lako |

### Faza E — Bonus (opciono)

| # | Zadatak | Složenost |
|---|---------|-----------|
| E1 | Dark mode popup fix | Lako |
| E2 | Animated marker za new report | Lako |
| E3 | Toast notifikacije (sonner) | Srednje |
| E4 | Expiry progress bar u feed-u | Lako |
| E5 | Report starost opacity | Lako |
| E6 | Heading indicator | Srednje |

---

## Rezime novih dependency-a

```bash
npm install use-sound
npm install -D @types/howler
# Opciono:
npm install sonner          # za toast notifikacije
# NE instalirati:
# tone (prevelik)
# emoji-mart (nepotrebno za sada)
```

## Rezime novih fajlova

```
lib/hooks/use-alert-sound.ts    # Sound hook
lib/hooks/use-live-location.ts  # Live GPS tracking hook
lib/geo-utils.ts                # Haversine distance + geo helpers
public/sounds/                  # 7 alert MP3 fajlova
public/images/markers/          # 6 SVG marker ikona
public/images/icon-*.png        # PWA ikone (5 veličina)
```

## Rezime izmenjenih fajlova

```
components/landing/map-client.tsx         # Veliki update: raw msg, ikonice, zvuk, tracking, proximity
components/admin/admin-events-client.tsx   # Raw message kolona
app/[locale]/page.tsx                      # Raspored sekcija
public/sw.js                               # Push notifikacije kompletno
public/manifest.json                       # Ikone
messages/sr-latn.json                      # Novi i18n ključevi
messages/sr-cyrl.json                      # Novi i18n ključevi
messages/en.json                           # Novi i18n ključevi
components/map/type-filter.tsx             # Ikonice
components/map/time-filter.tsx             # Ikonice
```
