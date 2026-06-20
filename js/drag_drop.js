/* Felles dra-og-slipp for skjemaene: slipp en fil hvor som helst på siden for å
 * laste den inn. Skriptet finner skjemaets skjulte fil-input (#dat-file-input
 * for FFP, ellers #csv-file-input), legger den slupne filen der og utløser en
 * 'change'-hendelse – da kjører verktøyets egen innlastingslogikk uendret.
 * Lastes etter kalkulatoren (som kobler change-lytteren) og bruker window.I18n
 * for varseltekstene når den er tilgjengelig. */
(function () {
    document.addEventListener("DOMContentLoaded", function () {
        // FFP bruker #dat-file-input; øvrige verktøy #csv-file-input. Velg den
        // som faktisk finnes (og som har en innlastingslytter koblet på).
        const fileInput = document.getElementById("dat-file-input") ||
                          document.getElementById("csv-file-input");
        if (!fileInput) return;

        const ACCEPTED = [".csv", ".dat", ".txt"];
        const t = (key, fallback) =>
            (window.I18n && window.I18n.t) ? window.I18n.t(key) : fallback;

        // Visuell tilbakemelding injiseres her, så den virker uten verktøy-spesifikk CSS.
        if (!document.getElementById("drag-drop-style")) {
            const style = document.createElement("style");
            style.id = "drag-drop-style";
            style.textContent =
                "body.dragover-active{outline:3px dashed #2B6CB0;outline-offset:-12px;}" +
                "#drag-drop-hint{position:fixed;inset:0;z-index:9998;display:none;" +
                "align-items:center;justify-content:center;text-align:center;" +
                "background:rgba(26,54,93,0.12);font:bold 1.25rem/1.4 Arial,sans-serif;" +
                "color:#1A365D;pointer-events:none;}" +
                "body.dragover-active #drag-drop-hint{display:flex;}";
            document.head.appendChild(style);
        }
        const hint = document.createElement("div");
        hint.id = "drag-drop-hint";
        const setHint = () => { hint.textContent = t("common.dropHint", "Slipp filen for å laste inn"); };
        setHint();
        document.body.appendChild(hint);
        window.addEventListener("languageChanged", setHint);

        const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
        ["dragenter", "dragover", "dragleave", "drop"].forEach((ev) =>
            document.addEventListener(ev, stop, false));
        ["dragenter", "dragover"].forEach((ev) =>
            document.addEventListener(ev, () => document.body.classList.add("dragover-active"), false));
        ["dragleave", "drop"].forEach((ev) =>
            document.addEventListener(ev, () => document.body.classList.remove("dragover-active"), false));

        document.addEventListener("drop", function (e) {
            const files = e.dataTransfer && e.dataTransfer.files;
            if (!files || !files.length) return;
            const file = files[0];
            const name = file.name.toLowerCase();
            if (!ACCEPTED.some((ext) => name.endsWith(ext))) {
                alert(t("common.dropOnlyData", "Slipp kun .csv-, .dat- eller .txt-filer."));
                return;
            }
            // Legg filen i den skjulte inputen og utløs verktøyets change-lytter.
            try {
                const dt = new DataTransfer();
                dt.items.add(file);
                fileInput.files = dt.files;
                fileInput.dispatchEvent(new Event("change", { bubbles: true }));
            } catch (err) {
                console.error("Drag-and-drop: klarte ikke å laste filen.", err);
            }
        }, false);
    });
})();
