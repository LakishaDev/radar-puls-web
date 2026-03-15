# Plan: Deploy Radar Puls Web na Cloudflare

**Datum:** 2026-03-15  
**Status:** PLAN  
**Odluka:** Cloudflare Pages (sa Workers runtime-om) koristeći `@opennextjs/cloudflare`

---

## Zašto Cloudflare Pages (ne čist Workers)?

| Kriterijum | Cloudflare Pages | Čist Workers |
|---|---|---|
| Static assets (CDN) | ✅ Automatski, globalni CDN, besplatno | ⚠️ Ručno KV/R2 setup |
| Middleware (next-intl proxy.ts) | ✅ Radi preko Workers runtime | ✅ Nativno |
| Preview deploys (per-branch) | ✅ Automatski | ❌ Ručno |
| Git integracija | ✅ GitHub/GitLab auto-deploy | ❌ Ručno ili CI/CD |
| Rollback | ✅ Instant, jedan klik | ⚠️ Ručno |
| Custom domains | ✅ Besplatno + auto SSL | ✅ Ali komplikovanije |
| Pricing | ✅ Generous free tier (500 builds/mesec) | ✅ Free tier 100k req/dan |
| SSR/Server Components | ✅ Via Workers runtime | ✅ Nativno |
| Next.js kompatibilnost | ✅ @opennextjs/cloudflare adapter | ⚠️ Više ručnog posla |

**Zaključak:** Pages daje sve što Workers može + automatski CDN, preview deploys, Git integraciju, i lakši DX. Za ovaj projekat (Next.js 16 + next-intl + SSR) Pages je jasno bolji izbor.

---

## Analiza projekta — šta imamo

- **Next.js 16.1.6** sa App Router
- **next-intl** middleware u `proxy.ts` (sr-latn, sr-cyrl, en)
- **Nema API routes** — sav backend je eksterni (`NEXT_PUBLIC_API_URL`)
- **Nema server secrets** — sve env varijable su `NEXT_PUBLIC_*`
- **PWA** — service worker + manifest (client-side, radi svuda)
- **Leaflet mape** — client-side rendering, nema SSR zavisnosti
- **Framer Motion** — client-side animacije
- **Admin panel** — koristi localStorage token, klijentske API pozive

---

## Faze implementacije

### Faza 1: Priprema projekta

#### 1.1 Instalacija @opennextjs/cloudflare adaptera
```bash
npm install --save-dev @opennextjs/cloudflare
```

#### 1.2 Kreiranje `open-next.config.ts`
```ts
import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
    },
  },
};

export default config;
```

#### 1.3 Kreiranje `wrangler.jsonc` (Cloudflare config)
```jsonc
{
  "name": "radar-puls-web",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-03-15",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  }
}
```

#### 1.4 Ažuriranje `package.json` skripti
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:worker": "opennextjs-cloudflare build",
    "preview": "opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare deploy",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit"
  }
}
```

#### 1.5 Ažuriranje `.gitignore`
Dodati:
```
.open-next/
.wrangler/
```

#### 1.6 Provera `next.config.ts`
Trenutni config je kompatibilan. Nema `output: "standalone"` ili `output: "export"` — to je OK jer @opennextjs/cloudflare radi sa default buildom.

---

### Faza 2: Environment varijable

#### 2.1 Definisanje varijabli u Cloudflare Dashboard
U Pages projektu → Settings → Environment variables:

| Varijabla | Production | Preview |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://radarpuls.rs` | `https://preview.radarpuls.rs` |
| `NEXT_PUBLIC_API_URL` | `https://api.radarpuls.rs` | `https://api-staging.radarpuls.rs` |
| `NEXT_PUBLIC_LIVE_MAP_LAUNCH_DATE` | datum launcha | datum launcha |
| `NEXT_PUBLIC_GOOGLE_PLAY_URL` | URL | URL |
| `NEXT_PUBLIC_APP_STORE_URL` | URL | URL |
| `NEXT_PUBLIC_INSTAGRAM_URL` | URL | URL |
| `NEXT_PUBLIC_FACEBOOK_URL` | URL | URL |
| `NEXT_PUBLIC_YOUTUBE_URL` | URL | URL |

**Napomena:** Sve varijable su `NEXT_PUBLIC_*` — inline-uju se u build, nisu runtime secrets.

---

### Faza 3: Cloudflare Pages setup

#### 3.1 Kreiranje Pages projekta
1. Cloudflare Dashboard → Pages → Create project
2. Povezati GitHub repo
3. Build settings:
   - **Build command:** `npm run build:worker`
   - **Build output directory:** `.open-next`
   - **Root directory:** `/` (root)
   - **Node.js version:** 20+

#### 3.2 Custom domain
1. Pages → Custom domains → Dodati `radarpuls.rs` i `www.radarpuls.rs`
2. Cloudflare automatski podešava SSL (Full Strict)
3. WWW → apex redirect podesiti u DNS pravilima

#### 3.3 Branch deploy pravila
- `main` → production deploy
- `develop` / feature grane → preview deploy (automatski URL)

---

### Faza 4: Lokalno testiranje pre deploy-a

#### 4.1 Build test
```bash
npm run build:worker
```

#### 4.2 Lokalni preview (Wrangler)
```bash
npm run preview
```
Ovo pokreće lokalni Cloudflare Workers simulator — testirati:
- [ ] Sve 3 locale rute (/sr-latn, /sr-cyrl, /en)
- [ ] Middleware redirect (/ → /sr-latn)
- [ ] Mapa stranica (/sr-latn/mapa)
- [ ] Admin panel (/sr-latn/admin)
- [ ] Legal stranice
- [ ] PWA manifest i service worker
- [ ] robots.txt i sitemap.xml

---

### Faza 5: Prvi deploy

```bash
npm run deploy
```

ili push na `main` branch ako je Git integracija aktivna.

---

## Optimizacije

### O1: Cloudflare Cache Rules
Podesiti u Dashboard → Caching → Cache Rules:

```
# Statički asseti — agresivno keširanje
URL: /_next/static/*
Cache TTL: 1 godina
Browser TTL: 1 godina
Edge TTL: 1 godina

# Slike
URL: /images/*
Cache TTL: 30 dana
Browser TTL: 30 dana

# Fontovi
URL: *.woff2
Cache TTL: 1 godina

# HTML stranice — kratko keširanje, revalidacija
URL: *.html ili /* (bez static)
Cache TTL: 1 sat
Browser TTL: 5 minuta
stale-while-revalidate: 1 dan
```

### O2: Cloudflare Speed optimizacije (Dashboard → Speed)
- **Early Hints (103):** ✅ Uključiti — preload critical assets
- **HTTP/3 (QUIC):** ✅ Uključiti
- **0-RTT Connection Resumption:** ✅ Uključiti
- **Brotli kompresija:** ✅ Uključiti (automatski)
- **Auto Minify:** ❌ Isključiti (Next.js već minifikuje)
- **Rocket Loader:** ❌ Isključiti (može da pokvari React hydration)
- **Mirage:** ❌ Isključiti (konflikt sa Next.js Image optimizacijom)

### O3: Next.js Image optimizacija
Trenutno koristimo `formats: ["image/avif", "image/webp"]` — dobro. Dodati u `next.config.ts`:
```ts
images: {
  formats: ["image/avif", "image/webp"],
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30 dana
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256],
},
```

### O4: Bundle optimizacija
Proveriti bundle size:
```bash
npx @next/bundle-analyzer
```
Leaflet i Framer Motion su najveći paketi — osigurati da su lazy-loaded:
- `react-leaflet` → samo u `map-client.tsx` sa `dynamic(() => import(...), { ssr: false })`
- `framer-motion` → tree-shaking radi automatski
- `howler` (use-sound) → lazy load

### O5: Prerender statičkih stranica
Legal stranice, landing page — mogu biti potpuno statične. Podesiti u layoutu:
```ts
export const dynamic = "force-static"; // za stranice koje ne zavise od runtime podataka
```
Ovo smanjuje Workers CPU vreme i ubrzava TTFB.

---

## Bezbednost

### B1: Cloudflare Security Headers
Kreirati `_headers` fajl u `/public/` ili podesiti preko Transform Rules:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=()
  X-XSS-Protection: 0
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

**Content-Security-Policy (CSP):**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.tile.openstreetmap.org blob:; connect-src 'self' https://api.radarpuls.rs; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
```
> **Napomena:** `unsafe-inline` i `unsafe-eval` su potrebni za Next.js. U budućnosti razmotriti nonce-based CSP.

### B2: Cloudflare WAF (Web Application Firewall)
- ✅ Uključiti Managed Rules (OWASP Core Ruleset)
- ✅ Uključiti Bot Fight Mode
- ✅ Rate limiting na API pozive (ako proxy-ujemo backend)
- ✅ Blokirati poznate bad user-agente

### B3: DDoS zaštita
- Automatski uključena na Cloudflare (L3/L4/L7)
- Za dodatnu zaštitu: Under Attack Mode (ručno, po potrebi)
- Rate Limiting pravilo: max 100 req/min po IP za /admin/* rute

### B4: SSL/TLS
- **Minimum TLS verzija:** 1.2 (preporuka: 1.3)
- **SSL mode:** Full (Strict)
- **Always Use HTTPS:** ✅
- **Automatic HTTPS Rewrites:** ✅
- **HSTS:** Uključiti sa `max-age=31536000; includeSubDomains; preload`

### B5: DNS Security
- **DNSSEC:** ✅ Uključiti u Cloudflare DNS
- **Sakriti origin IP:** Ne koristiti direktnu IP adresu backend servera u klient kodu — koristiti Cloudflare DNS proxy (narandžasti oblak)

### B6: Admin panel zaštita
Trenutno admin koristi localStorage token — razmotriti:
- Cloudflare Access (Zero Trust) za /admin/* rute — besplatno do 50 korisnika
- Ovo dodaje dodatni auth layer pre nego što korisnik uopšte vidi admin stranicu

---

## Monitoring i Analytics

### M1: Cloudflare Web Analytics
- Besplatno, privacy-friendly (nema cookies)
- Dodati u layout.tsx `<Script>` tag ili aktivirati u Dashboard
- Zamenjuje potrebu za Google Analytics

### M2: Cloudflare Workers Analytics
- Automatski prati: request count, CPU time, errors
- Koristiti za monitoring performansi SSR-a

### M3: Real User Monitoring (RUM)
- Cloudflare Observatory (besplatno) — Core Web Vitals monitoring
- Podesiti alerting za LCP > 2.5s, CLS > 0.1, INP > 200ms

### M4: Error Tracking
Razmotriti integraciju sa:
- Sentry (ima Cloudflare Workers SDK)
- Ili Cloudflare Logpush za detaljne logove

---

## Dodatne opcije za razmatranje

### D1: Cloudflare R2 za slike/assets
Ako u budućnosti bude mnogo korisničkih slika:
- R2 Storage (S3-kompatibilan, bez egress troškova)
- Custom domain za assets: `assets.radarpuls.rs`

### D2: Cloudflare KV za cache
Za keširanje API odgovora na edge-u:
- KV Store za `/api/map/reports` podatke
- TTL: 30-60 sekundi
- Smanjuje load na backend i ubrzava odgovor

### D3: Cloudflare Turnstile (umesto CAPTCHA)
- Besplatan, privacy-friendly CAPTCHA replacement
- Koristiti za admin login, voting sistem, kontakt forme

### D4: Cloudflare Zaraz (Tag Manager)
- Server-side tag management
- Zamenjuje client-side analytics skripte
- Bolje performanse (manje JS na klijentu)

### D5: Preview URL zaštita
- Podesiti `_routes.json` ili Cloudflare Access da preview URL-ovi ne budu indeksirani
- Dodati `X-Robots-Tag: noindex` header za preview deploys

---

## Checklist pre produkcijskog deploy-a

## Go-Live Gate (PASS/FAIL)

Status gates su **blokirajući**. Produkcijski deploy je dozvoljen samo kada je svaki gate `PASS`.

| Gate | Komanda / Provera | PASS kriterijum | FAIL kriterijum | Status |
|---|---|---|---|---|
| G1 Build (Next.js) | `CI=1 npm run build` | Exit code `0` | Bilo koja build/type greška | `FAIL` (default) |
| G2 Build (Worker bundle) | `CI=1 npm run build:worker` | Exit code `0` i `.open-next/worker.js` generisan | Adapter/build error | `FAIL` (default) |
| G3 Route health (preview) | `npm run qa:preview` | Sve target rute vraćaju HTTP `< 400` | Barem jedna ruta vraća `4xx/5xx` ili timeout | `FAIL` (default) |
| G4 Env varijable | Cloudflare Dashboard check | Sve `NEXT_PUBLIC_*` varijable postavljene za Preview + Production | Nedostaje makar jedna obavezna varijabla | `FAIL` (default) |
| G5 Security baseline | Header/WAF/TLS check | Security header-i aktivni + WAF + TLS policy | Nedostaje bilo koji obavezni security kontrolni element | `FAIL` (default) |

**Go-Live odluka:**
- `PASS`: svi gate-ovi su `PASS`.
- `FAIL`: makar jedan gate je `FAIL` (deploy se stopira).

- [ ] `npm run build:worker` — build prolazi bez grešaka
- [ ] `npm run preview` — lokalni test svih ruta
- [ ] `npm run qa:preview` — automatski route health check prolazi (bez `4xx/5xx`)
- [ ] Environment varijable podešene u Cloudflare Dashboard
- [ ] Custom domain konfigurisan i SSL aktivan
- [ ] Security headers postavljeni
- [ ] WAF pravila aktivna
- [ ] HSTS uključen
- [ ] DNSSEC uključen
- [ ] Bot protection aktivan
- [ ] Cache rules podešene
- [ ] Speed optimizacije konfigurisane
- [ ] Web Analytics uključen
- [ ] robots.txt i sitemap.xml rade ispravno
- [ ] PWA manifest i service worker rade
- [ ] Sva 3 locale-a funkcionišu
- [ ] Admin panel dostupan i funkcionalan
- [ ] Mapa se učitava i prikazuje podatke
- [ ] Mobile responsive test
- [ ] Lighthouse score > 90 za sve kategorije
- [ ] Preview deploy funkcioniše za feature grane

---

## Procenjena struktura troškova (Cloudflare Free plan)

| Resurs | Free Tier | Dovoljno za MVP? |
|---|---|---|
| Pages builds | 500/mesec | ✅ |
| Workers requests | 100,000/dan | ✅ |
| Workers CPU | 10ms/request | ✅ |
| Bandwidth | Neograničen | ✅ |
| Custom domains | Neograničen | ✅ |
| SSL certifikati | Automatski | ✅ |
| DDoS zaštita | Uključena | ✅ |
| Web Analytics | Besplatno | ✅ |

**Za MVP fazu projekta, Cloudflare Free plan je više nego dovoljan.**
