/* Part-145 – norske strenger (presentasjon/UI).
 * Score-nedtrekk, volum-nedtrekk, matrise-celleverdier og nivånavn samt
 * tilsynsplan-tabellen oversettes IKKE (DATA).
 * Forkortelser beholdes: Part-145/21/OPS/CAMO, CAA, CAA-N, SPI, MoC, AltMoc,
 * ISO, IOSA, ARC, AR, AR-privilegium, MSAT, Y/N, P/S/O/E, N/A.
 * Lastes etter js/lang/*.js og før js/navbar.js. */
I18n.register("no", {
    p145: {
        title: "Part-145 organisasjonsvurdering",

        org: "Organisasjon:",
        ref: "Godkjenningsref.:",
        filledBy: "Utfylt av:",
        date: "Vurderingsdato:",

        resPerf: "Ytelsesnivå",
        resComp: "Kompleksitetsnivå",
        resCrit: "Kritikalitet",
        resPeriod: "Tilsynsperiode",
        resPlan: "Tilsynsplan",

        matrixShow: "► Vis detaljerte matriser og tilsynsplan",
        matrixHide: "▼ Skjul detaljerte matriser og tilsynsplan",

        critMatrixTitle: "Kritikalitetsmatrise (ytelse vs. kompleksitet)",
        planMatrixTitle: "Tilsynsplanmatrise (kritikalitet vs. kompleksitet)",

        ovHeadPlan: "Tilsynsplan",
        ovHeadAudit: "Revisjon",
        ovHeadSplit: "delt omfang",
        ovHeadAnnual: "årlig vurdering",
        ovHeadAM: "AM-møte",
        ovHeadFocused: "fokusert inspeksjon",
        ovHeadUnannounced: "uanmeldt",

        formTitle: "Vurderingsskjema",

        secA: "A. Tilsynsperiode – Ref. 145.B.305",
        secB: "B. Organisasjonens særlige art og kompleksiteten i dens aktiviteter – Ref. 145.B.305",

        thCriteria: "Kriterier",
        thPerf: "Ytelse",
        thPerfAvg: "Snitt ytelse",
        thComp: "Kompleksitet",

        A1: "1. Identifisering av flysikkerhetsfarer og håndtering av tilknyttede risikoer",
        A1a: "a. Identifisere og håndtere sikkerhetsfarer (register, SPI, vurdering)",
        A1b: "b. håndtering",
        A2: "2. Kontinuerlig samsvar med punkt 145.A.130 og full kontroll over alle endringer",
        A2a: "a. MoC (P/S/O/E)",
        A2b: "b. Endringer som ikke krever forhåndsgodkjenning, melding til CAA (P/S/O/E)",
        A2c: "c. Endringene gjennomføres først etter mottak av en formell godkjenning fra CAA",
        A3: "3. Nivå 1-funn fra CAA-N",
        A3num: "Antall funn",
        A4: "4. Gjennomføring av korrigerende tiltak innen tidsperioden som ble akseptert eller forlenget av vedkommende myndighet, som angitt i punkt 145.B.350.",
        A5: "*5. MSAT-score – hvis aktuelt, kombinert med Part-CAMO, Part-21, Part-OPS",
        A5score: "Score …",
        A5dateTitle: "Vurderingsdato",
        A6: "*6. Tot. antall Nivå 2-funn fra CAA-N – siste 24 mnd (innledende og kontinuerlig).",

        B1: "1. Effektiviteten av organisasjonens styringssystem",
        B1a: "a. Identifisere og håndtere avvik (organisasjon vs. CAA)",
        B1b: "b. lukking av avvik (inkl. organisasjon og myndigheter)",
        B2: "2. Implementering av bransjestandarder",
        B2a: "a. Sikkerhets- og samsvarsstyringsstandarder",
        B2ai: "i. ISO 45001",
        B2aii: "ii. ISO 9001",
        B2aiii: "iii. IOSA",
        B2aivOther: "Annet …",
        B3: "3. Prosedyren som benyttes for, og omfanget av, endringer som ikke krever forhåndsgodkjenning",
        B4: "4. Alternative samsvarsmetoder som benyttes",
        B4a: "a. Prosedyre implementert?",
        B4b: "b. Antall prosedyrer basert på «AltMoc».",
        B4c: "c. Antall prosedyrer basert på «AltMoc» utarbeidet av organisasjonen.",
        B5: "5. Antall godkjente vedlikeholdslokasjoner",
        B5a: "a. hoved- eller basevedlikeholdslokasjoner",
        B5b: "b. sekundære/linjelokasjoner – permanent bemannet",
        B5c: "c. separate sekundære/linjelokasjoner – ikke permanent bemannet",
        B5d: "d. verksted på separat lokasjon",
        B6: "6. Antall og type underleverandører som utfører Part-145-oppgave(r)",
        B7: "7. Aktivitetsvolumet for hver klasserettighet A, B, C og D",
        B7a: "Klasse A",
        B7b: "Klasse B",
        B7c: "Klasse C",
        B7d: "Klasse D",
        B8: "*8. Luftdyktighetsgjennomgang",
        B8a: "a. Antall rettigheter omfattet av AR-privilegium",
        B8b: "b. Utstedelse av ARC (Y/N)",
        B9: "*9. Utfører vedlikehold (kontrakter) for mer enn én kunde",
        B10: "*10. Styringssystem som dekker mer enn én godkjenning",
        B10a: "a. Totalt antall rettigheter omfattet av styringssystemet",

        optNo: "Nei",
        optYes: "Ja",

        comments: "Kommentarer:",

        confirmClear: "Er du sikker på at du vil nullstille skjemaet? Alle innlagte data går tapt."
    }
});
