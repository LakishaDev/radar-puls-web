# Cloudflare Dashboard Runbook Checklist

**Datum:** 2026-03-15  
**Projekat:** radar-puls-web  
**Svrha:** Tacni klik-koraci za Pages setup, environment varijable, domen i lokalni preview QA.

## 1. Pages projekat (klik-koraci)

- [ ] Otvori Cloudflare Dashboard.
- [ ] Klikni `Workers & Pages`.
- [ ] Klikni tab `Overview` (ako nije vec aktivan).
- [ ] Klikni `Create application`.
- [ ] U sekciji `Pages` klikni `Connect to Git`.
- [ ] Izaberi GitHub nalog i repo: `radar-puls-web`.
- [ ] U koraku `Set up builds and deployments` unesi:
- [ ] `Production branch`: `main`
- [ ] `Framework preset`: `None`
- [ ] `Build command`: `npm run build:worker`
- [ ] `Build output directory`: `.open-next`
- [ ] `Root directory`: `/`
- [ ] Klikni `Save and Deploy`.
- [ ] Sacekaj prvi deploy da dobije status `Success`.

### 1.1 Auto build/deploy na svaki `git push`

Putanja u dashboard-u:
`Workers & Pages` -> `radar-puls-web` -> `Settings` -> `Builds & deployments`.

- [ ] `Production branch` ostavi na `main`.
- [ ] U `Preview deployments` potvrdi da je ukljuceno (`All non-production branches` ili ekvivalentna opcija).
- [ ] Potvrdi da nije aktiviran `Pause automatic builds`.
- [ ] Sacuvaj izmene (`Save`).
- [ ] Test: push na feature granu (`git push origin <feature-branch>`) i potvrdi da se automatski pokrece preview build.
- [ ] Test: merge/push na `main` i potvrdi da se automatski pokrece production build.

## 2. Environment variables (Production + Preview)

Putanja u dashboard-u:
`Workers & Pages` -> `radar-puls-web` -> `Settings` -> `Variables and Secrets`.

### 2.1 Production varijable

- [ ] U sekciji `Environment variables`, izaberi environment `Production`.
- [ ] Klikni `Add variable` i dodaj:
- [ ] `NEXT_PUBLIC_SITE_URL = https://radarpuls.rs`
- [ ] `NEXT_PUBLIC_API_URL = https://api.radarpuls.rs`
- [ ] `NEXT_PUBLIC_LIVE_MAP_LAUNCH_DATE = <datum-launcha>`
- [ ] `NEXT_PUBLIC_GOOGLE_PLAY_URL = <url>`
- [ ] `NEXT_PUBLIC_APP_STORE_URL = <url>`
- [ ] `NEXT_PUBLIC_INSTAGRAM_URL = <url>`
- [ ] `NEXT_PUBLIC_FACEBOOK_URL = <url>`
- [ ] `NEXT_PUBLIC_YOUTUBE_URL = <url>`
- [ ] Klikni `Save`.

### 2.2 Preview varijable

- [ ] Promeni environment na `Preview`.
- [ ] Klikni `Add variable` i dodaj:
- [ ] `NEXT_PUBLIC_SITE_URL = https://preview.radarpuls.rs`
- [ ] `NEXT_PUBLIC_API_URL = https://api-staging.radarpuls.rs`
- [ ] `NEXT_PUBLIC_LIVE_MAP_LAUNCH_DATE = <datum-launcha>`
- [ ] `NEXT_PUBLIC_GOOGLE_PLAY_URL = <url>`
- [ ] `NEXT_PUBLIC_APP_STORE_URL = <url>`
- [ ] `NEXT_PUBLIC_INSTAGRAM_URL = <url>`
- [ ] `NEXT_PUBLIC_FACEBOOK_URL = <url>`
- [ ] `NEXT_PUBLIC_YOUTUBE_URL = <url>`
- [ ] Klikni `Save`.

Napomena: nakon izmene varijabli pokreni novi deploy (Redeploy) da bi promene usle u build.

## 3. Domain setup (apex + www)

### 3.1 Dodavanje domena na Pages projekat

Putanja u dashboard-u:
`Workers & Pages` -> `radar-puls-web` -> `Custom domains`.

- [ ] Klikni `Set up a custom domain`.
- [ ] Dodaj `radarpuls.rs` i potvrdi.
- [ ] Ponovi i dodaj `www.radarpuls.rs`.
- [ ] Sacekaj status `Active` za oba domena.

### 3.2 DNS i redirect

Putanja u dashboard-u:
`Websites` -> `radarpuls.rs` -> `DNS`.

- [ ] Proveri da su DNS zapisi proxied (narandzasti oblak).
- [ ] Proveri SSL status u `SSL/TLS` -> `Overview` (`Full (strict)`).

Putanja za preusmerenje:
`Websites` -> `radarpuls.rs` -> `Rules` -> `Redirect Rules`.

- [ ] Kreiraj pravilo za `www.radarpuls.rs/*` -> `https://radarpuls.rs/$1` (301).

## 4. Security headers i CSP (iz repozitorijuma)

- [ ] Proveri da postoji fajl `public/_headers`.
- [ ] Potvrdi da sadrzi CSP i security headere (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `HSTS`).
- [ ] Nakon merge/deploy proveri response headere na produkciji (`curl -I https://radarpuls.rs`).
- [ ] Napomena: lokalni `opennextjs-cloudflare preview` parsira `_headers`, ali security headeri nisu vidljivi na svim SSR rutama lokalno; finalnu potvrdu radi na Pages preview/production URL-u.

## 5. Lokalni preview flow

### 5.1 Komande

- [ ] Pokreni `npm run preview`.
- [ ] Ocekivano: skripta radi `build:worker` pa zatim podize lokalni OpenNext preview server.
- [ ] Ako je build vec uradjen i treba samo ponovno podizanje servera, koristi `npm run preview:worker`.

### 5.2 Kratak QA checklist po rutama

Proveri ocekivane statuse i osnovni rendering za:

- [ ] `/` (redirect ili locale landing)
- [ ] `/sr-latn`
- [ ] `/sr-cyrl`
- [ ] `/en`
- [ ] `/sr-latn/mapa`
- [ ] `/sr-latn/statistika`
- [ ] `/sr-latn/legal`
- [ ] `/sr-latn/privacy`
- [ ] `/sr-latn/terms`
- [ ] `/sr-latn/admin/login`
- [ ] `/robots.txt`
- [ ] `/sitemap.xml`

Minimalna validacija po ruti:

- [ ] Status nije 5xx.
- [ ] Nema runtime greske u server logu.
- [ ] Locale switch radi (`sr-latn` <-> `sr-cyrl` <-> `en`).
- [ ] Mapa stranica ucitava klijentski deo bez hydration greske.

### 5.3 Rezultat lokalnog testa (2026-03-15)

- [x] `CI=1 npm run build` prolazi (G1 PASS).
- [x] `CI=1 npm run build:worker` prolazi i generise `.open-next/worker.js` (G2 PASS).
- [x] `npm run qa:preview:up` prolazi (G3 PASS).
- [x] `http://localhost:8787` startuje bez greske.
- [x] `qa:preview` summary: `27/27 PASS`.
- [x] Legal rute (`/legal`, `/privacy`, `/terms`, `/cookies`, `/disclaimer`, `/community-guidelines`) su PASS za sve locale (`sr-latn`, `sr-cyrl`, `en`).
