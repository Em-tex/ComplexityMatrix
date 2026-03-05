// js/felles_knapper.js
(function() {
    const actionContainer = document.getElementById("action-buttons-container");
    const footerContainer = document.getElementById("footer-links-container");

    if (!actionContainer) return;

    // Henter URL-ene fra footer-diven (der vi la dem i HTML-filene)
    const dataNode = footerContainer || actionContainer;
    const sharepointUrl = dataNode.getAttribute("data-sharepoint-url");
    const listUrl = dataNode.getAttribute("data-list-url");
    const isMsat = dataNode.getAttribute("data-is-msat") === "true";

    // 1. Første knapp
    let html = `
        <button id="download-csv-button">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg> 
            Last ned data
        </button>
    `;

    // 2. Sharepoint knappene settes inn her (etter Last ned)
    if (sharepointUrl) {
        html += `
            <a href="${sharepointUrl}" target="_blank" class="sharepoint-btn">
                <i class="fa-solid fa-folder" style="margin-right: 8px;"></i> Sharepoint mappe
            </a>
        `;
    }

    if (listUrl) {
        const listText = isMsat ? "MSAT Profiloversikt" : "Profiloversikt";
        html += `
            <a href="${listUrl}" target="_blank" class="sharepoint-btn">
                <i class="fa-solid fa-list" style="margin-right: 8px;"></i> ${listText}
            </a>
        `;
    }

    // 3. Resten av knappene
    html += `
        <button id="print-pdf-button">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg> 
            Print til PDF
        </button>
        <button id="load-csv-button" class="load-button">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M9 16h6V8h4L12 3 5 8h4zm-4 5h14v-2H5z"/></svg> 
            Last inn data
        </button>
        <button id="clear-form-button">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg> 
            Reset skjema
        </button>
        <input type="file" id="csv-file-input" accept=".csv, .dat" style="display: none;">
    `;

    actionContainer.classList.add("action-buttons");
    actionContainer.innerHTML = html;

    // Gjør at eventuelle ekstra lenker ("Oversikt over poengberegning") får litt rom over seg
    if (footerContainer) {
        footerContainer.classList.add("footer-links");
    }
})();