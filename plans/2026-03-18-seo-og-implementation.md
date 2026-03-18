# SEO & Open Graph — Implementacioni Plan

> **Datum:** 2026-03-18
> **Cilj:** Popraviti kritične SEO probleme i omogućiti funkcionalno deljenje na društvenim mrežama.
> **Napomena:** Svaki task je atomski i nezavisan. Agent treba da prati redosled.

---

## PHASE 1: Kritične Popravke

### Task 1.1 — Generisanje OG slike (PNG umesto SVG)

**Problem:** `og-placeholder.svg` se koristi kao og:image. Facebook, Twitter, LinkedIn, WhatsApp, Telegram, Viber — nijedan ne podržava SVG. Deljeni linkovi nemaju sliku.

**Fajl:** `public/images/brand/og-default.png` (NOVI — treba kreirati ručno ili putem alata)

Ovo je **manualni korak** — potrebno je dizajnirati OG sliku:
- Dimenzije: 1200×630px
- Format: PNG
- Sadržaj: Radar Puls logo, tamno plava pozadina (#0A1628), tagline "Prijave policije i radara u realnom vremenu", brend boja accent (#0B3B8C)
- Alat: Figma, Canva, ili `sharp` / `canvas` skripta

> **AGENT:** Ovaj task preskoci ako fajl `public/images/brand/og-default.png` ne postoji. Obavesti korisnika da ga kreira ručno. Nastavi sa Task 1.2 koji ažurira reference (agent koristi fallback putanju `og-default.png` u kodu čak i pre nego što fajl postoji).

---

### Task 1.2 — Zameni sve SVG OG reference sa PNG

**Problem:** 4 fajla referenciraju `og-placeholder.svg` — mora se zameniti sa `og-default.png`.

**Fajl 1: `app/[locale]/layout.tsx`**

Pronađi (2 mesta u fajlu):
```
url: `${siteUrl}/images/brand/og-placeholder.svg`,
```
Zameni sa:
```
url: `${siteUrl}/images/brand/og-default.png`,
```

I u twitter sekciji:
```
images: [`${siteUrl}/images/brand/og-placeholder.svg`],
```
Zameni sa:
```
images: [`${siteUrl}/images/brand/og-default.png`],
```

Takođe u JSON-LD `LocalBusiness` bloku u istom fajlu:
```
image: `${appConfig.siteUrl}/images/brand/og-placeholder.svg`,
```
Zameni sa:
```
image: `${appConfig.siteUrl}/images/brand/og-default.png`,
```

**Fajl 2: `app/[locale]/[slug]/page.tsx`**

U `generateMetadata` funkciji pronađi (2 mesta):
```
url: `${appConfig.siteUrl}/images/brand/og-placeholder.svg`,
```
Zameni sa:
```
url: `${appConfig.siteUrl}/images/brand/og-default.png`,
```

```
images: [`${appConfig.siteUrl}/images/brand/og-placeholder.svg`],
```
Zameni sa:
```
images: [`${appConfig.siteUrl}/images/brand/og-default.png`],
```

**Fajl 3: `public/manifest.json`**

Pronađi:
```json
{
  "src": "/images/brand/og-placeholder.svg",
  "sizes": "any",
  "type": "image/svg+xml"
}
```
Zameni sa:
```json
{
  "src": "/images/brand/og-default.png",
  "sizes": "1200x630",
  "type": "image/png"
}
```

**Verifikacija:** `grep -r "og-placeholder" --include="*.tsx" --include="*.json" .` treba da vrati 0 rezultata.

---

### Task 1.3 — Fix hardkodovan `lang` atribut na `<html>`

**Problem:** `app/layout.tsx` linija 36 ima `<html lang="sr-Latn-RS">`. Kad korisnik otvori `/en/` ili `/sr-cyrl/`, Google vidi pogrešan jezik. Ovo je loše za SEO i hreflang validaciju.

**Fajl: `app/layout.tsx`**

Pronađi:
```tsx
    <html lang="sr-Latn-RS" suppressHydrationWarning>
```
Zameni sa:
```tsx
    <html suppressHydrationWarning>
```

> **Obrazloženje:** Uklanjamo hardkodovani `lang` jer Next.js metadata API + next-intl automatski postavljaju `lang` atribut iz locale parametra na nivou `[locale]/layout.tsx`. Alternativno, ako next-intl to ne radi automatski, treba dodati lang prop u `[locale]/layout.tsx`, ali u tom slučaju mora da se ukloni ceo `<html>` iz root layouta i prebaci u locale layout. Za sada, uklanjanje hardkodovanog atributa je najsigurniji korak — testirati da li next-intl automatski popunjava lang.

---

### Task 1.4 — Blokiraj admin stranice u robots.txt

**Problem:** `app/robots.ts` dozvoljava sve (`allow: "/"`). Admin stranice su crawlable.

**Fajl: `app/robots.ts`**

Zameni ceo sadržaj sa:

```typescript
import type {MetadataRoute} from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://radarpuls.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/*/admin/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
```

**Verifikacija:** Poseti `/robots.txt` u browseru i proveri da sadrži `Disallow: /*/admin/` i `Disallow: /api/`.

---

### Task 1.5 — Dodaj potpune OG/canonical metapodatke za Mapa stranicu

**Problem:** `/mapa` ima samo `title` i `description`. Nedostaju: canonical, hreflang, OpenGraph, Twitter Card.

**Fajl: `app/[locale]/mapa/page.tsx`**

Zameni `generateMetadata` funkciju. Ceo blok od `export async function generateMetadata` do zatvorene `}`:

```typescript
export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "mapPage"});
  const siteUrl = appConfig.siteUrl;
  const pageUrl = `${siteUrl}/${locale}/mapa`;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: pageUrl,
      languages: {
        "sr-latn": `${siteUrl}/sr-latn/mapa`,
        "sr-cyrl": `${siteUrl}/sr-cyrl/mapa`,
        en: `${siteUrl}/en/mapa`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: pageUrl,
      siteName: appConfig.siteName,
      images: [
        {
          url: `${siteUrl}/images/brand/og-default.png`,
          width: 1200,
          height: 630,
          alt: appConfig.siteName,
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [`${siteUrl}/images/brand/og-default.png`],
    },
  };
}
```

Dodaj import na vrh fajla (posle postojećih importa):
```typescript
import {appConfig} from "@/lib/config";
```

---

### Task 1.6 — Dodaj potpune OG/canonical metapodatke za Statistika stranicu

**Problem:** Isto kao mapa — nedostaju canonical, hreflang, OG, Twitter.

**Fajl: `app/[locale]/statistika/page.tsx`**

Zameni `generateMetadata` funkciju:

```typescript
export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "statsPage"});
  const siteUrl = appConfig.siteUrl;
  const pageUrl = `${siteUrl}/${locale}/statistika`;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: pageUrl,
      languages: {
        "sr-latn": `${siteUrl}/sr-latn/statistika`,
        "sr-cyrl": `${siteUrl}/sr-cyrl/statistika`,
        en: `${siteUrl}/en/statistika`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: pageUrl,
      siteName: appConfig.siteName,
      images: [
        {
          url: `${siteUrl}/images/brand/og-default.png`,
          width: 1200,
          height: 630,
          alt: appConfig.siteName,
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [`${siteUrl}/images/brand/og-default.png`],
    },
  };
}
```

Dodaj import na vrh fajla:
```typescript
import {appConfig} from "@/lib/config";
```

---

### Task 1.7 — Dodaj Statistika stranicu u sitemap

**Problem:** `app/sitemap.ts` uključuje locale, mapa, legal, seo stranice — ali NE i `/statistika`.

**Fajl: `app/sitemap.ts`**

Pronađi (pre `return` linije):
```typescript
  return [...localePages, ...mapaPages, ...legalPages, ...seoPages];
```

Dodaj pre te linije:
```typescript
  const statistikaPages = routing.locales.map((locale) => ({
    url: `${appConfig.siteUrl}/${locale}/statistika`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));
```

I zameni return:
```typescript
  return [...localePages, ...mapaPages, ...statistikaPages, ...legalPages, ...seoPages];
```

---

## PHASE 2: SEO Obogaćivanje

### Task 2.1 — Dodaj FAQPage JSON-LD schema na landing stranicu

**Problem:** Landing ima 6 FAQ pitanja ali nema `FAQPage` structured data. Google može prikazati FAQ rich results.

**Fajl: `app/[locale]/page.tsx`**

Ovaj fajl je server component. Treba dodati FAQ JSON-LD blok. Zameni ceo fajl:

```tsx
import {getTranslations} from "next-intl/server";
import {SiteNavbar} from "@/components/landing/site-navbar";
import {HeroSection} from "@/components/landing/hero-section";
import {ContentSections} from "@/components/landing/content-sections";
import {CountdownSection} from "@/components/landing/countdown-section";
import {TestimonialsSection} from "@/components/landing/testimonials-section";
import {MapSection} from "@/components/landing/map-section";
import {NewsletterSection} from "@/components/landing/newsletter-section";
import {FaqSection} from "@/components/landing/faq-section";
import {DownloadCtaSection} from "@/components/landing/download-cta-section";
import {SiteFooter} from "@/components/landing/site-footer";

const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

export default async function LandingPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "faq"});

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqKeys.map((key) => ({
      "@type": "Question",
      name: t(`${key}.question`),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(`${key}.answer`),
      },
    })),
  };

  return (
    <main className="min-h-screen bg-[var(--rp-bg)] text-[var(--rp-ink)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(faqJsonLd)}}
      />
      <SiteNavbar />
      <HeroSection />
      <MapSection />
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

> **NAPOMENA:** Originalni fajl nema params — dodajemo ih jer je unutar `[locale]` rute i Next.js prosleđuje params. Proveriti da `getTranslations` radi serverski (uvezen iz `next-intl/server`).

**Verifikacija:** Testirajte sa Google Rich Results Testom: https://search.google.com/test/rich-results — unesite URL landing stranice.

---

### Task 2.2 — Dodaj Organization schema u JSON-LD (locale layout)

**Problem:** Postoje `WebApplication` i `LocalBusiness` schema ali nema `Organization` sa social linkovima.

**Fajl: `app/[locale]/layout.tsx`**

U nizu `jsonLd` (koji već sadrži 2 objekta), dodaj treći objekat na kraj niza, pre `];`:

Pronađi:
```typescript
      sameAs: [appConfig.googlePlayUrl, appConfig.appStoreUrl],
    },
  ];
```

Zameni sa:
```typescript
      sameAs: [appConfig.googlePlayUrl, appConfig.appStoreUrl],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: appConfig.siteName,
      url: appConfig.siteUrl,
      logo: `${appConfig.siteUrl}/images/brand/og-default.png`,
      sameAs: [
        appConfig.social.instagram,
        appConfig.social.facebook,
        appConfig.social.youtube,
        appConfig.googlePlayUrl,
        appConfig.appStoreUrl,
      ],
    },
  ];
```

---

### Task 2.3 — Dodaj BreadcrumbList JSON-LD za SEO slug stranice

**Problem:** SEO stranice (`/radar-nis`, `/kontrole-nis` itd.) nemaju breadcrumb schema. Google prikazuje breadcrumbs u rezultatima.

**Fajl: `app/[locale]/[slug]/page.tsx`**

U `SeoLandingPage` komponenti, pronađi JSON-LD objekat i dodaj breadcrumb. Pronađi:

```typescript
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seoPage.title,
    description: seoPage.description,
    url: pageUrl,
    inLanguage: localeLabels[locale] ?? locale,
    isPartOf: {
      "@type": "WebSite",
      name: appConfig.siteName,
      url: `${appConfig.siteUrl}/${locale}`,
    },
    about: {
      "@type": "Thing",
      name: "Saobracajne prijave u Nisu",
    },
  };
```

Zameni sa:

```typescript
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: seoPage.title,
      description: seoPage.description,
      url: pageUrl,
      inLanguage: localeLabels[locale] ?? locale,
      isPartOf: {
        "@type": "WebSite",
        name: appConfig.siteName,
        url: `${appConfig.siteUrl}/${locale}`,
      },
      about: {
        "@type": "Thing",
        name: "Saobracajne prijave u Nisu",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: appConfig.siteName,
          item: `${appConfig.siteUrl}/${locale}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: seoPage.title,
          item: pageUrl,
        },
      ],
    },
  ];
```

---

### Task 2.4 — Dodaj SEO slug sadržaj u i18n (lokalizacija SEO stranica)

**Problem:** SEO slug stranice imaju hardkodovan srpski tekst i samo ~50 reči. Treba ga lokalizovati i obogatiti.

**Fajl 1: `lib/seo-slugs.ts`**

Zameni ceo fajl — dodaj i18n ključeve umesto hardkodovanih stringova:

```typescript
export type FutureSeoPage = {
  slug: string;
  titleKey: string;
  descriptionKey: string;
  contentKey: string;
};

export const futureSeoPages: FutureSeoPage[] = [
  {
    slug: "radar-nis",
    titleKey: "seoPages.radarNis.title",
    descriptionKey: "seoPages.radarNis.description",
    contentKey: "seoPages.radarNis",
  },
  {
    slug: "gde-su-radari-u-nisu",
    titleKey: "seoPages.gdeRadari.title",
    descriptionKey: "seoPages.gdeRadari.description",
    contentKey: "seoPages.gdeRadari",
  },
  {
    slug: "policija-nis-danas",
    titleKey: "seoPages.policija.title",
    descriptionKey: "seoPages.policija.description",
    contentKey: "seoPages.policija",
  },
  {
    slug: "kamere-nis",
    titleKey: "seoPages.kamere.title",
    descriptionKey: "seoPages.kamere.description",
    contentKey: "seoPages.kamere",
  },
  {
    slug: "kontrole-nis",
    titleKey: "seoPages.kontrole.title",
    descriptionKey: "seoPages.kontrole.description",
    contentKey: "seoPages.kontrole",
  },
];

export const futureSeoPageSlugs = futureSeoPages.map((page) => page.slug);

export function getFutureSeoPageBySlug(slug: string) {
  return futureSeoPages.find((page) => page.slug === slug);
}
```

**Fajl 2: `messages/sr-latn.json`**

Dodaj novi top-level ključ `"seoPages"` na kraj JSON-a (pre poslednje `}`):

```json
"seoPages": {
  "radarNis": {
    "title": "Radar Nis danas | Radar Puls",
    "description": "Najnovije prijave radara i policije u Nisu na jednom mestu.",
    "heading": "Radar Nis danas",
    "intro": "Proverite najnovije prijave radara i policijskih kontrola u Nisu pre nego sto krenete na put. Radar Puls zajednica u realnom vremenu deli informacije o saobracajnim kontrolama, radarima i lokalnim prijavama.",
    "benefitsTitle": "Sta dobijas uz Radar Puls",
    "benefit1": "Prijave saobracajnih kontrola i radara na jednom mestu.",
    "benefit2": "Brz pregled situacije pre nego sto krenes na put.",
    "benefit3": "Zajednica vozaca fokusirana na Nis i okolinu.",
    "benefit4": "Obavestavanja o novim prijavama u tvom kraju.",
    "ctaText": "Pogledaj live mapu"
  },
  "gdeRadari": {
    "title": "Gde su radari u Nisu | Radar Puls",
    "description": "Pregled prijava radara i kontrola sa terena za Nis i okolinu.",
    "heading": "Gde su radari u Nisu",
    "intro": "Saznajte gde se nalaze aktivni radari u Nisu i okolini zahvaljujuci prijavama zajednice. Radar Puls prikuplja informacije od vozaca na terenu i prikazuje ih na interaktivnoj mapi.",
    "benefitsTitle": "Sta dobijas uz Radar Puls",
    "benefit1": "Pregled prijava radara sa lokacijama na mapi.",
    "benefit2": "Informacije o fiksnim i mobilnim radarima.",
    "benefit3": "Potvrde prijava od strane drugih vozaca.",
    "benefit4": "Istorija lokacija gde su radari najcesci.",
    "ctaText": "Pogledaj live mapu"
  },
  "policija": {
    "title": "Policija Nis danas | Radar Puls",
    "description": "Prati prijave lokacija policije i saobracajnih kontrola u realnom vremenu.",
    "heading": "Policija Nis danas",
    "intro": "Informisite se o prijavama policijskih patrola i saobracajnih kontrola u Nisu. Radar Puls zajednica prijavljuje lokacije policije u realnom vremenu kako bi vozaci mogli da budu obavestaeni.",
    "benefitsTitle": "Sta dobijas uz Radar Puls",
    "benefit1": "Prijave policijskih kontrola iz zajednice vozaca.",
    "benefit2": "Informacije u realnom vremenu o aktivnim patrolama.",
    "benefit3": "Filteri po tipu prijave i vremenskom okviru.",
    "benefit4": "Push obavestenja za tvoj region.",
    "ctaText": "Pogledaj live mapu"
  },
  "kamere": {
    "title": "Kamere Nis | Radar Puls",
    "description": "Informacije o kamerama i kriticnim tackama na putevima oko Nisa.",
    "heading": "Kamere Nis",
    "intro": "Proverite prijavljena mesta sa kamerama i kriticnim tackama u Nisu i okolini. Radar Puls zajednica identifikuje i deli informacije o lokacijama kamera za merenje brzine.",
    "benefitsTitle": "Sta dobijas uz Radar Puls",
    "benefit1": "Lokacije prijavljenih kamera na mapi.",
    "benefit2": "Informacije o kriticnim tackama na putevima.",
    "benefit3": "Zajednicke potvrde tacnosti prijava.",
    "benefit4": "Redovno azurirane informacije od vozaca.",
    "ctaText": "Pogledaj live mapu"
  },
  "kontrole": {
    "title": "Kontrole Nis | Radar Puls",
    "description": "Community prijave saobracajnih kontrola i patrola u tvom gradu.",
    "heading": "Kontrole Nis",
    "intro": "Budite informisani o saobracajnim kontrolama u Nisu zahvaljujuci zajednici vozaca. Radar Puls prikazuje prijave kontrola, patrola i alkohol testova sa terena.",
    "benefitsTitle": "Sta dobijas uz Radar Puls",
    "benefit1": "Prijave razlicitih tipova kontrola u tvom gradu.",
    "benefit2": "Filteri po tipu kontrole i distanci.",
    "benefit3": "Potvrdene prijave sa vecim nivoom poverenja.",
    "benefit4": "Statistika najaktivnijih lokacija.",
    "ctaText": "Pogledaj live mapu"
  }
}
```

**Fajl 3: `messages/en.json`**

Dodaj isti ključ `"seoPages"` sa engleskim prevodima:

```json
"seoPages": {
  "radarNis": {
    "title": "Radar Nis today | Radar Puls",
    "description": "Latest radar and police reports in Nis in one place.",
    "heading": "Speed radar in Nis today",
    "intro": "Check the latest speed radar and police checkpoint reports in Nis before hitting the road. The Radar Puls community shares real-time traffic control information, radar locations, and local reports.",
    "benefitsTitle": "What you get with Radar Puls",
    "benefit1": "Traffic control and radar reports in one place.",
    "benefit2": "Quick situation check before you drive.",
    "benefit3": "A driver community focused on Nis and surrounding area.",
    "benefit4": "Notifications about new reports in your area.",
    "ctaText": "View live map"
  },
  "gdeRadari": {
    "title": "Where are radars in Nis | Radar Puls",
    "description": "Overview of radar and checkpoint reports from the field for Nis and surrounding area.",
    "heading": "Where are speed radars in Nis",
    "intro": "Find out where active speed radars are located in Nis and nearby areas thanks to community reports. Radar Puls collects information from drivers on the ground and displays them on an interactive map.",
    "benefitsTitle": "What you get with Radar Puls",
    "benefit1": "Radar report overview with map locations.",
    "benefit2": "Info about fixed and mobile speed cameras.",
    "benefit3": "Community confirmations of reports.",
    "benefit4": "History of locations where radars are most common.",
    "ctaText": "View live map"
  },
  "policija": {
    "title": "Police Nis today | Radar Puls",
    "description": "Track police location reports and traffic checkpoints in real time.",
    "heading": "Police in Nis today",
    "intro": "Stay informed about police patrol and traffic checkpoint reports in Nis. The Radar Puls community reports police locations in real time so drivers can stay informed.",
    "benefitsTitle": "What you get with Radar Puls",
    "benefit1": "Police checkpoint reports from the driver community.",
    "benefit2": "Real-time information about active patrols.",
    "benefit3": "Filters by report type and time window.",
    "benefit4": "Push notifications for your region.",
    "ctaText": "View live map"
  },
  "kamere": {
    "title": "Traffic cameras Nis | Radar Puls",
    "description": "Information about cameras and critical road points around Nis.",
    "heading": "Traffic cameras in Nis",
    "intro": "Check reported camera locations and critical points in Nis and the surrounding area. The Radar Puls community identifies and shares information about speed camera locations.",
    "benefitsTitle": "What you get with Radar Puls",
    "benefit1": "Reported camera locations on the map.",
    "benefit2": "Info about critical road points.",
    "benefit3": "Community confirmations of report accuracy.",
    "benefit4": "Regularly updated information from drivers.",
    "ctaText": "View live map"
  },
  "kontrole": {
    "title": "Checkpoints Nis | Radar Puls",
    "description": "Community reports of traffic checkpoints and patrols in your city.",
    "heading": "Traffic checkpoints in Nis",
    "intro": "Stay informed about traffic checkpoints in Nis thanks to the driver community. Radar Puls displays reports of checkpoints, patrols, and DUI tests from the field.",
    "benefitsTitle": "What you get with Radar Puls",
    "benefit1": "Reports of different checkpoint types in your city.",
    "benefit2": "Filters by checkpoint type and distance.",
    "benefit3": "Confirmed reports with higher trust level.",
    "benefit4": "Statistics of most active locations.",
    "ctaText": "View live map"
  }
}
```

**Fajl 4: `messages/sr-cyrl.json`**

Dodaj isti ključ `"seoPages"` sa ćiriličnim prevodima (kopirati srpske latinicom i konvertovati u ćirilicu):

```json
"seoPages": {
  "radarNis": {
    "title": "Радар Ниш данас | Radar Puls",
    "description": "Најновије пријаве радара и полиције у Нишу на једном месту.",
    "heading": "Радар Ниш данас",
    "intro": "Проверите најновије пријаве радара и полицијских контрола у Нишу пре него што кренете на пут. Radar Puls заједница у реалном времену дели информације о саобраћајним контролама, радарима и локалним пријавама.",
    "benefitsTitle": "Шта добијаш уз Radar Puls",
    "benefit1": "Пријаве саобраћајних контрола и радара на једном месту.",
    "benefit2": "Брз преглед ситуације пре него што кренеш на пут.",
    "benefit3": "Заједница возача фокусирана на Ниш и околину.",
    "benefit4": "Обавештавања о новим пријавама у твом крају.",
    "ctaText": "Погледај live мапу"
  },
  "gdeRadari": {
    "title": "Где су радари у Нишу | Radar Puls",
    "description": "Преглед пријава радара и контрола са терена за Ниш и околину.",
    "heading": "Где су радари у Нишу",
    "intro": "Сазнајте где се налазе активни радари у Нишу и околини захваљујући пријавама заједнице. Radar Puls прикупља информације од возача на терену и приказује их на интерактивној мапи.",
    "benefitsTitle": "Шта добијаш уз Radar Puls",
    "benefit1": "Преглед пријава радара са локацијама на мапи.",
    "benefit2": "Информације о фиксним и мобилним радарима.",
    "benefit3": "Потврде пријава од стране других возача.",
    "benefit4": "Историја локација где су радари најчешћи.",
    "ctaText": "Погледај live мапу"
  },
  "policija": {
    "title": "Полиција Ниш данас | Radar Puls",
    "description": "Прати пријаве локација полиције и саобраћајних контрола у реалном времену.",
    "heading": "Полиција Ниш данас",
    "intro": "Информишите се о пријавама полицијских патрола и саобраћајних контрола у Нишу. Radar Puls заједница пријављује локације полиције у реалном времену како би возачи могли да буду обавештени.",
    "benefitsTitle": "Шта добијаш уз Radar Puls",
    "benefit1": "Пријаве полицијских контрола из заједнице возача.",
    "benefit2": "Информације у реалном времену о активним патролама.",
    "benefit3": "Филтери по типу пријаве и временском оквиру.",
    "benefit4": "Push обавештења за твој регион.",
    "ctaText": "Погледај live мапу"
  },
  "kamere": {
    "title": "Камере Ниш | Radar Puls",
    "description": "Информације о камерама и критичним тачкама на путевима око Ниша.",
    "heading": "Камере Ниш",
    "intro": "Проверите пријављена места са камерама и критичним тачкама у Нишу и околини. Radar Puls заједница идентификује и дели информације о локацијама камера за мерење брзине.",
    "benefitsTitle": "Шта добијаш уз Radar Puls",
    "benefit1": "Локације пријављених камера на мапи.",
    "benefit2": "Информације о критичним тачкама на путевима.",
    "benefit3": "Заједничке потврде тачности пријава.",
    "benefit4": "Редовно ажуриране информације од возача.",
    "ctaText": "Погледај live мапу"
  },
  "kontrole": {
    "title": "Контроле Ниш | Radar Puls",
    "description": "Community пријаве саобраћајних контрола и патрола у твом граду.",
    "heading": "Контроле Ниш",
    "intro": "Будите информисани о саобраћајним контролама у Нишу захваљујући заједници возача. Radar Puls приказује пријаве контрола, патрола и алкохол тестова са терена.",
    "benefitsTitle": "Шта добијаш уз Radar Puls",
    "benefit1": "Пријаве различитих типова контрола у твом граду.",
    "benefit2": "Филтери по типу контроле и дистанци.",
    "benefit3": "Потврђене пријаве са већим нивоом поверења.",
    "benefit4": "Статистика најактивнијих локација.",
    "ctaText": "Погледај live мапу"
  }
}
```

---

### Task 2.5 — Ažuriraj [slug]/page.tsx da koristi i18n umesto hardkodovanih stringova

**Problem:** Trenutno [slug] koristi `seoPage.title` i `seoPage.description` direktno. Posle Task 2.4, mora koristiti i18n ključeve.

**Fajl: `app/[locale]/[slug]/page.tsx`**

Zameni ceo fajl sledećim sadržajem:

```tsx
import type {Metadata} from "next";
import {hasLocale} from "next-intl";
import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";
import Link from "next/link";
import {routing} from "@/i18n/routing";
import {appConfig} from "@/lib/config";
import {futureSeoPages, getFutureSeoPageBySlug} from "@/lib/seo-slugs";

type SeoPageParams = {
  locale: string;
  slug: string;
};

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    futureSeoPages.map((page) => ({
      locale,
      slug: page.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<SeoPageParams>;
}): Promise<Metadata> {
  const {locale, slug} = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const seoPage = getFutureSeoPageBySlug(slug);
  if (!seoPage) {
    return {};
  }

  const t = await getTranslations({locale});
  const title = t(seoPage.titleKey);
  const description = t(seoPage.descriptionKey);
  const pageUrl = `${appConfig.siteUrl}/${locale}/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
      languages: Object.fromEntries(
        routing.locales.map((supportedLocale) => [
          supportedLocale,
          `${appConfig.siteUrl}/${supportedLocale}/${slug}`,
        ]),
      ),
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: appConfig.siteName,
      images: [
        {
          url: `${appConfig.siteUrl}/images/brand/og-default.png`,
          width: 1200,
          height: 630,
          alt: appConfig.siteName,
        },
      ],
      type: "article",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${appConfig.siteUrl}/images/brand/og-default.png`],
    },
  };
}

const localeLabels: Record<string, string> = {
  "sr-latn": "sr-Latn",
  "sr-cyrl": "sr-Cyrl",
  en: "en",
};

export default async function SeoLandingPage({
  params,
}: {
  params: Promise<SeoPageParams>;
}) {
  const {locale, slug} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const seoPage = getFutureSeoPageBySlug(slug);
  if (!seoPage) {
    notFound();
  }

  const t = await getTranslations({locale});
  const title = t(seoPage.titleKey);
  const description = t(seoPage.descriptionKey);
  const pageUrl = `${appConfig.siteUrl}/${locale}/${slug}`;
  const ct = (key: string) => t(`${seoPage.contentKey}.${key}`);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: pageUrl,
      inLanguage: localeLabels[locale] ?? locale,
      isPartOf: {
        "@type": "WebSite",
        name: appConfig.siteName,
        url: `${appConfig.siteUrl}/${locale}`,
      },
      about: {
        "@type": "Thing",
        name: "Saobracajne prijave u Nisu",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: appConfig.siteName,
          item: `${appConfig.siteUrl}/${locale}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: title,
          item: pageUrl,
        },
      ],
    },
  ];

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-4xl px-4 py-12 text-[var(--rp-ink)] sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Radar Puls</p>
      <h1 className="mt-2 text-3xl font-semibold text-[var(--rp-deep)] sm:text-4xl">{ct("heading")}</h1>
      <p className="mt-4 text-base leading-7 text-[var(--rp-ink-soft)]">{ct("intro")}</p>

      <section className="mt-8 rounded-2xl border border-[var(--rp-border)] bg-white p-6 shadow-sm dark:bg-[var(--rp-card)]">
        <h2 className="text-lg font-semibold text-[var(--rp-deep)]">{ct("benefitsTitle")}</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--rp-ink-soft)]">
          <li>{ct("benefit1")}</li>
          <li>{ct("benefit2")}</li>
          <li>{ct("benefit3")}</li>
          <li>{ct("benefit4")}</li>
        </ul>
      </section>

      <div className="mt-8">
        <Link
          href={`/${locale}/mapa`}
          className="inline-flex items-center rounded-xl bg-[var(--rp-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--rp-primary-hover)]"
        >
          {ct("ctaText")}
        </Link>
      </div>
    </main>
  );
}
```

---

## PHASE 3: Analitika & Verifikacija

### Task 3.1 — Dodaj Google Search Console verifikacioni meta tag

**Problem:** Nema verifikacije za GSC — ne može se pratiti indeksiranje.

**Fajl: `app/layout.tsx`**

U `metadata` objekat, dodaj `verification` polje. Pronađi:

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(appConfig.siteUrl),
  title: {
    default: "Radar Puls",
    template: "%s | Radar Puls",
  },
  description: "Radar Puls landing iskustvo za zajednicu vozaca.",
  manifest: "/manifest.json",
};
```

Zameni sa:

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(appConfig.siteUrl),
  title: {
    default: "Radar Puls",
    template: "%s | Radar Puls",
  },
  description: "Radar Puls landing iskustvo za zajednicu vozaca.",
  manifest: "/manifest.json",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
  },
};
```

Dodaj u `.env` (i `.env.example` ako postoji):
```
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
```

> **NAPOMENA:** Korisnik treba da popuni vrednost iz Google Search Console-a.

---

### Task 3.2 — Dodaj Plausible analytics script

**Problem:** `lib/analytics.ts` referencira `window.plausible` ali skripta se ne učitava nigde.

**Fajl: `app/layout.tsx`**

U `<head>` sekciju, dodaj Plausible script. Pronađi:

```tsx
      <head>
        <link rel="manifest" href="/manifest.json" />
```

Zameni sa:

```tsx
      <head>
        <link rel="manifest" href="/manifest.json" />
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
        )}
```

Dodaj u `.env`:
```
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
```

> **NAPOMENA:** Korisnik podešava kad ima Plausible nalog. Vrednost je domen sajta (npr. `radarpuls.com`).

---

## Rezime svih fajlova koji se menjaju

| # | Fajl | Akcija |
|---|------|--------|
| 1.1 | `public/images/brand/og-default.png` | **NAPRAVI** (ručno — dizajn) |
| 1.2 | `app/[locale]/layout.tsx` | Zameni 3 SVG reference sa PNG |
| 1.2 | `app/[locale]/[slug]/page.tsx` | Zameni 2 SVG reference sa PNG |
| 1.2 | `public/manifest.json` | Zameni SVG entry sa PNG |
| 1.3 | `app/layout.tsx` | Ukloni hardkodovan `lang` sa `<html>` |
| 1.4 | `app/robots.ts` | Dodaj disallow za admin i api rute |
| 1.5 | `app/[locale]/mapa/page.tsx` | Dodaj OG, canonical, hreflang, twitter |
| 1.6 | `app/[locale]/statistika/page.tsx` | Dodaj OG, canonical, hreflang, twitter |
| 1.7 | `app/sitemap.ts` | Dodaj statistika stranice |
| 2.1 | `app/[locale]/page.tsx` | Dodaj FAQPage JSON-LD |
| 2.2 | `app/[locale]/layout.tsx` | Dodaj Organization schema |
| 2.3 | `app/[locale]/[slug]/page.tsx` | Dodaj BreadcrumbList JSON-LD |
| 2.4 | `lib/seo-slugs.ts` | Prebaci na i18n ključeve |
| 2.4 | `messages/sr-latn.json` | Dodaj `seoPages` ključ |
| 2.4 | `messages/en.json` | Dodaj `seoPages` ključ |
| 2.4 | `messages/sr-cyrl.json` | Dodaj `seoPages` ključ |
| 2.5 | `app/[locale]/[slug]/page.tsx` | Koristi i18n umesto hardkodovanih stringova |
| 3.1 | `app/layout.tsx` | Dodaj GSC verification meta |
| 3.1 | `.env` | Dodaj `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` |
| 3.2 | `app/layout.tsx` | Dodaj Plausible script |
| 3.2 | `.env` | Dodaj `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` |

## Post-implementacija verifikacija

```bash
# 1. Build provera
npm run build

# 2. Proveri da nema SVG referenci na OG
grep -r "og-placeholder" --include="*.tsx" --include="*.json" .

# 3. Proveri robots.txt output
# Poseti http://localhost:3000/robots.txt

# 4. Proveri sitemap.xml output
# Poseti http://localhost:3000/sitemap.xml — treba da sadrzi /statistika rute

# 5. Testiraj OG tagove
# Poseti https://developers.facebook.com/tools/debug/ sa URL-ovima sajta

# 6. Testiraj Rich Results
# Poseti https://search.google.com/test/rich-results sa URL-ovima sajta
```
