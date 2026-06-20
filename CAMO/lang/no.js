/* CAMO – norske strenger (presentasjon/UI).
 * Score-nedtrekk, matrise-celleverdier og nivånavn oversettes IKKE (DATA).
 * Forkortelser beholdes: CAMO, CAA, CAA-N, SPI, MoC, AltMoc, ISO, IOSA, AMP,
 * ARC, AR, MSAT, Part-145/21/OPS, Y/N, P/S/O/E, N/A.
 * Lastes etter js/lang/*.js og før js/navbar.js. */
I18n.register("no", {
    camo: {
        title: "CAMO organisasjonsvurdering",

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

        secA: "A. Tilsynsperiode – Ref. CAMO.B.305(d)",
        secB: "B. Organisasjonens særlige art og kompleksiteten i dens aktiviteter – resultat av tidligere sertifiserings- eller tilsynsaktiviteter – Ref. CAMO.B.305 – AMC1 CAMO.B305",

        thCriteria: "Kriterier",
        thPerfInput: "Ytelse",
        thPerfAvg: "Snitt ytelse",
        thCompInput: "Kompleksitet",

        A1: "1. Identifisering av flysikkerhetsfarer og håndtering av tilknyttede risikoer",
        A1a: "a. Identifisere og håndtere sikkerhetsfarer (register, SPI, vurdering)",
        A1b: "b. håndtering",
        A2: "2. Kontinuerlig samsvar med punkt CAMO.A.130 og full kontroll over alle endringer",
        A2a: "a. MoC (P/S/O/E)",
        A2b: "b. Endringer som ikke krever forhåndsgodkjenning, melding til CAA (P/S/O/E)",
        A2c: "c. Endringene gjennomføres først etter mottak av en formell godkjenning fra CAA",
        A3: "3. Nivå 1-funn fra CAA-N (ingen tillatt) – Y/N",
        A4: "4. Gjennomføring av korrigerende tiltak innen tidsperioden som ble akseptert eller forlenget av vedkommende myndighet, som angitt i punkt CAMO.B.350.",
        A5: "*5. MSAT-score – hvis aktuelt, kombinert med Part-145, Part-21, Part-OPS",
        A6: "*6. Tot. antall Nivå 2-funn fra CAA-N – siste 24 mnd (innledende og kontinuerlig).",

        B1: "1. Effektiviteten av organisasjonens styringssystem når det gjelder å identifisere og håndtere avvik (for sikkerhetsfarer, se element A.1)",
        B1a: "a. Identifisere og håndtere avvik (organisasjon vs. CAA)",
        B1b: "b. lukking av avvik (inkl. organisasjon og myndigheter)",
        B2: "2. Organisasjonens implementering av bransjestandarder som er direkte (anerkjent) relevante for organisasjonens aktiviteter omfattet av denne forordningen;",
        B2a: "a. ISO 45001 – Arbeidsmiljø og sikkerhet",
        B2b: "b. ISO 9001 kvalitetsstyringssystemer",
        B2c: "c. IOSA",
        B3: "3. Prosedyren som benyttes for, og omfanget av, endringer som ikke krever forhåndsgodkjenning;",
        B4: "4. Eventuelle spesifikke prosedyrer implementert av organisasjonen knyttet til alternative samsvarsmetoder som benyttes;",
        B4a: "a. Prosedyre implementert?",
        B4b: "b. Antall prosedyrer basert på «AltMoc».",
        B4c: "c. Antall prosedyrer basert på «AltMoc» utarbeidet av organisasjonen.",
        B5: "5. Antall godkjente CAMO-lokasjoner og aktivitetene som utføres ved hver lokasjon (underleverandørlokasjoner dekkes av element 6.)",
        B6: "6. Antall og type underleverandører som utfører oppgaver innen kontinuerlig luftdyktighetsstyring",
        B7: "7. Aktivitetsvolumet for hver luftfartøytype / -serie / -gruppe, der det er aktuelt",
        B7a: "a. Rotorvinge og fastvinge (Y/N)",
        B7b: "b. Antall godkjente AMP",
        B7c: "c. Komplekse motordrevne luftfartøy",
        B7d: "d. Antall luftfartøy",
        B8: "*8. Luftdyktighetsgjennomgang",
        B8a: "a. Antall rettigheter omfattet av AR-privilegium",
        B8b: "b. Utstedelse av ARC (Y/N)",
        B9: "*9. Flygetillatelse (godkjent for utstedelse)",
        B10: "*10. Styringssystem som dekker mer enn én godkjenning (Y/N)",
        B10a: "a. Totalt antall rettigheter omfattet av styringssystemet",

        optNo: "Nei",
        optYes: "Ja",

        customStandard: "Egen standard ...",
        comments: "Kommentarer:",

        confirmClear: "Er du sikker på at du vil nullstille skjemaet?"
    }
});
