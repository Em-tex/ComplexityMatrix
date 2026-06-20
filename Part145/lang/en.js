/* Part-145 – engelske strenger (presentasjon/UI).
 * Score-nedtrekk (N/A, Present/Suitable/Operational/Effective, No/Yes, tall),
 * volum-nedtrekk (Low/Medium/High), matrise-celleverdier og nivånavn
 * (Non-complex/Low/Medium/High, critical/normal/basic ...) samt
 * tilsynsplan-tabellen oversettes IKKE – de er DATA og styrer beregning/CSV.
 * CSV-etiketter slås opp fra disse engelske strengene via tIn('en', key).
 * Lastes etter js/lang/*.js og før js/navbar.js. */
I18n.register("en", {
    p145: {
        title: "Part-145 Organisation Assessment",

        org: "Organization:",
        ref: "Approval ref:",
        filledBy: "Filled out by:",
        date: "Date of assessment:",

        resPerf: "Performance Level",
        resComp: "Complexity Level",
        resCrit: "Criticality",
        resPeriod: "Surveillance Period",
        resPlan: "Oversight Plan",

        matrixShow: "► Show Detailed Matrices & Oversight Plan",
        matrixHide: "▼ Hide Detailed Matrices & Oversight Plan",

        critMatrixTitle: "Criticality Matrix (Perf. vs Complexity)",
        planMatrixTitle: "Oversight Plan Matrix (Crit. vs Complexity)",

        ovHeadPlan: "Oversight plan",
        ovHeadAudit: "Audit",
        ovHeadSplit: "split-scope",
        ovHeadAnnual: "annual assessment",
        ovHeadAM: "AM-meeting",
        ovHeadFocused: "focused insp.",
        ovHeadUnannounced: "unannounced",

        formTitle: "Assessment Form",

        secA: "A. Surveillance period - Ref 145.B.305",
        secB: "B. Specific nature of the organisation and complexity of its activites - Ref 145.B.305",

        thCriteria: "Criteria",
        thPerf: "Performance",
        thPerfAvg: "Perf. Avg.",
        thComp: "Complexity",

        A1: "1. Identification of aviation safety hazards and management of associated risks",
        A1a: "a. Identifying and addressing safety hazards (register, SPI, assessment)",
        A1b: "b. management",
        A2: "2. Continous compliance with point 145.A.130 and full control over all changes",
        A2a: "a. MoC (P/S/O/E)",
        A2b: "b. Changes not requiring prior approval, notification to CAA (P/S/O/E)",
        A2c: "c. The changes only implemented after reciept of a formal approval from CAA",
        A3: "3. Level 1 finding by CAA-N",
        A3num: "Number of findings",
        A4: "4. Implementation of corrective actions within time period that was accepted or extended by the competent authority as provided for in point 145.B.350.",
        A5: "*5. MSAT score - if applicable, combined with Part-CAMO, Part-21, Part-OPS",
        A5score: "Score...",
        A5dateTitle: "Date of assessment",
        A6: "*6. Tot. number of findings Level 2, by CAA-N - last 24 mth (initial and continous).",

        B1: "1. Effectiveness of the organisation’s management system",
        B1a: "a. Identifying and adressing non-compliances (organisation vs CAA)",
        B1b: "b. closure of non compliances (incl. organisation and authorities)",
        B2: "2. Implementation of industry standards",
        B2a: "a. Safety- and compliance management standards",
        B2ai: "i. ISO 45001",
        B2aii: "ii. ISO 9001",
        B2aiii: "iii. IOSA",
        B2aivOther: "Other...",
        B3: "3. The procedure applied for and the scope of changes not requiring prior approval",
        B4: "4. Alternative means of compliance used",
        B4a: "a. Procedure implemented?",
        B4b: "b. Number of procedures based on \"AltMoc\".",
        B4c: "c. Number of procedures based on \"AltMoc\" by the organisation.",
        B5: "5. Number of approved maintenance locations",
        B5a: "a. main- or base maintenance locations",
        B5b: "b. secondary/line locations - permanently manned",
        B5c: "c. separate secondary/line locations - non-permanently manned",
        B5d: "d. workshop at separate location",
        B6: "6. Number and type of any subcontractors performing Part-145 task(s)",
        B7: "7. The volume of activity for each A, B, C and D class rating",
        B7a: "Class A",
        B7b: "Class B",
        B7c: "Class C",
        B7d: "Class D",
        B8: "*8. Airworthiness review",
        B8a: "a. Number of ratings coverd by AR-privilege",
        B8b: "b. Issuance of ARC (Y/N)",
        B9: "*9. Performing maintenance (contracts) for more than one customer",
        B10: "*10. Management system covering more than one approval",
        B10a: "a. Total number of ratings covered by Management system",

        optNo: "No",
        optYes: "Yes",

        comments: "Comments:",

        confirmClear: "Are you sure you want to clear the form? All entered data will be lost."
    }
});
