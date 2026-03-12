# Radar Puls – Plan implementacije poboljšanja

Datum: 2026-03-12  
Status: Spreman za izvršenje  

---

## Redosled implementacije

### 1. `lib/config.ts` – Centralizovani config
**Zašto:** `googlePlayUrl` i `appStoreUrl` su duplirani u `hero-section.tsx` i `content-sections.tsx`.  
**Šta:** Jedan fajl sa svim env/config vrednostima.  
**Fajlovi:** `lib/config.ts` (novo), `components/landing/hero-section.tsx`, `components/landing/content-sections.tsx`

---

### 2. `data/markers.json` – Demo markeri za Niš
**Zašto:** Mapa koristi hardkodovane podatke direktno u komponenti. Treba ih izvući u statički JSON.  
**Šta:** `data/markers.json` sa realnim koordinatama Niša; `map-client.tsx` čita iz fajla.  
**Fajlovi:** `data/markers.json` (novo), `components/landing/map-client.tsx`

---

### 3. JSON-LD structured data u layout
**Zašto:** Direktan SEO boost za lokalni search (Niš). Google prepoznaje `WebApplication` + `LocalBusiness` schema.  
**Šta:** `<script type="application/ld+json">` u `app/[locale]/layout.tsx`.  
**Fajlovi:** `app/[locale]/layout.tsx`

---

### 4. Mobilni hamburger meni
**Zašto:** Nav je `hidden md:flex` – na mobilnom nema menija. Target publika (vozači) su 90% na mobitelu.  
**Šta:** Hamburger dugme + Sheet/Drawer drawer meni koristeći shadcn `Sheet` ili čist Tailwind.  
**Fajlovi:** `components/landing/site-navbar.tsx`

---

### 5. SEO stranice iz `futureSeoPages`
**Zašto:** Slugovi su definisani, infrastruktura postoji – samo treba stranice.  
**Šta:** `app/[locale]/[slug]/page.tsx` sa `generateStaticParams`, metadata i JSON-LD per stranici.  
**Fajlovi:** `app/[locale]/[slug]/page.tsx` (novo), `lib/seo-slugs.ts` (eventualno proširiti)

---

### 6. Popraviti `sitemap.ts`
**Zašto:** Trenutno uključuje samo root locale stranice – ne i SEO slug stranice.  
**Šta:** Dodati sve `futureSeoPages × locale` kombinacije.  
**Fajlovi:** `app/sitemap.ts`

---

### 7. Community/Leaderboard sekcija (placeholder)
**Zašto:** Social proof i osećaj zajednice na landing-u povećavaju konverziju za download.  
**Šta:** Statička sekcija sa "Top reporteri" fake podacima.  
**Fajlovi:** `components/landing/content-sections.tsx`

---

### 8. Privacy Policy i Terms stranice
**Zašto:** Obavezno za App Store/Google Play listing.  
**Šta:** Statičke stranice na svim lokal-ima.  
**Fajlovi:** `app/[locale]/privacy/page.tsx` (novo), `app/[locale]/terms/page.tsx` (novo)

---

### 9. PWA `manifest.json`
**Zašto:** Ikonica, theme color, installabilnost – korisno za korisničko iskustvo i SEO.  
**Šta:** `/public/manifest.json` + `<link>` u root layout.  
**Fajlovi:** `public/manifest.json` (novo), `app/layout.tsx`

---

### 10. Build verifikacija
**Šta:** `npm run build` + `npm run typecheck` da se potvrdi da sve prolazi bez grešaka.

---

## Prihvaćene odluke

- Nema shadcn `Sheet` zavisnosti (nema instaliranog shadcn-ui) – mobilni meni se implementira čistim Tailwind/React state-om
- SEO stranice su statički rendrovane (`generateStaticParams`) bez backenda
- Community sekcija je placeholder – realni podaci dolaze u V2
- Privacy/Terms su minimalne statičke stranice – dovoljno za store listing