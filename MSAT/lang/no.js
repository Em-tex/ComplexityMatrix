/* MSAT – norske strenger (presentasjon/UI og hjelpetekst).
 * Score-nedtrekk, CSV-felt og JSON-innhold oversettes IKKE – de styrer data.
 * Faste scoringsbegreper (Present/Suitable/Operating/Effective, N/A, tall) og
 * forkortelser (MSAT, FTL, ID, N/A) holdes like på begge språk.
 * Lastes etter js/i18n.js og før js/navbar.js. */
I18n.register("no", {
    msat: {
        title: "Verktøy for vurdering av styringssystem (MSAT)",

        orgName: "Navn på organisasjon:",
        orgNamePlaceholder: "Skriv inn organisasjonsnavn",
        orgNameManualPlaceholder: "Skriv inn manuelt (kun hvis mangler)",
        selectOperator: "Velg operatør...",
        rights: "Godkjenninger:",
        rightsPlaceholder: "Velg godkjenninger...",
        assessedBy: "Vurdert av:",
        assessedByPlaceholder: "Skriv inn navn",
        assessmentDate: "Vurderingsdato:",
        empicId: "Empic-ID:",
        empicIdPlaceholder: "Skriv inn ID",

        tab: {
            main: "Felles (1–5)",
            placeholder: "Kun standard skjema brukes for denne godkjenningen."
        },

        tooltipEnterManually: "Skriv inn manuelt",
        tooltipBackToList: "Tilbake til listen",

        comments: "Kommentarer:",
        commentsPlaceholder: "Skriv eventuelle kommentarer her...",
        commentsHeading: "Kommentarer",
        cCompliance: "Etterlevelse",
        cFlightOps: "Flygeoperasjoner",
        cSafety: "Sikkerhetsavdeling",
        cTraining: "Opplæring",
        cPlanning: "Planlegging & FTL",
        cReporting: "Rapportering",
        cOther: "Annet",

        popup: {
            whatToLookFor: "Hva du skal se etter:",
            notSpecified: "Ikke spesifisert."
        },
        itemComment: {
            add: "Legg til begrunnelse",
            edit: "Rediger begrunnelse",
            placeholder: "Skriv en begrunnelse for dette punktet...",
            save: "Lagre",
            cancel: "Avbryt"
        },
        form: {
            criteria: "Kriterium",
            selection: "Valg",
            score: "Poeng"
        },
        gauges: {
            policy: "Sikkerhetspolicy",
            risk: "Risikovurdering",
            additional: "Tilleggspunkter",
            avgScore: "Gj.sn. score:",
            total: "Gjennomsnittlig totalscore",
            extension: "Forlengelse av tilsynssyklus"
        },
        ext: {
            sectionTitle: "PUNKTER FOR VURDERING AV FORLENGELSE",
            financialLabel: "Økonomistyring",
            level1Label: "Nivå 1-funn de siste 24 månedene",
            title: "Kriterier for vurdering av forlengelse",
            intro: "For å vurdere forlengelse av tilsynssyklusen må følgende vilkår være oppfylt:",
            scoreItems: "<strong>Score 7 (Effective)</strong> kreves for punktene:",
            financial: "<strong>Financial Management</strong> må ha score minst <strong>4 (Acceptable)</strong>.",
            level1: "<strong>Level 1 Findings</strong> må ha score <strong>7 (No findings)</strong>.",
            allOther: "<strong>Alle andre punkter</strong> må ha minimum score <strong>4 (Operating)</strong>. N/A er akseptabelt."
        },
        crit: {
            title: "Kritiske punkter for forlengelse",
            intro: "Følgende punkter må ha score 7 (Effective):"
        },
        checklist: {
            critOf: "av",
            critLink: "kritiske punkter",
            critSuffix: "har score 7",
            groupRisk: "Effektiv identifisering og håndtering av egen risiko",
            groupChange: "System for endringshåndtering i egen organisasjon",
            groupFindings: "Evne til å håndtere avvik innenfor gitte frister",
            financial: "Økonomistyring har score 4 eller høyere",
            level1: "Ingen nivå 1-funn de siste 24 månedene",
            allOther: "Alle andre punkter har minimum score 4",
            finalPass: "Forlengelse av tilsynssyklus kan vurderes (36 måneder).",
            finalNeutral: "Standard tilsynssyklus (24 måneder)."
        },
        dialog: {
            clearConfirm: "Er du sikker på at du vil tømme skjemaet? Alle lagrede data slettes.",
            csvLoaded: "CSV-filen ble lastet inn!",
            csvFailedPrefix: "Klarte ikke å laste CSV-filen. Feil: ",
            csvEmpty: "CSV-filen er tom eller ugyldig.",
            manualConfirm: "Sjekk listen nøye først.\n\nEr du sikker på at operatøren ikke finnes der? Manuell innskriving skal KUN brukes hvis den mangler.",
            missingCommentsPrefix: "Varsel: ",
            missingCommentsSuffix: " punkt(er) med poeng mangler begrunnelse.\n\nVil du laste ned likevel?"
        }
    }
});
