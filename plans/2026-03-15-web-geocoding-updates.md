# Plan: Web geocoding updates (Google migracija)

Datum: 2026-03-15
Status: U TOKU (faza 1-3 implementirane)
Prioritet: Srednji

## Implementirano

- [x] Dodan `GeoSource` union tip u `lib/api.ts`.
- [x] `MapReport.geoSource` prebacen sa `string | null` na `GeoSource`.
- [x] Uvedena normalizacija `toGeoSource()` za bezbedno parsiranje API vrednosti.
- [x] Prosiren `AdminEventDetail` sa `geoSource: GeoSource` u `lib/admin-api.ts`.
- [x] `normalizeDetail()` parsira i `geoSource` i `geo_source`.
- [x] U `components/landing/map-client.tsx` dodat vizuelni indikator za `google_partial` u popup-u.
- [x] Za `google_partial` marker dodata niza opacnost (`opacity=0.78`).
- [x] U `components/admin/admin-event-detail-client.tsx` dodat prikaz `geoSource` polja.
- [x] Dodati i18n kljucevi za map geocoding source u `messages/en.json`, `messages/sr-latn.json`, `messages/sr-cyrl.json`.
- [x] Dodati i18n kljuc `admin.eventDetail.fields.geoSource` u sva tri locale fajla.

## Validacija

- [x] `npm run typecheck`
- [x] `npm run lint -- lib/api.ts lib/admin-api.ts components/landing/map-client.tsx components/admin/admin-event-detail-client.tsx`
- [x] `npm run qa:preview:up` (27/27 ruta PASS)

## Sledece

- [ ] Rucno QA testiranje sa podacima koji imaju `geoSource` vrednosti: `google`, `google_partial`, `cache`, `fallback`, `nominatim`, `demo`.
- [x] Lokalizovan prikaz admin `geoSource` vrednosti (`fallback`, `google_partial`, itd.) umesto raw string-a.

## Rucni QA checklist (`geoSource`)

Preduslovi:
- Pokrenut preview (`npm run preview:worker`) ili dev (`npm run dev`).
- API vraca bar po jedan report za svaku vrednost `geoSource`.
- Testirati bar na `sr-latn` i `en` locale-u.

Koraci po vrednosti:

1. `google`
- [ ] Mapa popup prikazuje badge `Google Maps` (`map.geo.source.google`).
- [ ] Marker ima punu opacnost (nije faded).
- [ ] Admin detail prikazuje lokalizovan naziv source-a.

2. `google_partial`
- [ ] Mapa popup prikazuje `Priblizna lokacija` / `Approximate location` (`map.geo.approximate`).
- [ ] Marker je vizuelno oslabljen (`opacity` oko `0.78`).
- [ ] Admin detail prikazuje lokalizovan naziv za pribliznu lokaciju.

3. `cache`
- [ ] Mapa popup prikazuje `Potvrdjena lokacija` / `Verified location`.
- [ ] Marker ostaje pune opacnosti.
- [ ] Admin detail prikazuje lokalizovan naziv source-a.

4. `fallback`
- [ ] Mapa popup prikazuje `Poznata lokacija` / `Known location`.
- [ ] Marker ostaje pune opacnosti.
- [ ] Admin detail prikazuje lokalizovan naziv source-a.

5. `nominatim` (legacy)
- [ ] Mapa popup prikazuje `OpenStreetMap`.
- [ ] Nema runtime greske zbog legacy vrednosti.
- [ ] Admin detail prikazuje lokalizovan naziv source-a.

6. `demo`
- [ ] Demo podaci i dalje rade i prikazuju `Demo lokacija` / `Demo location`.
- [ ] Nema regresije u fallback rezimu kada API nije dostupan.

7. `null` / nepoznata vrednost
- [ ] Ako je `geoSource = null`, badge se ne prikazuje na mapi.
- [ ] Ako backend vrati nepoznatu vrednost, normalizacija je mapira na `null` bez crash-a.
- [ ] Admin detail prikazuje `--` za nedostajucu vrednost.

Finalna provera:
- [ ] `npm run typecheck`
- [ ] `npm run lint -- components/landing/map-client.tsx components/admin/admin-event-detail-client.tsx lib/api.ts lib/admin-api.ts`
- [ ] `npm run qa:preview:up`
