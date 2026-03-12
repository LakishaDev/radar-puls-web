# Plan: Implementacija pravnih stranica — Radar Puls

*Datum: 12. mart 2026.*

## Preduslovi

Sav pravni sadrzaj je generisan u `docs/legal/` direktorijumu (18 .md fajlova × 3 jezika × 6 dokumenata).
Ovaj plan je za KODIRANJE — kreiranje Next.js stranica, komponenti i azuriranje postojecih fajlova.

## Dizajn: Opcija E — Hub + Podstranice

- `/[locale]/legal` — hub stranica sa grid karticama (5 kartica)
- Svaka kartica linkuje na podstranicu
- Podstranice: sekcijski layout sa `## Naslov` sekcijama

---

## Korak 1: Nove stranice (Next.js App Router)

### 1.1 Hub stranica: `app/[locale]/legal/page.tsx`
- Prati pattern iz `app/[locale]/privacy/page.tsx` (Record objekat za 3 lokalizacije)
- Grid layout sa 5 kartica (responsive: 1 kolona mobile, 2 tablet, 3 desktop)
- Svaka kartica: ikona + naslov + kratak opis + link
- Ikone: lucide-react (`Shield`, `FileText`, `Lock`, `Cookie`, `Users`)
- Sadrzaj iz: `docs/legal/legal-hub-*.md`
- `generateMetadata` sa canonical URL
- Hover efekat na karticama (border glow ili shadow)

### 1.2 Disclaimer: `app/[locale]/disclaimer/page.tsx`
- Sadrzaj iz: `docs/legal/disclaimer-*.md`
- 8 sekcija sa naslovima
- Prati isti Record pattern: `{title, intro, sections: {heading, content}[]}`
- `generateMetadata` sa canonical URL

### 1.3 Cookie Policy: `app/[locale]/cookies/page.tsx`
- Sadrzaj iz: `docs/legal/cookies-*.md`
- 7 sekcija, ukljucujuci tabele kolacica
- Tabele renderovati kao styled HTML `<table>` ili kartice
- `generateMetadata` sa canonical URL

### 1.4 Community Guidelines: `app/[locale]/community-guidelines/page.tsx`
- Sadrzaj iz: `docs/legal/community-guidelines-*.md`
- 7 sekcija
- Zabranjen sadrzaj — moze biti lista sa ikonama (X ikone u crvenoj)
- `generateMetadata` sa canonical URL

### 1.5 Prosirenje Terms: `app/[locale]/terms/page.tsx`
- ZAMENI postojeci sadrzaj (4 bullet pointa) sa 12 sekcija
- Sadrzaj iz: `docs/legal/terms-*.md`
- Promeni tip Record-a: `{title, intro, sections: {heading, content}[]}` umesto `{title, intro, items: string[]}`

### 1.6 Prosirenje Privacy: `app/[locale]/privacy/page.tsx`
- ZAMENI postojeci sadrzaj (4 bullet pointa) sa 12 sekcija
- Sadrzaj iz: `docs/legal/privacy-*.md`
- Isti novi tip kao Terms

---

## Korak 2: Zajednicka legal layout komponenta

### `components/legal/legal-page-layout.tsx`
- Reusable layout za sve pravne podstranice
- Props: `title`, `intro`, `sections`, `lastUpdated`
- Struktura:
  - `<main>` sa max-w-4xl (kao postojece)
  - `<h1>` naslov
  - `<p>` intro
  - `<p>` datum poslednje izmene (siva boja, manja velicina)
  - Sekcije: svaka sa `<h2>`, `<div>` sadrzaj
  - Opciono: sticky sidebar navigacija za desktop (scroll-spy)
- Dark mode kompatibilno (CSS varijable: `--rp-ink`, `--rp-deep`, `--rp-border`)

---

## Korak 3: Azuriranje footer-a

### `components/landing/site-footer.tsx`
- Dodati linkove u Legal kolonu:
  - Odricanje odgovornosti → `/disclaimer`
  - Politika kolacica → `/cookies`
  - Pravila zajednice → `/community-guidelines`
  - Pravne informacije → `/legal` (hub)
- Potrebni novi i18n kljucevi u messages fajlovima

---

## Korak 4: i18n azuriranje

### `messages/sr-latn.json`, `messages/sr-cyrl.json`, `messages/en.json`
Dodati kljuceve u `footer.links`:
```json
{
  "footer": {
    "links": {
      "privacy": "...",
      "terms": "...",
      "disclaimer": "Odricanje odgovornosti",
      "cookies": "Politika kolacica",
      "communityGuidelines": "Pravila zajednice",
      "legal": "Pravne informacije"
    }
  }
}
```

---

## Korak 5: Cookie banner azuriranje

### `components/cookie-banner.tsx`
- Dodati link na Cookie Policy stranicu u tekst bannera
- `"Saznaj vise"` link ka `/cookies`

---

## Korak 6: Sitemap azuriranje

### `app/sitemap.ts`
- Dodati sve nove rute:
  - `/[locale]/legal`
  - `/[locale]/disclaimer`
  - `/[locale]/cookies`
  - `/[locale]/community-guidelines`

---

## Korak 7: Staticke parametre

### Svaka nova stranica treba `generateStaticParams()`
```typescript
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
```

---

## Korak 8: Verifikacija

1. `npm run typecheck` — nema TypeScript gresaka
2. `npm run build` — sve stranice se generisu:
   - `/sr-latn/legal`, `/sr-cyrl/legal`, `/en/legal`
   - `/sr-latn/disclaimer`, `/sr-cyrl/disclaimer`, `/en/disclaimer`
   - `/sr-latn/cookies`, `/sr-cyrl/cookies`, `/en/cookies`
   - `/sr-latn/community-guidelines`, `/sr-cyrl/community-guidelines`, `/en/community-guidelines`
   - Prosireni `/*/privacy` i `/*/terms`
3. Vizuelna provera na `localhost:3000`
4. Footer linkovi rade za sve lokale
5. Cookie banner ima link na cookie policy
6. Dark mode radi na svim pravnim stranicama

---

## Fajlovi koje treba kreirati (novi)
- `app/[locale]/legal/page.tsx`
- `app/[locale]/disclaimer/page.tsx`
- `app/[locale]/cookies/page.tsx`
- `app/[locale]/community-guidelines/page.tsx`
- `components/legal/legal-page-layout.tsx` (opciono — reusable layout)

## Fajlovi koje treba izmeniti (postojeci)
- `app/[locale]/terms/page.tsx` — zameni 4 bullet pointa sa 12 sekcija
- `app/[locale]/privacy/page.tsx` — zameni 4 bullet pointa sa 12 sekcija
- `components/landing/site-footer.tsx` — novi linkovi
- `components/cookie-banner.tsx` — link na cookie policy
- `messages/sr-latn.json` — novi i18n kljucevi
- `messages/sr-cyrl.json` — novi i18n kljucevi
- `messages/en.json` — novi i18n kljucevi
- `app/sitemap.ts` — nove rute

## Izvori sadrzaja
Sav tekstualni sadrzaj za stranice je u `docs/legal/*.md` fajlovima.
Svaki fajl ima format `-<locale>.md` (npr. `disclaimer-sr-latn.md`).
Agent treba da parsira markdown sekcije i ubaci ih u Record objekte u page.tsx fajlovima.
