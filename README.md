# CAA Organisation Assessment Tools

Dette prosjektet inneholder en samling web-baserte verktøy for å utføre risikovurderinger og "Organisation Assessments" av ulike typer luftfartsoperatører og organisasjoner.

## Formål

Verktøyene er designet for å kartlegge en operatørs profil basert på ressurser, flåte, operasjonell kompleksitet, godkjenninger og ytelse (Performance/Compliance). Dette danner grunnlaget for tilsynsplanlegging og risikostyring.

## Arbeidsflyt og Datahåndtering

Systemet er bygget opp rundt følgende dataflyt:

1.  **Utfylling:** Inspektøren fyller ut skjemaet i nettleseren for den aktuelle organisasjonen.
2.  **CSV-generering:** Ved ferdigstillelse lastes det ned en fil med filendelse **.dat**. Denne inneholder data i CSV-format (kommaseparerte verdier). Dette gjøres for å sikre korrekt håndtering av tegnsett og import i etterfølgende systemer (Power Automate).
3.  **SharePoint:** Filen (.dat) lastes opp til et spesifisert område i SharePoint (lenke finnes i verktøyene).
4.  **Power Automate & Microsoft Lists:** En Power Automate-flyt trigger på opplastingen, parser innholdet (som er CSV), og oppdaterer en sentral Microsoft Liste. Dette gir en helhetsoversikt over risikobildet og kompleksiteten på tvers av alle operatører.

## Mappestruktur og Moduler

Prosjektet er organisert i undermapper for hvert fagområde/domene:

```text
/ComplexityMatrix/
├── index.html                  <-- Landingsside med navigasjon til alle verktøy
├── README.md                   <-- Denne filen
├── css/                        <-- Felles stilark
│
├── FFO (Flight Operations)
│   ├── FixedWing/              <-- Kalkulator for flyoperatører
│   ├── Rotor/                  <-- Kalkulator for helikopteroperatører
│   └── MSAT-FFO/               <-- Management System Assessment Tool for FFO
│
├── FOA (Flight Crew/Aeromedical/ATO)
│   ├── ATO/                    <-- Kalkulator for Approved Training Organisations
│   └── MSAT-FOA/               <-- Management System Assessment Tool for FOA
│
├── FLD (Airworthiness)
│   ├── CAMO/                   <-- Vurdering av Part-CAMO organisasjoner
│   └── Part145/                <-- Vurdering av Part-145 vedlikeholdsorganisasjoner
│
├── FUL (Unmanned Aviation)
│   └── UAS/                    <-- Risikoprofilverktøy for droneselskaper
│
└── Common Tools
    └── MSAT/                   <-- Generisk MSAT-verktøy
```

## Teknisk Beskrivelse

Hver modul fungerer som en frittstående "Single Page Application" (SPA).

* **HTML:** Definerer strukturen på skjemaene.
* **CSS:** Bruker en felles fargeprofil (se under) og spesifikke stiler for hver modul for å skille domenene visuelt.
* **JavaScript:** Håndterer:
    * Innlasting av dynamiske data (operatørlister, scoringsregler) fra JSON-filer.
    * Sanntidsberegning av poengsummer og visualisering (gauges/metere).
    * Generering og parsing av CSV-filer for eksport/import.
* **Data (JSON):** Logikken for poenggivning og lister over operatører ligger separert i `/data`-mapper for hver modul. Dette gjør det enkelt å oppdatere vekting og operatører uten å endre kildekoden.

## Fargeprofil (Color Profile)

Prosjektet bruker en definert fargepalett for å sikre et konsistent visuelt uttrykk i tråd med designmanualen.

| Farge          | HEX       | Bruksområde                                      |
| :------------- | :-------- | :----------------------------------------------- |
| Mørk Blå       | `#03477F` | Hovedfarge, overskrifter, Policy (MSAT)          |
| Oransje        | `#F06C00` | Risk (MSAT), fremheving, advarsler               |
| Dempet Grønn   | `#6A8E7F` | Assurance (MSAT), Fleet Specific                 |
| Grå/Mørk       | `#343a40` | Extension (MSAT), generelle overskrifter         |
| Veldig Lys Blå | `#EEFAFF` | Bakgrunnsfarge for seksjonsbokser                |

## Mulig arbeidsflyt:
1. Forberedelse av innhold
Lag et utkast til innhold, spørsmål og scoringsverdier for skjemaet i Excel eller som et tekstdokument.

2. AI-assistert koding (Gemini)
Åpne Gemini og last opp/importer eksisterende repository som kontekst. Kopier inn teksten fra utkastet ditt og forklar nøyaktig hva du skal ha. Husk å spesifisere at den nye koden skal bruke samme standardiserte layout og CSS-stilark som de andre skjemaene.

3. Implementering i editor
Kopier koden generert av Gemini og lim den inn i de riktige filene (HTML, JS, JSON) i Visual Studio Code (VS Code).

4a. Lokal testing av koden
Test koden lokalt i nettleseren.

Hvordan teste lokalt: Siden systemet deres laster inn data fra JSON-filer, vil du få en såkalt "CORS-feil" hvis du bare dobbeltklikker på HTML-filen. Løsningen er å installere utvidelsen "Live Server" i VS Code. Når den er installert, trykker du bare på "Go Live" nederst i høyre hjørne av VS Code. Dette starter en lokal server og åpner prosjektet i nettleseren. Endringer du gjør i koden vil oppdateres automatisk.

Feilretting: Hvis noe ikke fungerer eller ser feil ut, gå tilbake til steg 2/3 (be Gemini om hjelp til å feilsøke eller tilpass koden selv).

4b. Parallelt: Oppsett av Microsoft 365-infrastruktur
Mens koden ferdigstilles, sett opp datamottaket:

Tilpass Sharepoint-mappestruktur for filopplasting under Luftfartstilsynet-Organisation Assessment (Team: Luftfartstilsynet, Privat kanal: Organisation Assessment).

Opprett en oversiktsliste i Microsoft Lists (inkludert formatering av kolonner).

Sett opp en Power Automate-flyt for automatisert overføring av data fra opplastede filer (.dat-filer som er strukturert som .csv) til Microsoft Lists.

Test flyten. Tips: Gemini kan assistere med å skrive uttrykk eller feilsøke i Power Automate hvis den feiler.

5. Versjonskontroll
Når koden fungerer lokalt og testene er vellykkede, push koden til Luftfartstilsynet sitt GitHub-repository.

6. Produksjon
IT-avdelingen henter den nyeste koden fra GitHub og laster den opp til produksjonsserveren (tools.caa.no).
