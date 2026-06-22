/* Rotor – norske strenger (presentasjon/UI + brukermeldinger).
 * Feltene speiler det rotor-spesifikke skjemaet (matcher data/scoring.json = fasit).
 * Select-alternativenes tekst er DATA (CSV-matching) og oversettes IKKE.
 * Forkortelser/etablerte termer beholdes: AOC, SPO, NCC, RNP, NVIS, HHO, HEMS,
 * HOFO, SAR, EFB, FRMS, ATO, IFR, VFR, CAT.POL.H.305, HR SPO, N/A.
 * Lastes etter js/lang/*.js og før js/navbar.js. */
I18n.register("no", {
    rotor: {
        title: "Rotor Wing – kompleksitetsmatrise",

        operator: "Operatør:",
        selectOperator: "Velg operatør...",
        operatorManualPlaceholder: "Skriv inn manuelt (kun hvis mangler)",
        manualTitle: "Skriv inn manuelt",
        backToListTitle: "Tilbake til liste",
        filledBy: "Fylt ut av:",
        filledByPlaceholder: "Skriv inn navn",
        date: "Dato:",

        gResources: "Ressurser",
        gFleet: "Flåtespesifikt",
        gOperations: "Operasjoner",
        gApprovals: "Godkjenninger",
        gTotal: "Totalscore",

        // Tilsynspakke-legende (over gaugene)
        supervisionPackage: "Tilsynspakke",
        group: "Gruppe",

        thCriteria: "Kriterium",
        thSelection: "Valg",
        thValue: "Poeng",
        selectPlaceholder: "Velg...",
        optNo: "Nei",
        optYes: "Ja",

        // Resources
        staffEmployed: "Antall ansatte i operasjonen",
        pilotsEmployed: "Antall ansatte piloter",
        technicalCrew: "Teknisk besetning om bord",
        leadingRoles: "Ledende personell har flere roller",
        leadingRolesTooltip: "Score øker med antall piloter, da dette indikerer høyere organisatorisk kompleksitet for større selskaper.",

        // Fleet
        typesOperated: "Antall typer som opereres",
        multiOffshore: "Antall flermotors helikoptre som opererer offshore",
        multiOnshore: "Antall flermotors helikoptre som opererer onshore",
        singleEngine: "Antall enmotors helikoptre som opereres",
        acLeasing: "Leasing av luftfartøy",
        specialMod: "Helikoptre med spesiell modifikasjon",

        // Operations
        numberOperationTypes: "Antall operasjonstyper",
        operationComplexity: "Operasjonskompleksitet",
        basesPermanently: "Antall baser der luftfartøy og/eller besetning er fast stasjonert",
        subcontractors: "Antall underleverandører",
        ifrVfr: "IFR/VFR-operasjon",
        singlePilot: "Enpilotsoperasjon",
        certificate: "Sertifikat",
        hrSpo: "HR SPO",
        groupAirline: "Gruppeflyselskap",
        derogations: "Antall dispensasjoner",

        // Approvals
        rnp03: "RNP 0.3",
        lvTakeoff: "Operasjoner ved lav sikt (AVGANG)",
        lvLanding: "Operasjoner ved lav sikt (LANDING)",
        dangerousGoods: "Farlig gods",
        catPolH305: "CAT.POL.H.305",
        nvis: "NVIS",
        hho: "HHO",
        hems: "HEMS",
        hofo: "HOFO",
        sar: "SAR",
        policeOperations: "Politioperasjoner",
        efbApproval: "EFB-godkjenning",
        frms: "FRMS",
        ato: "ATO",

        comments: "Kommentarer:",
        commentsPlaceholder: "Legg til eventuelle kommentarer her...",
        oversiktLink: "Oversikt over poengberegning",

        // oversikt.html
        oversiktTitle: "Poengberegning for Rotor Wing",
        dependentOnPilots: "Avhengig av piloter:",
        standardLabel: "Standard",
        noScoringRule: "Ingen poengregel definert",
        loadErrorTitle: "Feil ved lasting",
        loadErrorBody: "Klarte ikke å laste poengoversikten. Sjekk at filen 'data/scoring.json' eksisterer og at stien er riktig. Detaljer: {msg}",

        // Brukermeldinger (JS)
        confirmManual: "Vennligst sjekk listen nøye først.\n\nEr du sikker på at operatøren ikke finnes? Manuell inntasting skal KUN brukes hvis operatøren mangler i listen.",
        confirmClear: "Er du sikker på at du vil tømme skjemaet? All lagret data vil bli slettet.",
        errOperatorRequired: "Operatørnavn må fylles ut.",
        errFilledByRequired: "Fylt ut av må fylles ut.",
        errChoiceRequired: "Vennligst gjør et valg for «{label}».",
        formIncomplete: "Skjemaet er ikke fullstendig utfylt:",
        dataLoaded: "Data lastet inn!",
        fileEmpty: "Filen er tom eller ugyldig.",
        dropOnlyDat: "Vennligst slipp kun .dat eller .csv filer.",
        loadError: "FEIL: Kunne ikke laste inn datafiler. Siden kan ikke fungere.",
        unknownOperator: "UkjentOperatør"
    }
});
