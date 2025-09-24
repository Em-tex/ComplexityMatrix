# Complexity Matrix Kalkulatorer

Dette prosjektet inneholder web-baserte kalkulatorer for å beregne kompleksitetsprofiler for ulike luftfartsoperasjoner.

## Formål

Verktøyene er designet for å gi en standardisert poengsum basert på en rekke faktorer relatert til en operatørs ressurser, flåte, operasjonelle omfang og godkjenninger. Dette gir et kvantitativt mål på en operatørs kompleksitet.

## Mappestruktur

Prosjektet er organisert i undermapper for hver type operasjon:

/ComplexityMatrix
|-- index.html                  <-- Hovedsiden med lenker til de ulike kalkulatorene
|-- css/
|   |-- stilark.css             <-- Stilark for hovedsiden
|-- smallLogo.png               <-- Favicon for prosjektet
|-- README.md                   <-- Denne filen
|
|-- /FixedWing                  <-- Mappe for Fixed Wing-kalkulatoren
|   |-- fixed-wing.html         <-- Hovedsiden for kalkulatoren
|   |-- oversikt.html           <-- En side som viser alle poengreglene
|   |-- /css
|   |   |-- stil.css
|   |   |-- oversikt_stil.css
|   |-- /js
|   |   |-- kalkulator.js         <-- Hovedlogikken for kalkulatoren
|   |   |-- oversikt_bygger.js  <-- Skript som bygger oversiktssiden
|   |-- /data
|       |-- operators.json      <-- Liste over operatører for nedtrekksmeny
|       |-- scoring.json        <-- Alle poengreglene for kalkulatoren
|
|-- /Rotary                     <-- Mappe for Rotary Wing (helikopter)
|   |-- (lignende filstruktur)
|
|-- /UAS                        <-- Mappe for UAS (droner)
|   |-- (lignende filstruktur)
|
|-- /CAMO                       <-- Mappe for CAMO-kalkulatoren
|   |-- (lignende filstruktur)
|
|-- /Part145                    <-- Mappe for Part145-kalkulatoren
|   |-- (lignende filstruktur)
|
|-- /MSAT                       <-- Mappe for Management System Assessment Tool
    |-- msat.html               <-- Hovedsiden for verktøyet
    |-- /css
    |   |-- style.css
    |-- /js
    |   |-- calculator.js       <-- Hovedlogikken for verktøyet
    |-- /data
        |-- msat_data.json      <-- Spørsmål og struktur for skjemaet
        |-- scoring.json        <-- Poengregler for P, S, O, E
        |-- organisation_types.json <-- Liste over organisasjonstyper for autofullføring

## Hvordan det fungerer

Hver kalkulator (f.eks. `FixedWing`) er en frittstående applikasjon.
- **HTML (`.html`):** Definerer strukturen og innholdet på siden.
- **CSS (`/css`):** Styrer design og utseende.
- **JavaScript (`/js`):** Håndterer all funksjonalitet, inkludert:
  - Innlasting av regler og data fra `/data`-mappen.
  - Beregning av poengsummer i sanntid.
  - Visuell oppdatering av verdier og "gauges".
  - Funksjonalitet for knapper (lagre, laste, tømme).
- **Data (`/data`):** JSON-filer som inneholder de faktiske poengreglene og listene. Dette gjør det enkelt å oppdatere poeng uten å endre koden.


## Fargeprofil (Color Profile)

Prosjektet bruker en definert fargepalett for å sikre et konsistent visuelt uttrykk.

| Farge          | HEX       | RGB             | Bruksområde                                        |
| :------------- | :-------- | :-------------- | :------------------------------------------------- |
| Mørk Blå       | `#03477F` | `3, 71, 127`    | Hovedfarge for overskrifter, primære tabellhoder.    |
| Oransje        | `#F06C00` | `240, 108, 0`   | Fremheving, markerte celler i matriser.            |
| Dempet Grønn   | `#6A8E7F` | `106, 142, 127` | Sekundære tabellhoder (Kritikalitet, Plan).        |
| Lys Himmelblå  | `#9ADFF3` | `154, 223, 243` | Potensiell fremtidig bruk for UI-elementer.        |
| Veldig Lys Blå | `#EEFAFF` | `238, 250, 255` | Bakgrunnsfarge for seksjonsbokser.                 |
| Sort           | `#000000` | `0, 0, 0`       | Brødtekst og generelle grenser.                    |
| Hvit           | `#FFFFFF` | `255, 255, 255` | Bakgrunnsfarge for hovedinnhold, tekst i fargede hoder. |