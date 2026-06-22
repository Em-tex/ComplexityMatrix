/* Rotor – engelske strenger (presentasjon/UI + brukermeldinger).
 * Feltene speiler det rotor-spesifikke skjemaet som matcher data/scoring.json
 * (poenglogikken er FASIT). Select-alternativenes tekst (No/Yes, tall, N/A,
 * AOC/SPO/NCC) er DATA og oversettes IKKE; Ja/Nei vises oversatt men har
 * data-en som holder CSV engelsk. fieldData.label holdes ALLTID engelsk (CSV).
 * Lastes etter js/lang/*.js og før js/navbar.js. */
I18n.register("en", {
    rotor: {
        title: "Rotor Wing Complexity Matrix",

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

        // Resources
        staffEmployed: "Number of staff employed for the operation",
        pilotsEmployed: "Number of pilots employed",
        technicalCrew: "Technical Crew Carried",
        leadingRoles: "Leading personnel has several roles",
        leadingRolesTooltip: "The score increases with the number of pilots, as this indicates higher organisational complexity for larger companies.",

        // Fleet
        typesOperated: "Number of types operated",
        multiOffshore: "Number of Multi-engined helicopters operating offshore",
        multiOnshore: "Number of Multi-engined helicopters operating onshore",
        singleEngine: "Number of single engine helicopters operated",
        acLeasing: "A/C Leasing",
        specialMod: "Helicopters with special modification",

        // Operations
        numberOperationTypes: "Number of Operation types",
        operationComplexity: "Operation Complexity",
        basesPermanently: "Number of bases where aircraft and/or crews are permanently based",
        subcontractors: "Number of Subcontractors",
        ifrVfr: "IFR/VFR operation",
        singlePilot: "Singlepilot operation",
        certificate: "Certificate",
        hrSpo: "HR SPO",
        groupAirline: "Group Airline",
        derogations: "Number of derogations",

        // Approvals
        rnp03: "RNP 0.3",
        lvTakeoff: "Low Visibility operations (TAKEOFF)",
        lvLanding: "Low Visibility Operations (LANDING)",
        dangerousGoods: "Dangerous Goods",
        catPolH305: "CAT.POL.H.305",
        nvis: "NVIS",
        hho: "HHO",
        hems: "HEMS",
        hofo: "HOFO",
        sar: "SAR",
        policeOperations: "Police operations",
        efbApproval: "EFB Approval",
        frms: "FRMS",
        ato: "ATO",

        comments: "Comments:",
        commentsPlaceholder: "Add any comments here...",
        oversiktLink: "Scoring overview",

        // oversikt.html
        oversiktTitle: "Scoring breakdown for Rotor Wing",
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
        loadError: "ERROR: Could not load data files. The page cannot work.",
        unknownOperator: "UnknownOperator"
    }
});
