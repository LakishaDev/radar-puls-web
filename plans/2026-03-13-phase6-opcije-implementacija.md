# Plan implementacije opcija E1-E10

Datum: 2026-03-13
Status: U toku

## Cilj
Implementirati opcije iz `docs/phase6_plan.md` redom (E1 -> E10) u web repozitorijumu.

## Koraci
1. E1: WebSocket live update za mapu (`new_report`, `report_updated`, `report_removed`).
2. E2: Glasanje (up/down) na izvestajima sa optimistickim osvezavanjem.
3. E3: Heatmap mod sa toggle prikazom Markeri/Heatmapa.
4. E4: Public report forma na mapi sa slanjem na API.
5. E5: Event expiry prikaz i auto-sakrivanje isteklih izvestaja + countdown.
6. E6: Event clustering validacija i dorada (vec postoji, samo kompatibilnost sa novim funkcijama).
7. E7: Push notifikacije (browser permission + SW registracija + subscribe endpoint).
8. E8: Javna statistika ruta `/statistika` sa karticama i histogramima.
9. E9: Dark/Light tiles validacija (vec postoji, zadrzati i uskladiti).
10. E10: Geolokacija korisnika validacija (vec postoji, zadrzati i uskladiti).
11. i18n: Dodati poruke za nove UI elemente (`en`, `sr-latn`, `sr-cyrl`).
12. Verifikacija: `npm run typecheck` i `npm run build` (ili minimum typecheck ako build traje predugo).

## Napomena
Gde backend endpoint jos nije spreman, frontend implementacija mora imati graceful fallback i jasnu poruku korisniku.
