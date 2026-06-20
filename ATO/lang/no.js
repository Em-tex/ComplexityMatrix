/* ATO – norske strenger (presentasjon/UI + brukermeldinger).
 * Select-alternativenes tekst er DATA (CSV-matching) og oversettes IKKE.
 * Forkortelser/etablerte termer beholdes: ATO, FTE, FSTD, AOC, CAMO, IFR, NCO,
 * NCC, SPA, SPO, ME, SE, FCL, LAPL, PPL, CPL, ATPL, IR, Part-IS, N/A.
 * Lastes etter js/lang/*.js og før js/navbar.js. */
I18n.register("no", {
    ato: {
        title: "ATO – kompleksitetsmatrise",

        operator: "Operatør:",
        operatorPlaceholder: "Velg eller skriv operatørnavn",
        filledBy: "Fylt ut av:",
        filledByPlaceholder: "Skriv inn navn",
        date: "Dato:",

        gResources: "Ressurser",
        gFleet: "Flåte og FSTD",
        gOperations: "Operasjoner",
        gApprovals: "Godkjenninger",
        gTotal: "Totalscore",
        gPerformance: "Ytelse",

        thCriteria: "Kriterium",
        thSelection: "Valg",
        thValue: "Verdi",
        selectPlaceholder: "Velg...",
        optNo: "Nei",
        optYes: "Ja",

        // Resources
        staffFte: "Antall ansatte i operasjonen (årsverk)",
        employedInstructors: "Antall ansatte instruktører",
        contractInstructors: "Antall deltidsinstruktører på kontrakt",
        complexOrganisation: "Kompleks organisasjon (erklært)",
        leadingRoles: "Ledende personell har flere roller",

        // Operations
        ifrOperation: "IFR-operasjon",
        nco: "NCO",
        ncc: "NCC",
        spaSpo: "SPA eller SPO",
        holdsAoc: "Operatøren har også AOC",
        ownCamo: "ATO har egen CAMO",
        hasFstdOrg: "Organisasjonen har også en FSTD-organisasjon",
        subcontractors: "Antall underleverandører",

        // Fleet & FSTD
        numberOfTypes: "Antall ulike typer eller klasser (modeller) som ATO opererer",
        meAircraft: "Antall flermotors (ME) luftfartøy",
        seAircraft: "Antall enmotors (SE) luftfartøy",
        leasedFromAoc: "Leide luftfartøy fra AOC utenfor egen organisasjon",
        privatelyLeased: "Privat leide luftfartøy",
        numberOfFstds: "Antall FSTD-er brukt til trening",

        // Approvals
        integratedCourses: "Integrerte kurs",
        fclCourses: "Antall godkjente FCL-kurs",
        theoryLaplPpl: "Frittstående teorikurs for LAPL/PPL",
        theoryCplAtplIr: "Frittstående teorikurs for CPL/ATPL/IR",
        numberOfBases: "Antall baser (hoved- og sekundærbaser)",
        basesOutsideNorway: "Sekundærbase(r) utenfor Norge",
        partIs: "Part-IS",

        comments: "Kommentarer:",
        commentsPlaceholder: "Legg til eventuelle kommentarer her...",
        oversiktLink: "Oversikt over poengberegning",

        // oversikt.html
        oversiktTitle: "Poengberegning for ATO",
        dependentOnInstructors: "Avhengig av antall ansatte instruktører:",
        standardLabel: "Standard",
        loadErrorTitle: "Feil ved lasting av data",
        loadErrorBody: "Klarte ikke å laste poengoversikten. Sjekk at 'data/ato_scoring.json' eksisterer. Detaljer: {msg}",

        // Brukermeldinger (JS)
        confirmClear: "Er du sikker på at du vil tømme skjemaet? All lagret data vil bli slettet.",
        errOperatorRequired: "Operatørnavn må fylles ut.",
        errFilledByRequired: "Fylt ut av må fylles ut.",
        errChoiceRequired: "Vennligst gjør et valg for «{label}».",
        formIncomplete: "Skjemaet er ikke fullstendig utfylt:",
        dataLoaded: "CSV-fil lastet inn!",
        fileEmpty: "CSV-filen er tom eller ugyldig.",
        loadError: "FEIL: Kunne ikke laste inn datafiler (scoring/operators). Siden kan ikke fungere.",
        unknownOperator: "UkjentOperatør"
    }
});
