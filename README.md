# Complexity Matrix Kalkulatorer

Dette prosjektet inneholder web-baserte kalkulatorer for å beregne kompleksitetsprofiler for ulike luftfartsoperasjoner.

## Formål

Verktøyene er designet for å gi en standardisert poengsum basert på en rekke faktorer relatert til en operatørs ressurser, flåte, operasjonelle omfang og godkjenninger. Dette gir et kvantitativt mål på en operatørs kompleksitet.

## Mappestruktur

Prosjektet er organisert i undermapper for hver type operasjon:

/ComplexityMatrix
|-- index.html              <-- Hovedsiden med lenker til de ulike kalkulatorene
|-- smallLogo.png           <-- Favicon for prosjektet
|-- README.md               <-- Denne filen
|
|-- /FixedWing              <-- Mappe for Fixed Wing-kalkulatoren
|   |-- fixed-wing.html     <-- Hovedsiden for kalkulatoren
|   |-- oversikt.html       <-- En side som viser alle poengreglene
|   |-- /css
|   |   |-- stil.css
|   |   |-- oversikt_stil.css
|   |-- /js
|   |   |-- kalkulator.js   <-- Hovedlogikken for kalkulatoren
|   |   |-- oversikt_bygger.js <-- Skript som bygger oversiktssiden
|   |-- /data
|       |-- operators.json  <-- Liste over operatører for nedtrekksmeny
|       |-- scoring.json    <-- Alle poengreglene for kalkulatoren
|
|-- /Rotary                 <-- Mappe for Rotary Wing (helikopter)
|   |-- (lignende filstruktur)
|
|-- /UAS                    <-- Mappe for UAS (droner)
|-- (lignende filstruktur)

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