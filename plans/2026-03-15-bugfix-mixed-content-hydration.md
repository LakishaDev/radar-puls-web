# Plan popravke bugova — Mixed Content, WebSocket, React Hydration

**Datum**: 2026-03-15  
**Prioritet**: 🔴 KRITIČNO — produkcija je blokirana  
**Kontekst grešaka**: Konzola na `https://radarpuls.com/sr-latn`

---

## Pregled grešaka

| # | Greška | Fajl | Linija |
|---|--------|------|--------|
| 1 | `Mixed Content` — HTTP API poziv iz HTTPS stranice | `lib/api.ts` | L55 |
| 2 | `SecurityError` — `ws://` WebSocket iz HTTPS konteksta | `components/landing/map-client.tsx` | L712–714 |
| 3 | `React error #418` — HTML hydration mismatch | `components/landing/countdown-section.tsx` | L30 |

---

## Bug 1 — Mixed Content: HTTP API poziv iz HTTPS stranice

### Uzrok

```ts
// lib/api.ts, linija 55
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://10.0.0.4:3000";
```

Fallback vrednost je **lokalna IP adresa sa HTTP shemom**. U Cloudflare produkcijskom deployu `wrangler.jsonc` **ne definiše** `NEXT_PUBLIC_API_URL`, pa aplikacija uvek pada na `http://10.0.0.4:3000`.

Pregledano: `wrangler.jsonc` nema `[vars]` sekciju — varijabla ne postoji u produkciji.

### Popravka A — Promeni fallback u `lib/api.ts`

**Fajl**: `lib/api.ts`  
**Linija 55** — promeni:

```ts
// STARO
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://10.0.0.4:3000";

// NOVO
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.radarpuls.com";
```

### Popravka B — Dodaj `vars` u `wrangler.jsonc`

**Fajl**: `wrangler.jsonc`

Nakon linije `"compatibility_flags": ["nodejs_compat"],` dodaj:

```json
"vars": {
  "NEXT_PUBLIC_API_URL": "https://api.radarpuls.com"
},
```

> **Napomena**: Obe popravke su potrebne — A je sigurnosni fallback za local dev i edge cases, B je eksplicitan produkcijski config.

---

## Bug 2 — WebSocket `ws://` iz HTTPS konteksta

### Uzrok

```ts
// components/landing/map-client.tsx, linije 712–714
const wsBase = process.env.NEXT_PUBLIC_WS_URL
  ?? API_BASE.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
const ws = new WebSocket(`${wsBase.replace(/\/$/, "")}/ws/map`);
```

Logika konverzije je **ispravna** (`http://` → `ws://`, `https://` → `wss://`), ali zavisi od ispravnog `API_BASE`. Kad je `API_BASE = "http://10.0.0.4:3000"`, regex daje `ws://10.0.0.4:3000/ws/map` što browser blokira.

### Popravka

Bug 2 se **automatski resava** popravkom Bug 1 (ispravni `API_BASE` → ispravni `wss://` URL).

**Dodatna zaštita** — u `map-client.tsx` dodati validaciju da se ne pokuša WS konekcija ako je URL insecure iz HTTPS konteksta:

**Fajl**: `components/landing/map-client.tsx`  
**Linija ~712** — zameni postojeći useEffect koji kreira WebSocket:

```ts
// STARO
useEffect(() => {
  const wsBase = process.env.NEXT_PUBLIC_WS_URL
    ?? API_BASE.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  const ws = new WebSocket(`${wsBase.replace(/\/$/, "")}/ws/map`);
  // ...

// NOVO — dodaj guard pre konstruisanja WebSocket
useEffect(() => {
  const wsBase = process.env.NEXT_PUBLIC_WS_URL
    ?? API_BASE.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  const wsUrl = `${wsBase.replace(/\/$/, "")}/ws/map`;

  // Spreči Mixed Content SecurityError: ne otvaraj ws:// iz https:// konteksta
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    wsUrl.startsWith("ws://")
  ) {
    console.warn("[MapClient] Blokiran insecure WebSocket iz HTTPS konteksta:", wsUrl);
    return;
  }

  const ws = new WebSocket(wsUrl);
  // ... ostatak useEffect ostaje identičan
```

> Ovaj guard sprečava crash u budućnosti čak i ako se pogrešan env var postavi ručno.

---

## Bug 3 — React Hydration Error #418

### Uzrok

```ts
// components/landing/countdown-section.tsx, linija 30
const [timeLeft, setTimeLeft] = useState<CounterState>(() => getTimeLeft(targetDate));
```

`getTimeLeft()` poziva `new Date()` tokom **SSR (server-side render)**. Server i klijent računaju vrednost u različitim trenucima — razlika od 1–2 sekunde uzrokuje `seconds` polje koje se ne poklapa, što React prijavljuje kao HTML hydration mismatch (#418).

### Popravka

**Fajl**: `components/landing/countdown-section.tsx`

Inicijalizovati state sa **nulama**, zatim odmah u `useEffect` postaviti pravu vrednost (izvršava se samo na klijentu, posle hydration):

```ts
// STARO
const [timeLeft, setTimeLeft] = useState<CounterState>(() => getTimeLeft(targetDate));

useEffect(() => {
  const timer = window.setInterval(() => {
    setTimeLeft(getTimeLeft(targetDate));
  }, 1000);
  return () => window.clearInterval(timer);
}, [targetDate]);

// NOVO
const [timeLeft, setTimeLeft] = useState<CounterState>({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
});

useEffect(() => {
  // Odmah postavi vrednost po mount-u (klijent), pre prvog tick-a
  setTimeLeft(getTimeLeft(targetDate));

  const timer = window.setInterval(() => {
    setTimeLeft(getTimeLeft(targetDate));
  }, 1000);
  return () => window.clearInterval(timer);
}, [targetDate]);
```

> Korisnik će videti `00 00 00 00` tek ~16ms pre prve prave vrednosti — vizualno neprimetno.

---

## Sinhronizacija `docs/web-api-reference.md`

### Identifikovane neusklađenosti

| Sekcija | Docs (staro) | Kod (stvarno) | Akcija |
|---------|--------------|---------------|--------|
| WebSocket protokol | Socket.IO (`io()`) | Native `WebSocket` | Ispraviti docs |
| WebSocket path | `/ws` | `/ws/map` | Ispraviti docs |
| EventType `control` | Postoji u tabeli | `checkpoint` u kodu (ne `control`) | Dodati `checkpoint`, napomenuti razliku |
| EventType `checkpoint` | Nema u docs | Postoji u `MapEventType` | Dodati u tabelu |
| WS endpoint URL | `wss://api.radarpuls.com/ws` | Iz `API_BASE + /ws/map` | Ažurirati primer |

### Izmene u `web-api-reference.md`

#### 1. Sekcija 8 — WebSocket

Zameniti celu sekciju 8 ("WebSocket — real-time dojave") sa:

```markdown
## 8. WebSocket — real-time dojave

```
wss://api.radarpuls.com/ws/map
```

Koristi **native `WebSocket`** API (ne Socket.IO).

### Konekcija (JavaScript primer)

```javascript
const ws = new WebSocket("wss://api.radarpuls.com/ws/map");

ws.onopen = () => {
  console.log("Povezan sa real-time stream-om");
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  const kind = message.event ?? message.type;
  const payload = message.payload ?? message.data;
  // ... obrada po kind-u
};

ws.onerror = () => {
  // Polling ostaje aktivan — WS greška nije fatalna
};
```

### Događaji koje server šalje

| Event | Kada | Payload |
|-------|------|---------|
| `new_report` | Nova dojava odobrena | `MapEventDto` ili `{ id: "uuid" }` |
| `report_updated` | Promenjen broj glasova | `{ id: "uuid", upvotes: N, downvotes: N }` |
| `report_removed` | Dojava preglasana | `{ id: "uuid" }` |
```

##### 2. Tabela tipova događaja — dodati `checkpoint`

```markdown
| `checkpoint` | Kontrolni punkt (PU, carina) | 🚧 |
```

Napomena ispod tabele:
```
> `control` i `checkpoint` su sinonimi — server može slati oba. Web klijent normalizuje sve na `checkpoint`.
```

#### 3. Primer kompletan flow — zameniti Socket.IO sa native WS

U sekciji "Primer — kompletan flow za web mapu" zameniti:
```javascript
// STARO
const socket = io("https://api.radarpuls.com", { path: "/ws" });
socket.on("new_report", ...);

// NOVO — native WebSocket
const ws = new WebSocket("wss://api.radarpuls.com/ws/map");
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.event === "new_report") {
    fetch("https://api.radarpuls.com/api/map/reports?geoOnly=true")
      .then(r => r.json())
      .then(fresh => refreshMarkers(fresh));
  }
  if (msg.event === "report_updated") updateVotes(msg.payload.id, msg.payload.upvotes, msg.payload.downvotes);
  if (msg.event === "report_removed") removeMarker(msg.payload?.id ?? msg.id);
};
```

---

## Redosled implementacije

Implementirati **tačno ovim redosledom** (svaki korak je nezavisan, ali 2 zavisi od 1):

### Korak 1 — Kritična popravka API_BASE fallback-a

**Fajl**: `lib/api.ts`  
Pronađi: `export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://10.0.0.4:3000";`  
Zameni sa: `export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.radarpuls.com";`

### Korak 2 — Dodaj env var u wrangler.jsonc

**Fajl**: `wrangler.jsonc`  
Nakon linije `"compatibility_flags": ["nodejs_compat"],` dodaj:
```json
"vars": {
  "NEXT_PUBLIC_API_URL": "https://api.radarpuls.com"
},
```

### Korak 3 — WebSocket guard u map-client.tsx

**Fajl**: `components/landing/map-client.tsx`  
U useEffect koji kreira WebSocket (oko linije 711), pre `new WebSocket(...)` dodaj guard (vidi Bug 2 sekciju gore).

### Korak 4 — Popravka hydration errora u countdown-section.tsx

**Fajl**: `components/landing/countdown-section.tsx`  
Linija ~30: promeni `useState` inicijalizator sa nulama i premesti `setTimeLeft(getTimeLeft(targetDate))` u `useEffect` (vidi Bug 3 sekciju gore).

### Korak 5 — Ažuriranje docs/web-api-reference.md

**Fajl**: `docs/web-api-reference.md`  
Implementirati sve izmene iz sekcije "Sinhronizacija docs/web-api-reference.md" gore.

---

## Verifikacija

Nakon deploymenta, proveriti u browser konzoli na `https://radarpuls.com`:

- [ ] Nema `Mixed Content` grešaka u Network tabu
- [ ] WebSocket konekcija prikazuje `wss://api.radarpuls.com/ws/map` (ne `ws://`)
- [ ] Nema React hydration grešaka (#418) pri reload-u
- [ ] Countdown odbroji pravilno — sekunde teku normalno
- [ ] Mapa učitava dojave sa produkcijskog API-ja (ne local IP)

---

## Napomene za deployment

- Posle izmene `wrangler.jsonc`, obavezan je novi `wrangler deploy` ili Cloudflare Pages redeploy
- `NEXT_PUBLIC_*` varijable su **build-time** konstante u Next.js — moraju biti prisutne pri build-u, ne samo u runtime env
- Ako Cloudflare Pages koristi UI env vars umesto `wrangler.jsonc`, dodati i tamo: `NEXT_PUBLIC_API_URL = https://api.radarpuls.com`
