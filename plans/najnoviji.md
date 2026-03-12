Plan: Radar Puls Website Enhancement v2
Izabrao si svih 10 poboljšanja — framer-motion animacije, dark mode, FAQ, testimonials, footer, countdown, newsletter, phone mockup, scroll-to-top i cookie banner. Ovo je strukturiran plan u 5 faza sa zavisnostima.

Faza A — Infrastruktura (blokira sve ostale faze)

A1: Instalirati framer-motion paket
A2: Dark mode sistem — dark varijante svih --rp-* CSS varijabli u globals.css, novi components/theme-provider.tsx + lib/hooks/use-theme.ts, Tailwind dark: strategija sa class na <html>
A3: Proširiti i18n poruke u sva 3 messages/*.json fajla — novi ključevi za FAQ (6-7 Q&A), testimonials (3-4 citata), footer kolone, countdown tekst, cookie banner, newsletter sekciju
Faza B — Nove sekcije (paralelno, nakon Faze A)

B1: FAQ accordion — components/landing/faq-section.tsx, 6-7 pitanja ("Da li je besplatno?", "Kako prijaviti radar?", "Koji gradovi?", "Da li je legalno?", "Kako radi reputacija?", "Kad dolazi live mapa?"), čist Tailwind accordion bez zavisnosti
B2: Testimonial kartice — components/landing/testimonials-section.tsx, 3-4 fake citata sa avatar inicijali + ime + lokacija, grid 1→3 kolone
B3: Countdown timer — components/landing/countdown-section.tsx, target datum u config.ts, prikazuje dane/sate/minute/sekunde, gradient pozadina
B4: Newsletter signup — components/landing/newsletter-section.tsx, email input + "Obavesti me" dugme, UI-only placeholder (bez backend-a)
B5: Phone mockup u hero — izmena hero-section.tsx, CSS phone frame sa map preview/gradient unutra, desno na desktopu / ispod na mobilnom
Faza C — UI komponente (paralelno sa Fazom B)

C1: Kompletan footer — prepis site-footer.tsx, 3 kolone (Proizvod, Kompanija, Pravno) + social ikone + copyright
C2: Cookie consent banner — components/cookie-banner.tsx, fixed bottom bar + "Prihvati" dugme, localStorage persistencija
C3: Scroll-to-top — components/scroll-to-top.tsx, okruglo dugme donji desni ugao, pojavljuje se nakon 400px skrola, framer-motion fade
C4: Dark mode toggle u site-navbar.tsx — Sun/Moon ikona, localStorage + prefers-color-scheme detekcija
Faza D — Animacije (nakon B + C)

D1: Wrap sve sekcije u <motion.div> sa whileInView fade-in + slide-up efektom (once: true, viewport.amount: 0.2)
D2: Staggered animacije na grupnim elementima — info kartice, leaderboard, FAQ, testimonials (svaka stavka ulazi sa malim zakasnjenjem)
Faza E — Integracija (finalna)

E1: Ažurirati app/[locale]/page.tsx sa svim novim sekcijama u finalnom redosledu
E2: Dodati cookie banner + scroll-to-top u layout.tsx
E3: npm run build + npm run typecheck verifikacija
Finalni redosled sekcija na stranici:

Relevantni fajlovi:

Novi (8): faq-section.tsx, testimonials-section.tsx, countdown-section.tsx, newsletter-section.tsx, cookie-banner.tsx, scroll-to-top.tsx, theme-provider.tsx, lib/hooks/use-theme.ts
Izmene (11): package.json, globals.css, layout.tsx (oba), page.tsx, site-navbar.tsx, hero-section.tsx, site-footer.tsx, content-sections.tsx, sva 3 messages/*.json, config.ts
Verifikacija:

npm run build — kompilacija svih novih ruta i komponenti
npm run typecheck — TypeScript bez grešaka
Manual check — dark mode toggle, responsive mobile meni, cookie dismiss, animacije na scroll
Odluke:

Dark mode: CSS varijable + Tailwind class strategija (ne media)
Cookie: localStorage persistencija, bez backend-a
Newsletter: UI-only, submit ne radi (V2)
Countdown: target datum u config.ts
Testimonials: fake placeholder podaci
Animacije: framer-motion whileInView sa once: true