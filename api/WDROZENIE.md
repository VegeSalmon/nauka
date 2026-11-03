# Wdrożenie zbierania danych (Cloudflare Worker + D1)

Około 15–30 minut, wszystko w przeglądarce na dash.cloudflare.com. Nazwy przycisków w panelu Cloudflare mogą się trochę różnić.

## 1. Baza D1

1. **Storage & Databases → D1 SQL Database → Create database**.
2. Nazwa: `nauka`. Lokalizację zostaw automatyczną albo wybierz Europę (Eastern/Western Europe).
3. Wejdź w bazę i otwórz zakładkę **Console**.
4. Wklej całą zawartość [`schema.sql`](schema.sql) i kliknij **Execute**. Jeśli konsola nie przyjmie kilku poleceń naraz, wklejaj je po jednym: `CREATE TABLE`, a potem oba `CREATE INDEX`.

## 2. Worker

1. **Workers & Pages → Create → Worker**, szablon „Hello World”.
2. Nazwa: `nauka-api`. Kliknij **Deploy**.
3. **Edit code**: usuń cały kod i wklej zawartość [`worker.js`](worker.js), potem **Deploy**.

## 3. Połączenie Workera z bazą

1. W Workerze `nauka-api`: **Settings → Bindings → Add → D1 database**.
2. Variable name: `DB` (wielkimi literami). Baza: `nauka`. Zapisz.

## 4. Klucz do pobierania danych (opcjonalnie, ale warto)

1. **Settings → Variables and Secrets → Add**, typ **Secret**.
2. Nazwa: `EXPORT_KEY`, wartość: długi losowy ciąg, np. z menedżera haseł. Nikomu go nie podawaj.

Dane pobierzesz potem jako CSV z adresu
`https://nauka-api.<twoje-konto>.workers.dev/export?key=TWÓJ_KLUCZ`

## 5. Sprawdzenie

Otwórz `https://nauka-api.<twoje-konto>.workers.dev/health`. Powinno się pokazać `{"ok":true}`.

Adres Workera (bez `/health`) wyślij Claude. Zostanie wpisany do `track.js` i od tego momentu quizy zaczną wysyłać dane.

## Podgląd danych

W konsoli D1 możesz od razu sprawdzać, np.:

```sql
SELECT item, COUNT(*) AS proby, ROUND(AVG(correct)*100) AS proc_ok
FROM events WHERE type='answer' AND try=1
GROUP BY item ORDER BY proc_ok;
```

```sql
SELECT item, resp, COUNT(*) AS ile
FROM events WHERE type='answer' AND correct=0 AND mode='pin'
GROUP BY item, resp ORDER BY ile DESC LIMIT 20;
```
