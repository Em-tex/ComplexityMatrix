/* UAS – engelske strenger (presentasjon/UI).
 * Select-VERDIER er DATA (nøkler i scoring.json) og endres ALDRI. Kun vist tekst
 * oversettes; hver oversatt <option> har data-en med engelsk tekst slik at CSV/
 * import alltid er engelsk. Tall, enheter, koder (OAT/LUC/STS/SAIL/VLOS/...),
 * vektklasser og de scorede SMS-nedtrekkene (Present/Suitable/Operating/Effective)
 * oversettes IKKE. CSV-etiketter bygges fra engelske JS-strenger i kalkulatoren.
 * Lastes etter js/lang/*.js og før js/navbar.js. */
I18n.register("en", {
    uas: {
        title: "UAS Risk Profile",
        heading: "UAS Complexity Matrix",
        filledBy: "Filled out by:",
        dateLabel: "Date:",

        operatorInfo: "Operator Information",
        operator: "Operator:",
        selectOperator: "Select operator...",
        operatorManualPlaceholder: "Enter manually (only if missing)",
        enterManually: "Enter manually",
        backToList: "Back to list",
        mainApprovalType: "Main approval type:",
        mainOperationTypes: "Main operation types:",
        selectType1: "Select type 1 (required)",
        selectType2: "Select type 2 (optional)",
        selectType3: "Select type 3 (optional)",

        gTotal: "Total Score",

        secResources: "Resources",
        secFleet: "Fleet Specific",
        secOperations: "Operations",
        secPerformance: "Performance",

        thCriteria: "Criteria",
        thSelection: "Selection",
        thValue: "Value",

        // Kriterier (også brukt som engelsk fallback til CSV via JS-map)
        cAntallBaser: "Number of bases",
        cAntallPiloter: "Number of pilots",
        cPilotEmployment: "Pilot employment",
        cLedendeRoller: "Leading personnel has multiple roles",
        cKravEksamen: "Exam requirements",
        cManualverk: "Manuals",
        cTyngsteFartoy: "Heaviest aircraft",
        cAntallFartoy: "Number of aircraft",
        cAntallTyper: "Number of aircraft types",
        cC2link: "C2 link",
        cModifiserte: "Modified aircraft",
        cTestDevelopment: "Test and Development",
        cSail: "Highest SAIL",
        cOmrade: "Area of approval",
        cSynsvidde: "Line of sight",
        cFlyhoyde: "Flight altitude",
        cOperasjonsmiljo: "Operational environment",
        cRedusertGrc: "Reduced GRC",
        cFlytimer: "Expected annual flight hours",
        cAnnenRisiko: "Other increased complexity",
        cStateOperations: "State operations",
        cStateExemptions: "Exemptions from 947 that could increase risk?",
        cBekymringsmeldinger: "Reports of concern",
        cVeiledningsbehov: "Need for guidance",
        cManglerEmpic: "Missing data in EMPIC",
        cNiva1: "Level 1 finding",
        cNiva2: "Number of level 2 findings",
        cFristLukking: "Deadline for closure",
        cSms: "SMS",
        oatNumber: "Number of OATs",
        lucNumber: "Number of LUC privileges",

        // Tooltips
        tipAntallTyper: "If the operator has a combination of e.g. multirotor, fixed wing, VTOL etc.",
        tipModifiserte: "E.g. washing equipment, drop mechanism",
        tipLuc: "Not counted PDRAs",
        tipAnnenRisiko: "E.g. dangerous goods, complex drone system or swarm operations",
        tipManglerEmpic: "E.g missing data on leading personell or description of approved operations.",

        // Audit-underseksjon
        lastAudit: "Last Audit",
        neverAudited: "Operator has never been audited",
        dateLastAudit: "Date of last audit",
        dateInitialApproval: "Date of initial approval",
        exemptionsDetails: "Exemptions Details / Comments:",
        exemptionsPlaceholder: "Please specify the exemptions...",

        comments: "Comments:",
        commentsPlaceholder: "Add any comments here...",
        scoringDetails: "Scoring Details",

        // Flagg
        flagState: "State Operations (Forskrift om statsluftfart)",
        flagNeverAudited: "Operator has never been audited",

        // JS-meldinger
        confirmManual: "Please check the list carefully first.\n\nAre you sure the operator is not listed? Manual entry should ONLY be used if the operator is missing from the list.",
        loadConfigError: "Error loading data files. Make sure 'scoring.json', 'operation_types.json' and 'operators.json' are in the data folder.",
        dataLoaded: "Data loaded!",
        loadFileError: "Error loading file.",
        clearForm: "Clear form?",

        // Felles valg (gjenbrukes på flere felt)
        optSelect: "Select...",
        optNo: "No",
        optYes: "Yes",
        optNone: "None",
        optSome: "Some",
        optMedium: "Medium",
        optSignificant: "Significant",

        // Feltspesifikke valg
        baseMainOnly: "Main base only",
        base3orLess: "3 or less",
        base4orMore: "4 or more",
        pilot10orLess: "10 or less",
        pilot10to20: "10 - 20",
        pilot20orMore: "20 or more",
        empOperator: "Employed by operator",
        empOther: "Other company",
        manSelf: "Self-authored",
        manPurchased: "Purchased",
        c2Direct: "Direct",
        c2None: "None (automation/autonomy)",
        areaPrecise: "Precise",
        areaGeneric: "Generic",
        bvlosObs: "BVLOS with observer",
        bvlosNoObs: "BVLOS without observer",
        altUnder400: "Under 400'",
        altOver400: "Over 400'",
        altDanger: "In danger area",
        envSparse: "Sparsely populated",
        envPopulated: "Populated",
        envAfis: "AFIS Airport",
        envCtr: "CTR Airport",
        grcMinus12: "-1 or -2",
        grcMinus3: "-3 or more",
        fhUnder100: "Under 100",
        fhOver100: "Over 100",
        fhOver1000: "Over 1,000",
        repSevere: "Severe",
        guideLittle: "Little",
        guideHigh: "High",
        niva2More: "12 or more",
        deadlineMet: "Met",
        deadlineExceeded: "Exceeded",

        ovTitle: "Scoring for UAS",
        ovOatLuc: "Number of OATs / LUC privileges",
        ovTimeLastAudit: "Time since last audit",
        ovTimeInitial: "Time since initial approval",
        timeUnder1: "Under 1 year",
        time1to2: "1 - 2 years",
        time2to3: "2 - 3 years",
        timeOver3: "Over 3 years",
        ovDependent: "(Score for Pilots) + (Score for Bases)",
        ovLoadErrorTitle: "Error Loading",
        ovLoadErrorBody: "Could not load scoring details. Please check that 'data/scoring.json' exists. Details: {msg}"
    }
});
