# Nauka

Darmowe quizy i materiały do nauki, robione przy okazji własnej nauki do szkoły.

**Strona:** https://vegesalmon.github.io/nauka/

## Zawartość

| Przedmiot | Materiał | Ścieżka |
|---|---|---|
| Geografia | Rzeki Polski (48 rzek): nauka, klikanie, wpisywanie; sekcje regionalne + wszystkie naraz | [`geografia/rzeki/`](geografia/rzeki/) |

## Zasady

- Każdy materiał to samodzielna strona `index.html` w folderze `przedmiot/temat/`, bez budowania i bez zależności poza fontami Google.
- Materiał trafia tutaj dopiero po sprawdzeniu treści.
- Nie kopiujemy treści z podręczników ani grafik wydawnictw. Źródła danych są podane przy każdym materiale.

## Statystyki

Licznik odwiedzin: [GoatCounter](https://www.goatcounter.com/) (bez ciasteczek i bez danych osobowych). Każda nowa strona dostaje przed `</body>`:

```html
<script data-goatcounter="https://vegesalmon-nauka.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
```

## Zbieranie odpowiedzi

Quizy wysyłają anonimowe odpowiedzi (pytanie, odpowiedź, czy poprawna, która próba, czas) do Workera na Cloudflare z bazą D1. Kod i instrukcja wdrożenia są w [`api/`](api/), a opis dla użytkowników w [`prywatnosc/`](prywatnosc/).

Każdy nowy materiał ładuje wspólny [`track.js`](track.js) i loguje zdarzenia:

```html
<script src="../../track.js"></script>
<script>
  NaukaTrack.init("przedmiot/temat");           // np. "geo/rzeki"
  NaukaTrack.log({t:"answer", r:runda, mo:tryb, se:sekcja, it:pytanie, re:odpowiedź, ok:true, tr:1, rt:1234});
</script>
```

Typy zdarzeń: `answer`, `reveal` (pokazanie dobrej odpowiedzi po 3 pomyłkach), `view` (podgląd w trybie nauki), `round_start`, `round_end`. Domyślnie identyfikator żyje tylko do zamknięcia strony. Stały identyfikator zapisuje się w przeglądarce dopiero po zaznaczeniu zgody (`NaukaTrack.setConsent(true)`). Dane wysyłane są wyłącznie ze strony na github.io.

## Dane

- Rzeki: © współtwórcy [OpenStreetMap](https://www.openstreetmap.org/copyright), licencja ODbL. Pobrane przez Overpass API, zrzutowane do układu PUWG 1992 i uproszczone. Krótkie przerwy (odcinki przez jeziora i zbiorniki) połączone prostymi odcinkami.
- Granice państw i jeziora: [Natural Earth](https://www.naturalearthdata.com/) (domena publiczna).
