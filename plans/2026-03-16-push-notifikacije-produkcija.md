# Push notifikacije — dijagnoza i implementacija

**Datum:** 2026-03-16  
**Status:** Spreman za implementaciju

---

## Dijagnoza: Zašto ne rade u produkciji

### Problem 1 — VAPID ključ nije u GitHub Actions (KRITIČNO)

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` je u `.env` lokalno i bake-uje se u Next.js build vreme.  
U `deploy.yml`, Build step **ne prenosi** tu varijablu:

```yaml
- name: Build
  run: npm run build:worker
  env:
    CI: '1'
    NEXT_TELEMETRY_DISABLED: '1'
    # ← NEXT_PUBLIC_VAPID_PUBLIC_KEY NEDOSTAJE
```

**Posledica:** U produkcijskom buildu vrednost je `undefined` → `handleSubscribePush()` baca grešku `VAPID public key not configured` → push pretplata se nikad ne kreira → notifikacije ne rade.

**Fix:**

1. Dodati GitHub Actions secret: `Settings → Secrets and variables → Actions → New repository secret`
   - Name: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - Value: (isti kao u `.env`)

2. Ažurirati `.github/workflows/deploy.yml`:

```yaml
- name: Build
  run: npm run build:worker
  env:
    CI: '1'
    NEXT_TELEMETRY_DISABLED: '1'
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: ${{ secrets.NEXT_PUBLIC_VAPID_PUBLIC_KEY }}
```

---

### Problem 2 — CSP blokira WebSocket konekciju

`public/_headers` ima u `connect-src`:
```
https://api.radarpuls.rs https://api-staging.radarpuls.rs
```

Ali **nedostaje** `https://api.radarpuls.com` i `wss://api.radarpuls.com`.

`wrangler.jsonc` i `lib/api.ts` koriste `api.radarpuls.com` za WebSocket (socket.io), što CSP blokira.

**Fix** — u `public/_headers` dodati u `connect-src`:
```
https://api.radarpuls.com wss://api.radarpuls.com
```

---

### Problem 3 — Backend mora da čuva subscriptions i šalje push

Frontend šalje `POST /api/proxy/map/subscriptions` sa `endpoint` + `keys`.  
Backend mora:
- Imati konfigurisan VAPID **private** ključ
- Sačuvati subscription u bazi
- Slati push poruke korisnicima kad stigne nova prijava

Ovo je backend odgovornost — verifikovati sa backend timom.

---

## Implementacija: Gentle vs. Agresivne notifikacije

### Notifikaciona hijerarhija

| Okidač | Tip | Zvuk | Vibracija | `requireInteraction` | `silent` |
|--------|-----|------|-----------|----------------------|---------|
| Nova prijava (WebSocket `new_report`) | **Gentle** | ❌ | ❌ | ❌ | ✅ |
| Prijava u proximity radiusu | **Agresivna** | ✅ | ✅ | ✅ | ❌ |

---

### Korak 1 — `map-client.tsx`: Gentle notifikacija za novu prijavu

Trenutni `new_report` WebSocket handler:
- Pušta zvuk za svaku novu prijavu ← previše agresivno

**Izmena** — ukloniti `playByTypeRef.current(payload.eventType)` iz WebSocket handlera i dodati `silent: true`:

```tsx
socket.on("new_report", (payload: MapReport) => {
  if (!payload) return;
  setReports((current) => [payload, ...current.filter((item) => item.id !== payload.id)]);

  // Bez zvuka — gentle in-app obaveštenje
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    new Notification(`Radar Puls — ${t(markerLabelKey[payload.eventType])}`, {
      body: payload.locationText || "Nova prijava na mapi",
      icon: "/images/icon-192.png",
      tag: `report-gentle-${payload.id}`,
      silent: true,            // ← bez sistemskog zvuka
      requireInteraction: false,
    });
  }
});
```

> In-app feed se automatski ažurira jer `setReports(...)` ostaje — korisnik vidi novi red u listi bez uznemiravanja.

---

### Korak 2 — `map-client.tsx`: Agresivna notifikacija za proximity ostaje

Proximity `useEffect` ostaje isti — zvuk + vibracija + `requireInteraction: true`.  
Jedina preporučena poboljšanja:

- Tag: `proximity-${report.id}` (već postoji)
- `renotify: true` — da se re-prikaže čak i ako tag postoji
- Zvuk se pokreće samo ako je `soundEnabled` (već postoji)

---

### Korak 3 — `public/sw.js`: Podrška za `urgent` flag u push payload-u

Server-side push poruke (koje šalje backend) treba da razlikuju urgent od gentle.  
Ažurirati `sw.js` da čita `urgent` field iz payload-a:

```js
self.addEventListener("push", (event) => {
  let payload = {
    title: "Radar Puls",
    body: "Stigla je nova prijava u tvojoj zoni.",
    url: "/sr-latn/mapa",
    urgent: false,
  };

  try {
    if (event.data) {
      const data = event.data.json();
      payload = {...payload, ...data};
    }
  } catch {}

  const options = payload.urgent
    ? {
        // AGRESIVNA — proximity ili kritična prijava
        body: payload.body,
        icon: "/images/icon-192.png",
        badge: "/images/icon-96.png",
        vibrate: [200, 100, 200, 100, 300],
        tag: payload.tag || "radar-puls-urgent",
        renotify: true,
        requireInteraction: true,
        data: { url: payload.url },
        actions: [
          { action: "open", title: "Otvori mapu" },
          { action: "dismiss", title: "Zatvori" },
        ],
      }
    : {
        // GENTLE — nova prijava u opštem
        body: payload.body,
        icon: "/images/icon-192.png",
        tag: payload.tag || "radar-puls-gentle",
        silent: true,
        renotify: false,
        requireInteraction: false,
        data: { url: payload.url },
      };

  event.waitUntil(
    self.registration.showNotification(payload.title || "Radar Puls", options)
  );
});
```

---

## Redosled implementacije

1. **[Deploy fix]** Dodati `NEXT_PUBLIC_VAPID_PUBLIC_KEY` u GitHub Secrets → ažurirati `deploy.yml`
2. **[CSP fix]** Ažurirati `public/_headers` → dodati `api.radarpuls.com` i `wss://api.radarpuls.com` u `connect-src`
3. **[Frontend]** Ažurirati `new_report` WebSocket handler u `map-client.tsx` → gentle notifikacija
4. **[SW]** Ažurirati `public/sw.js` → podrška za `urgent` flag
5. **[Backend]** Verifikovati da backend šalje `urgent: true` samo za proximity zone prijave, `urgent: false` za opšte objave
6. **[Test]** Testirati na staging → potom main

---

## Fajlovi koji se menjaju

| Fajl | Izmena |
|------|--------|
| `.github/workflows/deploy.yml` | Dodati `NEXT_PUBLIC_VAPID_PUBLIC_KEY` env var u Build step |
| `public/_headers` | Dodati `api.radarpuls.com` i `wss://api.radarpuls.com` u `connect-src` |
| `components/landing/map-client.tsx` | `new_report` handler → ukloniti `playByType`, dodati `silent: true` |
| `public/sw.js` | Podrška za `urgent` flag → gentle vs. agresivna notifikacija |

---

## Napomene

- `NEXT_PUBLIC_*` varijable su **build-time** u Next.js — nikad runtime. Moraju biti dostupne pri `next build`.
- `Cross-Origin-Embedder-Policy: require-corp` u `_headers` može blokirati CartoDB tile slike ako CARTO ne vraća `Cross-Origin-Resource-Policy` header — prati da mape ne budu prazne u produkciji.
- Push notifikacije rade samo na HTTPS ili localhost — za produkciju je ok.
- Za testiranje pusheva lokalno: koristiti `https://localhost` ili ngrok tunel.
