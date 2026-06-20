/* CAMO – engelske strenger (presentasjon/UI).
 * Score-nedtrekk (N/A, Present/Suitable/Operational/Effective, No/Yes, tall),
 * matrise-celleverdier og nivånavn (Present/Suitable/Operational/Effective,
 * Non-complex/Low/Medium/High, critical/normal/basic ...) oversettes IKKE –
 * de er DATA og styrer beregning/CSV.
 * CSV-etiketter bygges alltid fra disse engelske strengene (se kalkulatoren).
 * Lastes etter js/lang/*.js og før js/navbar.js. */
I18n.register("en", {
    camo: {
        title: "CAMO Organisation Assessment",

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

        secA: "A. Surveillance period - Ref CAMO.B.305(d)",
        secB: "B. Specific nature of the organisation and complexity of its activites - result of past certification or oversight activities - Ref CAMO.B.305 - AMC1 CAMO.B305",

        thCriteria: "Criteria",
        thPerfInput: "Performance Input",
        thPerfAvg: "Perf. Avg.",
        thCompInput: "Complexity Input",

        A1: "1. Identification of aviation safety hazards and management of associated risks",
        A1a: "a. Identifying and addressing safety hazards (register, SPI, assessment)",
        A1b: "b. management",
        A2: "2. Continous compliance with point CAMO.A.130 and full control over all changes",
        A2a: "a. MoC (P/S/O/E)",
        A2b: "b. Changes not requiring prior approval, notification to CAA (P/S/O/E)",
        A2c: "c. The changes only implemented after reciept of a formal approval from CAA",
        A3: "3. Level 1 finding by CAA-N (no allowed) - Y/N",
        A4: "4. Implementation of corrective actions within time period that was accepted or extended by the competent authority as provided for in point CAMO.B.350.",
        A5: "*5. MSAT score - if applicable, combined with Part-145, Part-21, Part-OPS",
        A6: "*6. Tot. number of findings Level 2, by CAA-N - last 24 mth (initial and continous).",

        B1: "1. The effectiveness of the organisation’s management system in identifying and addressing non-compliances (for safety hazards ref element A. 1)",
        B1a: "a. Identifying and adressing non-compliances (organisation vs CAA)",
        B1b: "b. closure of non compliances (incl. organisation and authorities)",
        B2: "2. The implementation by the organisation of any industry standards that are directly (recognised) relevant to the organisation’s activities subject to this Regulation;",
        B2a: "a. ISO 45001 - Occupational health & safety",
        B2b: "b. ISO 9001 QM systems",
        B2c: "c. IOSA",
        B3: "3. The procedure applied for and the scope of changes not requiring prior approval;",
        B4: "4. Any specific procedures implemented by the organisation that are related to any alternative means of compliance used;",
        B4a: "a. Procedure implemented?",
        B4b: "b. Number of procedures based on \"AltMoc\".",
        B4c: "c. Number of procedures based on \"AltMoc\" made by the organisation.",
        B5: "5. The number of approved CAMO-locations and the activities performed at each location (subcontracted locations covered by element 6.)",
        B6: "6. The number and type of any subcontractors performing continuing airworthiness management task(s)",
        B7: "7. The volume of activity for each aircraft type / series / group, as applicable",
        B7a: "a. Rotary wing and fixed wing (Y/N)",
        B7b: "b. Number of approved AMP",
        B7c: "c. Complex motorpowered aircraft",
        B7d: "d. Number of aircraft",
        B8: "*8. Airworthiness review",
        B8a: "a. Number of ratings covered by AR-privilege",
        B8b: "b. Issuance of ARC (Y/N)",
        B9: "*9. Permit to fly (approved to issue)",
        B10: "*10. Management system covering more than one approval (Y/N)",
        B10a: "a. Total number of ratings covered by Management system",

        optNo: "No",
        optYes: "Yes",

        customStandard: "Custom standard...",
        comments: "Comments:",

        confirmClear: "Are you sure you want to clear the form?"
    }
});
