/* Felles validering av navnefeltet "Fylt ut av" / "Filled out by" / "Assessed by".
 * Gjelder ALLE skjemaer og oppfører seg likt overalt. Treffer feltene
 * id="filled-by" (de fleste verktøyene) og id="assessed-by" (MSAT).
 * Krever fullt navn: minst for- og etternavn (to eller flere ord). Skriver
 * brukeren bare ett enkelt navn, lyser feltet rødt og det vises et varsel.
 * Plassholder ("First and last name"), hjelpetekst (tooltip) og varsel hentes
 * fra felles i18n-ordbok (nameValidation.*) og oppdateres ved språkbytte.
 * Lastes etter js/i18n.js + js/lang/*.js (bruker window.I18n om tilgjengelig). */
(function () {
    const FALLBACK = {
        help: "Enter full name (first and last name)",
        warning: "Both first and last name must be entered."
    };
    const t = (key, fallback) =>
        (window.I18n && window.I18n.t) ? window.I18n.t("nameValidation." + key) : fallback;

    function isFullName(value) {
        const parts = value.trim().split(/\s+/).filter(Boolean);
        return parts.length >= 2;
    }

    function setupField(input) {
        // Unngå dobbel oppsett hvis skriptet kjøres flere ganger.
        if (input.dataset.nameValidationReady) return;
        input.dataset.nameValidationReady = "1";

        // Varselet legges i feltets nærmeste beholder og posisjoneres absolutt
        // rett under feltet (se .name-warning i css). Da tar det ingen plass i
        // flyten – inputradene holder seg pent på linje og layouten hopper ikke.
        const anchor = input.parentElement || input;
        if (anchor !== input && getComputedStyle(anchor).position === "static") {
            anchor.style.position = "relative";
        }

        const warning = document.createElement("div");
        warning.className = "name-warning";
        warning.id = input.id + "-warning";
        warning.setAttribute("aria-live", "polite");
        warning.style.display = "none";
        input.insertAdjacentElement("afterend", warning);

        const applyHelp = () => { input.title = t("help", FALLBACK.help); };
        const setWarningText = () => { warning.textContent = t("warning", FALLBACK.warning); };

        // showError=true viser feil; ellers fjernes bare feil når feltet blir gyldig.
        // Varselet er absolutt posisjonert, så å vise/skjule det flytter ingenting.
        function validate(showError) {
            const value = input.value.trim();
            const valid = value === "" || isFullName(value);
            if (valid) {
                input.classList.remove("input-error");
                warning.style.display = "none";
                return true;
            }
            if (showError) {
                input.classList.add("input-error");
                setWarningText();
                warning.style.display = "block";
            }
            return false;
        }

        // Vis feil når brukeren forlater feltet med bare ett navn.
        input.addEventListener("blur", () => validate(true));
        // Mens man skriver: ikke vis ny feil, men fjern feil straks navnet blir gyldig.
        input.addEventListener("input", () => {
            if (input.classList.contains("input-error")) validate(true);
        });

        applyHelp();
        window.addEventListener("languageChanged", () => {
            applyHelp();
            if (warning.style.display !== "none") setWarningText();
        });
    }

    // Sjekk alle navnefelt. showError=true lyser feltet rødt, viser varsel og
    // setter fokus på det første ugyldige. Tomt felt regnes her som ugyldig
    // (navn KREVES for nedlasting). Returnerer true når alle er fullstendige.
    function validateAllNameFields(showError, doFocus) {
        let firstInvalid = null;
        document.querySelectorAll("#filled-by, #assessed-by").forEach((input) => {
            const value = input.value.trim();
            const valid = value !== "" && isFullName(value);
            const warning = document.getElementById(input.id + "-warning");
            if (valid) {
                // Rydd alltid bort et eventuelt gjenstående varsel/rød ramme på
                // gyldige felt – ellers kan et gammelt varsel henge igjen (og bli
                // med i utskriften) selv om navnet nå er korrekt.
                input.classList.remove("input-error");
                if (warning) warning.style.display = "none";
            } else {
                if (!firstInvalid) firstInvalid = input;
                if (showError) {
                    input.classList.add("input-error");
                    if (warning) {
                        warning.textContent = t("warning", FALLBACK.warning);
                        warning.style.display = "block";
                    }
                }
            }
        });
        if (firstInvalid && showError && doFocus !== false) firstInvalid.focus();
        return !firstInvalid;
    }

    // Bulletproof: skjul ALLE navnevarsler + røde rammer rett før utskrift, så
    // ingenting rødt blir med i PDF-en (uavhengig av CSS/cache). Gjenopprett
    // skjermtilstanden etter utskrift uten å flytte fokus.
    window.addEventListener("beforeprint", () => {
        document.querySelectorAll(".name-warning, [id$='-warning']").forEach((w) => {
            // Inline !important slår enhver annen regel/innebygd stil.
            w.style.setProperty("display", "none", "important");
        });
        // Fjern alle røde valideringsmarkører (navn + skjema) så verken rød ramme
        // eller en tom rød boks blir med i PDF-en.
        document.querySelectorAll(".input-error, .invalid").forEach((el) => {
            el.classList.remove("input-error", "invalid");
        });
        // Datofelt: nettlesernes native datokontroll (særlig Firefox) viser mellomrom
        // rundt punktumene og kan IKKE styles med CSS. Under utskrift skjuler vi
        // selve input-feltet og viser i stedet en ren tekst-<span> «dd.mm.yyyy» ved
        // siden av. Vi rører ALDRI input-ets type/verdi (det nullstilte feltet i
        // Firefox). Span-en fjernes igjen etter utskrift.
        document.querySelectorAll('input[type="date"]').forEach((inp) => {
            const v = inp.value;
            const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
            const txt = m ? `${m[3]}.${m[2]}.${m[1]}` : (v || "");
            let span = inp.nextElementSibling;
            if (!span || !span.classList || !span.classList.contains("print-date-text")) {
                span = document.createElement("span");
                span.className = "print-date-text";
                inp.insertAdjacentElement("afterend", span);
            }
            span.textContent = txt;
            inp.style.setProperty("display", "none", "important");
        });
    });
    window.addEventListener("afterprint", () => {
        document.querySelectorAll(".print-date-text").forEach((s) => s.remove());
        document.querySelectorAll('input[type="date"]').forEach((inp) => {
            inp.style.removeProperty("display");
        });
        validateAllNameFields(true, false);
    });

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("#filled-by, #assessed-by").forEach(setupField);
    });

    // Blokker nedlasting OG «Print til PDF» hvis navnefeltet ikke er fullstendig
    // utfylt (krever for- og etternavn). Fanges i capture-fasen FØR kalkulatorens
    // egne handlere, slik at handlingen stoppes. Dekker både knappene nederst og
    // proxy-knappene i verktøylinjen (som klikker de samme bunnknappene).
    document.addEventListener("click", (e) => {
        const trigger = e.target.closest
            ? e.target.closest("#download-csv-button, #print-pdf-button")
            : null;
        if (!trigger) return;
        if (!validateAllNameFields(true)) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    }, true);
})();
