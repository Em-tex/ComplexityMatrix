/* ATO – engelske strenger (presentasjon/UI + brukermeldinger).
 * Kriteriene var engelske, "chrome" norsk. Select-alternativenes tekst er DATA
 * (CSV-matching, opt.text) og oversettes IKKE; Ja/Nei vises oversatt men har
 * data-en som holder CSV engelsk. fieldData.label holdes ALLTID engelsk (CSV).
 * Lastes etter js/lang/*.js og før js/navbar.js. */
I18n.register("en", {
    ato: {
        title: "ATO Complexity Matrix",

        operator: "Operator:",
        operatorPlaceholder: "Select or type operator name",
        filledBy: "Filled out by:",
        filledByPlaceholder: "Enter name",
        date: "Date:",

        gResources: "Resources",
        gFleet: "Fleet & FSTD",
        gOperations: "Operations",
        gApprovals: "Approvals",
        gTotal: "Total Score",
        gPerformance: "Performance",

        thCriteria: "Criteria",
        thSelection: "Selection",
        thValue: "Score",
        selectPlaceholder: "Select...",
        optNo: "No",
        optYes: "Yes",

        // Resources
        staffFte: "Number of staff for the operation (FTE)",
        employedInstructors: "Number of employed instructors",
        contractInstructors: "Number of part-time instructors on contract",
        complexOrganisation: "Complex organisation (declared)",
        leadingRoles: "Leading personnel has several roles",

        // Operations
        ifrOperation: "IFR operation",
        nco: "NCO",
        ncc: "NCC",
        spaSpo: "SPA or SPO",
        holdsAoc: "Operator also holds an AOC",
        ownCamo: "ATO has its own CAMO",
        hasFstdOrg: "Organisation also has an FSTD organisation",
        subcontractors: "Number of subcontractors",

        // Fleet & FSTD
        numberOfTypes: "Number of different types or classes (models) operated by ATO",
        meAircraft: "Number of ME aircraft",
        seAircraft: "Number of SE aircraft",
        leasedFromAoc: "Leased aircraft from AOC outside own organisation",
        privatelyLeased: "Privatly leased aircraft",
        numberOfFstds: "Number of FSTDs used for training",

        // Approvals
        integratedCourses: "Integrated courses",
        fclCourses: "Number of approved FCL courses",
        theoryLaplPpl: "Stand alone theory course for LAPL/ PPL",
        theoryCplAtplIr: "Stand alone theory course for CPL/ATPL/IR",
        numberOfBases: "Number of bases (main and secondary)",
        basesOutsideNorway: "Secondary base(s) outside Norway",
        partIs: "Part-IS",

        comments: "Comments:",
        commentsPlaceholder: "Add any comments here...",
        oversiktLink: "Scoring overview",

        // oversikt.html
        oversiktTitle: "Scoring Calculation for ATO",
        dependentOnInstructors: "Depending on number of employed instructors:",
        standardLabel: "Default",
        loadErrorTitle: "Error Loading Data",
        loadErrorBody: "Could not load the scoring overview. Check that 'data/ato_scoring.json' exists. Details: {msg}",

        // Brukermeldinger (JS)
        confirmClear: "Are you sure you want to clear the form? All saved data will be deleted.",
        errOperatorRequired: "Operator name must be filled in.",
        errFilledByRequired: "Filled out by must be filled in.",
        errChoiceRequired: "Please make a selection for \"{label}\".",
        formIncomplete: "The form is not fully completed:",
        dataLoaded: "CSV file loaded!",
        fileEmpty: "The CSV file is empty or invalid.",
        loadError: "ERROR: Could not load data files (scoring/operators). The page cannot function.",
        unknownOperator: "UnknownOperator"
    }
});
