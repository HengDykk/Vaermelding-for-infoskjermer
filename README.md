# Værmelding for infoskjermer

Statisk Cloudflare Pages-side laget for en alltid-på infoskjerm med værdata for Stavanger.

Siden er bygget for å være lett, rask og lesbar på stor skjerm: én HTML-fil, lokale bakgrunnsbilder, offisielle Yr/MET-værsymboler og en liten Cloudflare Function for pollenvarsel.

## Live side

https://vaermelding-for-infoskjermer.pages.dev/

## Hva vises

- Nåværende temperatur for Stavanger
- Føles som-temperatur
- Værbeskrivelse fra Yr/MET-symbolkode
- Vindstyrke med kompassretning og pil
- Vindkast
- Nedbør neste time
- Luftfuktighet
- Pollenvarsel for Rogaland i dag
- Sol opp og sol ned
- Klokke med sekunder
- Fire dagers prognose
- Dynamisk dag/natt/kveldsmodus
- Dynamiske bakgrunner basert på værtype

## Datakilder

### Værdata

Værdata hentes via eksisterende Worker:

```text
https://vaer-stavanger.arild-dahl-andersen.workers.dev
```

Siden kaller denne med koordinater for Stavanger:

```text
lat=58.969975
lon=5.733107
```

Worker-responsen følger MET Locationforecast-struktur, og siden bruker blant annet:

- `air_temperature`
- `wind_speed`
- `wind_speed_of_gust`
- `wind_from_direction`
- `relative_humidity`
- `symbol_code`
- `precipitation_amount`

### Værsymboler

Værsymbolene lastes fra MET sitt offisielle ikonsett:

```text
https://github.com/metno/weathericons
```

Filnavnene matcher `symbol_code` direkte, for eksempel:

```text
clearsky_day.svg
partlycloudy_night.svg
rainshowers_day.svg
```

### Pollen

Pollenvarsel hentes fra NAAF sitt pollenvarsel:

```text
https://pollenvarsel.naaf.no/charts/forecast
```

Cloudflare Functionen `functions/api/pollen.js` parser dagens varsel for `Rogaland` og eksponerer det som:

```text
/api/pollen
```

## Bakgrunner

Bakgrunnsbilder ligger lokalt i `images/`.

Dagvarianter:

- `clear.jpg`
- `partlycloudy.jpg`
- `cloudy.jpg`
- `rain.jpg`
- `snow.jpg`
- `fog.jpg`

Natt/kveldsvarianter:

- `clear_night.jpg`
- `partlycloudy_night.jpg`
- `cloudy_night.jpg`
- `rain_night.jpg`
- `snow_night.jpg`
- `fog_night.jpg`

Når `symbol_code` inneholder `_night` eller `_polartwilight`, settes siden i mørk modus og bruker nattbakgrunn der den finnes.

## Prosjektstruktur

```text
.
├── index.html
├── wrangler.jsonc
├── README.md
├── images/
│   ├── clear.jpg
│   ├── clear_night.jpg
│   ├── cloudy.jpg
│   ├── cloudy_night.jpg
│   ├── fog.jpg
│   ├── fog_night.jpg
│   ├── partlycloudy.jpg
│   ├── partlycloudy_night.jpg
│   ├── rain.jpg
│   ├── rain_night.jpg
│   ├── snow.jpg
│   └── snow_night.jpg
└── functions/
    └── api/
        └── pollen.js
```

## Deploy

Prosjektet deployes med Cloudflare Pages.

Anbefalte innstillinger:

- Framework preset: `None`
- Build command: tom
- Build output directory: `./`
- Production branch: `main`

`wrangler.jsonc`:

```json
{
  "name": "stavanger-vaermelding-infoskjerm",
  "compatibility_date": "2025-12-01",
  "pages_build_output_dir": "./"
}
```

## Lokal utvikling

Siden kan åpnes direkte som statisk HTML, men pollen-endepunktet krever Cloudflare Pages Functions for å fungere lokalt.

For full lokal test med Pages Functions kan Wrangler brukes:

```bash
npx wrangler pages dev .
```

## Drift

- Værdata oppdateres hvert 5. minutt i nettleseren.
- Klokken oppdateres hvert sekund.
- Pollenvarselet caches i Cloudflare Functionen.
- Siden har mørk initial bakgrunn for å unngå hvit blink ved refresh.
- Designet er ment for fullskjerm/kioskvisning på infoskjerm.
