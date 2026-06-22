/* MSAT – engelske strenger (presentasjon/UI og hjelpetekst).
 * Score-nedtrekk, CSV-felt og JSON-innhold oversettes IKKE – de styrer data.
 * Faste scoringsbegreper (Present/Suitable/Operating/Effective, N/A, tall) holdes
 * like på begge språk for konsistens med skjemaet.
 * Lastes etter js/i18n.js og før js/navbar.js. */
I18n.register("en", {
    msat: {
        title: "Management System Assessment Tool (MSAT)",

        orgName: "Name of Organisation:",
        orgNamePlaceholder: "Enter organisation name",
        orgNameManualPlaceholder: "Enter manually (only if missing)",
        selectOperator: "Select operator...",
        rights: "Approvals:",
        rightsPlaceholder: "Select approvals...",
        assessedBy: "Assessed by:",
        assessedByPlaceholder: "Enter name",
        assessmentDate: "Date of assessment:",
        empicId: "Empic ID:",
        empicIdPlaceholder: "Enter ID",

        tab: {
            main: "Common (1–5)",
            placeholder: "Only the standard form is used for this approval."
        },

        tooltipEnterManually: "Enter manually",
        tooltipBackToList: "Back to list",

        comments: "Comments:",
        commentsPlaceholder: "Add any comments here...",
        commentsHeading: "Comments",
        cCompliance: "Compliance",
        cFlightOps: "Flight Operations",
        cSafety: "Safety Department",
        cTraining: "Training",
        cPlanning: "Planning & FTL",
        cReporting: "Reporting",
        cOther: "Other",

        popup: {
            whatToLookFor: "What to look for:",
            notSpecified: "Not specified.",
            ok: "OK"
        },
        itemComment: {
            add: "Add justification",
            edit: "Edit justification",
            placeholder: "Enter a justification for this item...",
            save: "Save",
            cancel: "Cancel"
        },
        form: {
            criteria: "Criteria",
            selection: "Selection",
            score: "Score"
        },
        gauges: {
            policy: "Safety Policy",
            risk: "Risk Assessment",
            additional: "Additional Items",
            avgScore: "Avg score:",
            total: "Total Average Score",
            extension: "Oversight Cycle Extension"
        },
        ext: {
            sectionTitle: "ITEMS FOR CONSIDERATION OF EXTENSION",
            financialLabel: "Financial management",
            level1Label: "Level 1 findings in the last 24 months",
            title: "Criteria for Extension Consideration",
            intro: "To consider an extension of the oversight cycle, the following conditions must be met:",
            scoreItems: "<strong>Score of 7 (Effective)</strong> is required for items:",
            financial: "<strong>Financial Management</strong> score must be at least <strong>4 (Acceptable)</strong>.",
            level1: "<strong>Level 1 Findings</strong> score must be <strong>7 (No findings)</strong>.",
            allOther: "<strong>All other items</strong> must have a minimum score of <strong>4 (Operating)</strong>. N/A is acceptable."
        },
        crit: {
            title: "Critical Items for Extension",
            intro: "The following items must have a score of 7 (Effective):"
        },
        checklist: {
            critOf: "of",
            critLink: "critical items",
            critSuffix: "have a score of 7",
            groupRisk: "Effective identification and management of own risk",
            groupChange: "System for managing change within own organisation",
            groupFindings: "Ability to handle findings within set deadlines",
            financial: "Financial management score is 4 or higher",
            level1: "No level 1 findings in the last 24 months",
            allOther: "All other items have a minimum score of 4",
            finalPass: "Extension of oversight cycle may be considered (36 months).",
            finalNeutral: "Standard oversight cycle (24 months)."
        },
        dialog: {
            clearConfirm: "Are you sure you want to clear the form? All saved data will be deleted.",
            csvLoaded: "CSV file loaded successfully!",
            csvFailedPrefix: "Failed to load CSV file. Error: ",
            csvEmpty: "CSV file is empty or invalid.",
            manualConfirm: "Please check the list carefully first.\n\nAre you sure the operator is not there? Manual entry should ONLY be used if missing.",
            missingCommentsPrefix: "Warning: ",
            missingCommentsSuffix: " scored item(s) are missing a justification comment.\n\nDownload anyway?"
        }
    }
});
