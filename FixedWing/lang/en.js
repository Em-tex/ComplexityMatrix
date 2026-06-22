/* FixedWing – engelske strenger (presentasjon/UI + brukermeldinger).
 * Select-alternativenes tekst (No/Yes, tall, AOC/SPO/NCC, Legacy/ATQP/EBT ...)
 * er DATA og brukes til CSV-matching (opt.text) – de oversettes IKKE.
 * fieldData.label i kalkulator.js holdes ALLTID engelsk (styrer CSV-kolonner).
 * Lastes etter js/lang/*.js og før js/navbar.js. */
I18n.register("en", {
    fw: {
        title: "Fixed Wing Complexity Matrix",

        operator: "Operator:",
        selectOperator: "Select operator...",
        operatorManualPlaceholder: "Enter manually (only if missing)",
        manualTitle: "Enter manually",
        backToListTitle: "Back to list",
        filledBy: "Filled out by:",
        filledByPlaceholder: "Enter name",
        date: "Date:",

        gResources: "Resources",
        gFleet: "Fleet Specific",
        gOperations: "Operations",
        gApprovals: "Approvals",
        gTotal: "Total Score",

        // Oversight-package legend (above the gauges)
        supervisionPackage: "Oversight package",
        group: "Group",

        thCriteria: "Criteria",
        thSelection: "Selection",
        thValue: "Score",
        selectPlaceholder: "Select...",
        optNo: "No",
        optYes: "Yes",

        staffEmployed: "Total Number of staff employed for the operation",
        pilotsEmployed: "Number of pilots employed",
        cabinCrew: "Cabin crew carried",
        leadingRoles: "Leading personel has several roles",
        leadingRolesTooltip: "The score increases with the number of pilots, as this indicates higher organisational complexity for larger companies.",

        typesOperated: "Number of types operated",
        mopsOver19: "Number of aircraft with MOPSC of MORE than 19 seats",
        mopsUnder19: "Number of aircraft with MOPSC of 19 seats or LESS",
        specialMod: "Aircraft with Special Modification",

        operationTypes: "Number of Operation types",
        operationComplexity: "Operation Complexity",
        specialOperation: "Number of special Operation (NOT SPA)",
        derogations: "Number of derogations",
        airportsBased: "Number of airports where aircraft and/or crews are permanently based",
        subcontractors: "Number of Subcontractors",
        acmi: "ACMI",
        certificate: "Certificate",

        rnpArApch: "RNP AR APCH",
        mnpsNatHla: "MNPS/ NAT-HLA",
        rvsm: "RVSM",
        lvTakeoff: "Low Visibility operations (TAKEOFF)",
        lvLanding: "Low Visibility operations (LANDING)",
        etops: "ETOPS",
        dangerousGoods: "Dangerous Goods",
        singleEngineImc: "Single-Engined Turbine IMC",
        efb: "Electronic Flight Bag",
        isolatedAerodromes: "Isolated Aerodromes",
        steepApproach: "Steep Approach",
        frms: "FRMS",
        crewTraining: "Crew Training",
        ccaTraining: "CCA training",

        comments: "Comments:",
        commentsPlaceholder: "Add any comments here...",
        oversiktLink: "Scoring overview",

        // oversikt.html (poengberegning)
        oversiktTitle: "Scoring breakdown for Fixed Wing",
        hrSpo: "HR SPO",
        dependentOnPilots: "Depending on pilots:",
        standardLabel: "Default",
        noScoringRule: "No scoring rule defined",
        loadErrorTitle: "Loading error",
        loadErrorBody: "Could not load the scoring overview. Check that the file 'data/scoring.json' exists and that the path is correct. Details: {msg}",

        // Brukermeldinger (JS)
        confirmManual: "Please check the list carefully first.\n\nAre you sure the operator is not there? Manual entry should ONLY be used if the operator is missing from the list.",
        confirmClear: "Are you sure you want to clear the form? All saved data will be deleted.",
        errOperatorRequired: "Operator name must be filled in.",
        errFilledByRequired: "Filled out by must be filled in.",
        errChoiceRequired: "Please make a selection for \"{label}\".",
        formIncomplete: "The form is not fully completed:",
        dataLoaded: "Data loaded!",
        fileEmpty: "The file is empty or invalid.",
        dropOnlyDat: "Please drop only .dat or .csv files.",
        loadError: "ERROR: Could not load data files (scoring/operators). The page cannot work.",
        unknownOperator: "UnknownOperator"
    }
});
