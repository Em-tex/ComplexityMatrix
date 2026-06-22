/* FixedWing – norske strenger (presentasjon/UI + brukermeldinger).
 * Select-alternativenes tekst er DATA (CSV-matching) og oversettes IKKE.
 * Forkortelser/etablerte termer beholdes: ACMI, AOC, SPO, NCC, RNP AR APCH,
 * MNPS, NAT-HLA, RVSM, ETOPS, IMC, EFB, FRMS, ATQP, EBT, CCA, MOPSC, SPA.
 * Lastes etter js/lang/*.js og før js/navbar.js. */
I18n.register("no", {
    fw: {
        title: "Fixed Wing – kompleksitetsmatrise",

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

        staffEmployed: "Totalt antall ansatte i operasjonen",
        pilotsEmployed: "Antall ansatte piloter",
        cabinCrew: "Kabinbesetning om bord",
        leadingRoles: "Ledende personell har flere roller",
        leadingRolesTooltip: "Score øker med antall piloter, da dette indikerer høyere organisatorisk kompleksitet for større selskaper.",

        typesOperated: "Antall typer som opereres",
        mopsOver19: "Antall luftfartøy med MOPSC på MER enn 19 seter",
        mopsUnder19: "Antall luftfartøy med MOPSC på 19 seter eller MINDRE",
        specialMod: "Luftfartøy med spesiell modifikasjon",

        operationTypes: "Antall operasjonstyper",
        operationComplexity: "Operasjonskompleksitet",
        specialOperation: "Antall spesielle operasjoner (IKKE SPA)",
        derogations: "Antall dispensasjoner",
        airportsBased: "Antall lufthavner der luftfartøy og/eller besetning er fast stasjonert",
        subcontractors: "Antall underleverandører",
        acmi: "ACMI",
        certificate: "Sertifikat",

        rnpArApch: "RNP AR APCH",
        mnpsNatHla: "MNPS/ NAT-HLA",
        rvsm: "RVSM",
        lvTakeoff: "Operasjoner ved lav sikt (AVGANG)",
        lvLanding: "Operasjoner ved lav sikt (LANDING)",
        etops: "ETOPS",
        dangerousGoods: "Farlig gods",
        singleEngineImc: "Enmotors turbin IMC",
        efb: "Electronic Flight Bag",
        isolatedAerodromes: "Isolerte flyplasser",
        steepApproach: "Bratt innflyging",
        frms: "FRMS",
        crewTraining: "Besetningstrening",
        ccaTraining: "CCA-trening",

        comments: "Kommentarer:",
        commentsPlaceholder: "Legg til eventuelle kommentarer her...",
        oversiktLink: "Oversikt over poengberegning",

        // oversikt.html (poengberegning)
        oversiktTitle: "Poengberegning for Fixed Wing",
        hrSpo: "HR SPO",
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
        loadError: "FEIL: Kunne ikke laste inn datafiler (scoring/operators). Siden kan ikke fungere.",
        unknownOperator: "UkjentOperatør"
    }
});
