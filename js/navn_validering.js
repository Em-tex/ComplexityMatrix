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

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("#filled-by, #assessed-by").forEach(setupField);
    });
})();
