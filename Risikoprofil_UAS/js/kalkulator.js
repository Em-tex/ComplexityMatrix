// --- Globale konstanter og variabler ---
const STORAGE_KEY = 'risikoprofilData';
// We no longer need OPERATOR_NAMES_STORAGE_KEY as a separate storage for dynamic additions
// because the primary list comes from a JSON file.
// If you want to SAVE new manual inputs for future use, that would require a server-side solution.

const MAX_SCORE_DOC_ORG_CONFIG = 53;
const MAX_SCORE_YTELSE_CONFIG = 36;
const MAX_SCORE_GRAND_TOTAL_CONFIG = 89;

const notAssessedState = {
    doc: false,
    ytelse: false
};

const fieldData = [
    {id: 'fartoyvekt', label: 'Fartøyvekt', group: 'operations', section: 'doc'}, {id: 'synsvidde', label: 'Synsvidde', group: 'operations', section: 'doc'},
    {id: 'c2link', label: 'C2 link', group: 'operations', section: 'doc'}, {id: 'flyhoyde', label: 'Flyhøyde', group: 'operations', section: 'doc'},
    {id: 'operasjonsmiljo', label: 'Operasjonsmiljø', group: 'operations', section: 'doc'}, {id: 'redusert-grc', label: 'Redusert GRC', group: 'operations', section: 'doc'},
    {id: 'omrade', label: 'Område', group: 'operations', section: 'doc'}, {id: 'sail', label: 'SAIL', group: 'operations', section: 'doc'},
    {id: 'annen-risiko', label: 'Annen økt risiko', group: 'operations', section: 'doc'},
    {id: 'antall-baser', label: 'Antall baser', group: 'org', section: 'doc'}, {id: 'antall-piloter', label: 'Antall piloter', group: 'org', section: 'doc'},
    {id: 'ansvarsfordeling', label: 'Ansvarsfordeling', group: 'org', section: 'doc'},
    {id: 'krav-eksamen', label: 'Krav til eksamen', group: 'org', section: 'doc'}, {id: 'kjopt-om', label: 'Kjøpt OM?', group: 'org', section: 'doc'},
    {id: 'sms-org', label: 'SMS (Org)', group: 'org', section: 'doc'}, {id: 'eksternt-vedlikehold', label: 'Eksternt vedlikehold', group: 'org', section: 'doc'},
    {id: 'flytimer', label: 'Flytimer i året', group: 'innrapportering', section: 'ytelse'}, {id: 'bekymringsmeldinger', label: 'Bekymringsmeldinger', group: 'innrapportering', section: 'ytelse'},
    {id: 'veiledningsbehov', label: 'Veiledningsbehov', group: 'innrapportering', section: 'ytelse'},
    {id: 'niva1-avvik', label: 'Direkte nivå 1 avvik', group: 'sistTilsyn', section: 'ytelse'}, {id: 'niva2-avvik', label: 'Antall nivå 2 avvik', group: 'sistTilsyn', section: 'ytelse'},
    {id: 'frist-lukking', label: 'Frist for lukking', group: 'sistTilsyn', section: 'ytelse'}, {id: 'sms-tilsyn', label: 'SMS (Tilsyn)', group: 'sistTilsyn', section: 'ytelse'},
    {id: 'siste-kontakt', label: 'Tid sist kontakt', group: 'ltSaksbehandling', section: 'ytelse'}, {id: 'empic-data', label: 'Data i EMPIC', group: 'ltSaksbehandling', section: 'ytelse'},
    {id: 'oat-mangler', label: 'Mangler i OAT', group: 'ltSaksbehandling', section: 'ytelse'}
];


// --- Funksjoner for lagring, lasting og tømming ---

function saveData() {
    const dataToSave = {
        inputs: {},
        checkboxes: {}
    };
    document.querySelectorAll('input[type="text"], select, textarea').forEach(el => {
        if (el.id) {
            dataToSave.inputs[el.id] = el.value;
        }
    });
    document.querySelectorAll('input[type="checkbox"]').forEach(el => {
        if (el.id) {
            dataToSave.checkboxes[el.id] = el.checked;
        }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    // No need to save to a separate operatorNames localStorage here, as the source is now JSON.
    // If a user types a new name, it will only be valid for the current session unless
    // you implement server-side saving to the JSON file.
}

function loadData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        const data = JSON.parse(savedData);
        if (data.inputs) {
            for (const id in data.inputs) {
                const el = document.getElementById(id);
                if (el) {
                    el.value = data.inputs[id];
                }
            }
        }
        if (data.checkboxes) {
            for (const id in data.checkboxes) {
                const el = document.getElementById(id);
                if (el) {
                    el.checked = data.checkboxes[id];
                    const prefix = id.split('-')[0];
                    if ((prefix === 'doc' || prefix === 'ytelse') && el.checked) {
                        toggleNotAssessed(prefix, true);
                    }
                }
            }
        }
    }
    // NEW: Load initial operator names from JSON and populate the datalist
    loadOperatorNamesFromJsonAndPopulateDatalist();
}

function clearForm() {
    if (confirm("Er du sikker på at du vil tømme skjemaet? All lagret data vil bli slettet.")) {
        localStorage.removeItem(STORAGE_KEY);
        // We do NOT clear operators.json from here, as it's a static file.
        window.location.reload();
    }
}

// --- NEW: Functions for Operator Name Management (from JSON file) ---

/**
 * Fetches operator names from the operators.json file and populates the datalist.
 */
async function loadOperatorNamesFromJsonAndPopulateDatalist() {
    try {
        const response = await fetch('data/operators.json'); // Adjust path if your JSON file is elsewhere
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const operatorNames = await response.json();
        populateOperatorDatalist(operatorNames);
    } catch (error) {
        console.error("Could not load operator names from JSON:", error);
        // Fallback: Populate with any name already in the input field
        populateOperatorDatalist([]);
    }
}

/**
 * Populates the <datalist> with a given array of operator names.
 * @param {Array<string>} names An array of operator names.
 */
function populateOperatorDatalist(names) {
    const datalist = document.getElementById('operator-suggestions');
    if (!datalist) {
        console.error("Datalist 'operator-suggestions' not found.");
        return;
    }
    datalist.innerHTML = ''; // Clear existing options

    // Add current value from input if it's not already in the suggestions
    const currentInputValue = document.getElementById('operator-navn').value.trim();
    const uniqueNames = new Set(names);
    if (currentInputValue && !uniqueNames.has(currentInputValue)) {
        uniqueNames.add(currentInputValue);
    }

    Array.from(uniqueNames).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        datalist.appendChild(option);
    });
}

// --- Funksjoner for validering ---

function validateForm() {
    const errors = [];
    let isValid = true;
    document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

    const operatorNavnInput = document.getElementById('operator-navn');
    const filledByInput = document.getElementById('filled-by');

    if (!operatorNavnInput.value.trim()) {
        errors.push("Operatør må fylles ut.");
        operatorNavnInput.classList.add('invalid');
        isValid = false;
    }
    if (!filledByInput.value.trim()) {
        errors.push("Fylt ut av må fylles ut.");
        filledByInput.classList.add('invalid');
        isValid = false;
    }

    document.querySelectorAll('select').forEach(select => {
        const sectionGroup = select.dataset.sectiongroup;
        if (!notAssessedState[sectionGroup] && select.value === "") {
            const fieldInfo = fieldData.find(f => f.id === select.id);
            const label = fieldInfo ? `"${fieldInfo.label}"` : `et felt`;
            errors.push(`Vennligst gjør et valg for ${label}.`);
            select.classList.add('invalid');
            isValid = false;
        }
    });

    if (!isValid) {
        alert("Skjemaet er ikke fullstendig utfylt:\n\n" + errors.join('\n'));
    }
    return isValid;
}

function printPDF() {
    if (validateForm()) {
        window.print();
    }
}


// --- Funksjoner for UI og beregninger ---

function toggleNotAssessed(sectionPrefix, isLoading = false) {
    const isChecked = document.getElementById(sectionPrefix + '-not-assessed').checked;
    notAssessedState[sectionPrefix] = isChecked;
    const contentElement = document.getElementById(sectionPrefix + '-content');
    const selectsInContent = contentElement.querySelectorAll('select');

    if (isChecked) {
        contentElement.classList.add('collapsed');
        selectsInContent.forEach(select => {
            select.disabled = true;
            select.classList.remove('invalid'); // Remove invalid state when disabled
        });
    } else {
        contentElement.classList.remove('collapsed');
        selectsInContent.forEach(select => select.disabled = false);
    }

    if (!isLoading) {
        updateCalculations();
    }
}

function updateGaugeAndTotalVisibility() {
    const docGaugeBlock = document.getElementById('gauge-block-doc');
    const ytelseGaugeBlock = document.getElementById('gauge-block-ytelse');
    const totalGaugeBlock = document.getElementById('gauge-block-total');
    const grandTotalTextElement = document.getElementById('grand-total-text');
    const totalSummaryBlock = document.getElementById('total-summary-block');

    let docAssessed = !notAssessedState.doc;
    let ytelseAssessed = !notAssessedState.ytelse;

    if (docAssessed) docGaugeBlock.classList.remove('hidden-gauge'); else docGaugeBlock.classList.add('hidden-gauge');
    if (ytelseAssessed) ytelseGaugeBlock.classList.remove('hidden-gauge'); else ytelseGaugeBlock.classList.add('hidden-gauge');

    if (!docAssessed || !ytelseAssessed) {
        totalGaugeBlock.classList.add('hidden-gauge');
        grandTotalTextElement.classList.add('hidden-total-text');
    } else {
        totalGaugeBlock.classList.remove('hidden-gauge');
        grandTotalTextElement.classList.remove('hidden-total-text');
    }

    if (!docAssessed && !ytelseAssessed) {
        totalSummaryBlock.classList.add('hidden');
    } else {
        totalSummaryBlock.classList.remove('hidden');
    }
}

function getNumericValue(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        const val = parseFloat(el.textContent);
        return isNaN(val) ? 0 : val;
    }
    return 0;
}

function getSelectedText(selectId) {
    const selectElement = document.getElementById(selectId);
    if (selectElement && selectElement.selectedIndex >= 0) {
        if (selectElement.options[selectElement.selectedIndex]) {
            return selectElement.options[selectElement.selectedIndex].text;
        }
    }
    return "";
}

function applyValueCellStyle(valueCell, score, isPlaceholderValue) {
    valueCell.classList.remove('bg-default-gray', 'bg-weak-green', 'bg-weak-yellow', 'bg-weak-red');
    if (isPlaceholderValue) {
        valueCell.classList.add('bg-default-gray');
    } else if (score <= 1) {
        valueCell.classList.add('bg-weak-green');
    } else if (score <= 3) {
        valueCell.classList.add('bg-weak-yellow');
    } else if (score >= 4) {
        valueCell.classList.add('bg-weak-red');
    } else {
        valueCell.classList.add('bg-default-gray');
    }
}

function calculateFieldScore(selectId, selectValue) {
    if (selectValue === "") return 0; // Return 0 for unselected options
    switch(selectId) {
        case 'fartoyvekt':
            if (selectValue === "Under 4 kg") return 0;
            if (selectValue === "4 - 25 kg") return 1;
            if (selectValue === "Over 25 kg") return 5;
            return 0;
        case 'synsvidde':
            if (selectValue === "VLOS") return 0;
            if (selectValue === "BVLOS med observatør") return 1;
            if (selectValue === "BVLOS uten observatør") return 5;
            return 0;
        case 'c2link':
            if (selectValue === "Direkte") return 0;
            if (selectValue === "GSM/SATCOM") return 1;
            if (selectValue === "Ingen (automasjon/autonomi)") return 5;
            return 0;
        case 'flyhoyde':
            if (selectValue === "Under 400'") return 0;
            if (selectValue === "I fareområde") return 1;
            if (selectValue === "Over 400'") return 3;
            return 0;
        case 'operasjonsmiljo':
            if (selectValue === "Spredtbefolket") return 0;
            if (selectValue === "Flyplass") return 3;
            if (selectValue === "Befolket") return 3; // Assuming Befolket also has high risk
            return 0;
        case 'redusert-grc':
            if (selectValue === "Nei") return 0;
            if (selectValue === "-1 eller -2") return 1;
            if (selectValue === "-3 eller mer") return 3;
            return 0;
        case 'omrade':
            if (selectValue === "Presist") return 0;
            if (selectValue === "Generisk") return 3;
            return 0;
        case 'sail':
            if (selectValue === "I - II") return 0;
            if (selectValue === "III - IV") return 3;
            if (selectValue === "V - VI") return 5;
            return 0;
        case 'annen-risiko':
            if (selectValue === "Nei") return 0;
            if (selectValue === "Noe") return 1;
            if (selectValue === "Betydelig") return 3;
            return 0;
        case 'antall-baser':
            if (selectValue === "ingen") return 0;
            if (selectValue === "3 eller mindre") return 1;
            if (selectValue === "4 eller mer") return 3;
            return 0;
        case 'antall-piloter':
            if (selectValue === "10 eller mindre") return 0;
            if (selectValue === "10 - 20") return 1;
            if (selectValue === "20 eller flere") return 3;
            return 0;
        case 'ansvarsfordeling': {
            const antallBaserScore = getNumericValue('antall-baser-value');
            const antallPiloterScore = getNumericValue('antall-piloter-value');
            if (selectValue === "ok") return 0;
            if (selectValue === "Flere roller på én person") {
                // Calculation for "Flere roller på én person"
                try {
                    let sum = 1 + (antallBaserScore + antallPiloterScore) / 2;
                    return Math.round(sum);
                } catch { return 0; } // Fallback in case of calculation error
            }
            return 0;
        }
        case 'krav-eksamen':
            if (selectValue === "Nei") return 3;
            if (selectValue === "Ja, A1/A3/A2") return 1;
            if (selectValue === "Ja, STS") return 0;
            return 0;
        case 'kjopt-om':
            if (selectValue === "Nei") return 0;
            if (selectValue === "Ja") return 3;
            return 0;
        case 'sms-org':
            if (selectValue === "Til stede") return 0;
            if (selectValue === "N/A") return 1;
            return 0;
        case 'eksternt-vedlikehold':
            if (selectValue === "Nei") return 0;
            if (selectValue === "Ja") return 1;
            return 0;
        case 'flytimer':
            if (selectValue === "Under 100") return 0;
            if (selectValue === "Over 100") return 3;
            if (selectValue === "Over 1 000") return 5;
            return 0;
        case 'bekymringsmeldinger':
            if (selectValue === "Ingen") return 0;
            if (selectValue === "Noe") return 1;
            if (selectValue === "Middels") return 3;
            if (selectValue === "Alvorlig") return 5;
            return 0;
        case 'veiledningsbehov':
            if (selectValue === "Lite") return 0;
            if (selectValue === "Middels") return 1;
            if (selectValue === "Stort") return 3;
            return 0;
        case 'niva1-avvik':
            if (selectValue === "Nei") return 0;
            if (selectValue === "Ja") return 5;
            return 0;
        case 'niva2-avvik':
            if (selectValue === "0 - 3") return 0;
            if (selectValue === "4 - 7") return 1;
            if (selectValue === "Over 7") return 3;
            return 0;
        case 'frist-lukking':
            if (selectValue === "Overholdt") return 0;
            if (selectValue === "Overskredet") return 3;
            return 0;
        case 'sms-tilsyn':
            if (selectValue === "Fungerer") return 0;
            if (selectValue === "N/A") return 1;
            if (selectValue === "Til stede") return 3;
            return 0;
        case 'siste-kontakt':
            if (selectValue === "Under 12 månder") return 0;
            if (selectValue === "Mer enn 12 måneder") return 1;
            if (selectValue === "Mer enn 18 måneder") return 3;
            return 0;
        case 'empic-data':
            if (selectValue === "Nei") return 0;
            if (selectValue === "Ja") return 3;
            return 0;
        case 'oat-mangler':
            if (selectValue === "Nei") return 0;
            if (selectValue === "Ja") return 3;
            return 0;
        default:
            return 0;
    }
}

function updateCalculations() {
    let operationsTotal = 0;
    let orgTotal = 0;
    let innrapporteringTotal = 0;
    let sistTilsynTotal = 0;
    let ltSaksbehandlingTotal = 0;

    document.querySelectorAll('select').forEach(select => {
        if (select.value === "") {
            select.classList.add('placeholder-selected');
        } else {
            select.classList.remove('placeholder-selected');
        }
    });

    // Special handling for dependent scores like 'ansvarsfordeling'
    // Ensure these are calculated based on potentially updated values of 'antall-baser' and 'antall-piloter'
    // This block ensures base scores are updated first for dependencies to use them.
    ['antall-baser', 'antall-piloter'].forEach(id => {
        const select = document.getElementById(id);
        const fieldDef = fieldData.find(f => f.id === id);
        const valueCell = document.getElementById(id + '-value');
        if (select && fieldDef && valueCell) {
            let score = 0;
            if (!notAssessedState[fieldDef.section] && !select.disabled) {
                score = calculateFieldScore(id, select.value);
            }
            valueCell.textContent = score;
            applyValueCellStyle(valueCell, score, select.value === "");
        }
    });

    fieldData.forEach(field => {
        const select = document.getElementById(field.id);
        const valueCell = document.getElementById(field.id + '-value');

        if (select && valueCell) {
            let score = 0;
            if (!notAssessedState[field.section] && !select.disabled) {
                // Re-calculate all scores, including 'ansvarsfordeling' which depends on others
                score = calculateFieldScore(field.id, select.value);
                valueCell.textContent = score;
            } else {
                valueCell.textContent = 0; // If not assessed or disabled, score is 0
            }

            applyValueCellStyle(valueCell, score, select.value === "" && (!notAssessedState[field.section] && !select.disabled));

            if (!notAssessedState[field.section]) { // Only add to total if section is assessed
                if (field.group === 'operations') operationsTotal += score;
                else if (field.group === 'org') orgTotal += score;
                else if (field.group === 'innrapportering') innrapporteringTotal += score;
                else if (field.group === 'sistTilsyn') sistTilsynTotal += score;
                else if (field.group === 'ltSaksbehandling') ltSaksbehandlingTotal += score;
            }
        }
    });

    const docSumTotal = notAssessedState.doc ? 0 : operationsTotal + orgTotal;
    document.getElementById('doc-sum').textContent = docSumTotal;

    const ytelseSumTotal = notAssessedState.ytelse ? 0 : innrapporteringTotal + sistTilsynTotal + ltSaksbehandlingTotal;
    document.getElementById('ytelse-sum').textContent = ytelseSumTotal;

    const grandTotal = docSumTotal + ytelseSumTotal;
    document.getElementById('grand-total-display').textContent = grandTotal;
    
    updateGauge('doc', docSumTotal, MAX_SCORE_DOC_ORG_CONFIG);
    document.getElementById('doc-gauge-value').textContent = docSumTotal;

    updateGauge('ytelse', ytelseSumTotal, MAX_SCORE_YTELSE_CONFIG);
    document.getElementById('ytelse-gauge-value').textContent = ytelseSumTotal;

    updateGauge('total', grandTotal, MAX_SCORE_GRAND_TOTAL_CONFIG);
    document.getElementById('total-gauge-value').textContent = grandTotal;
    document.getElementById('total-gauge-sum-text').textContent = grandTotal;

    updateGaugeAndTotalVisibility();
    saveData(); // Save all form data.
    // NOTE: This version does NOT dynamically add new operator names typed by the user to the JSON file.
    // If you need that, you'll require a server-side component.
}

function updateGauge(prefix, value, maxValue) {
    const needle = document.getElementById(prefix + '-needle');
    let percentage = 0;
    if (maxValue > 0) {
        percentage = (value / maxValue) * 100;
    }
    const rotation = (percentage * 1.8) - 90; // 180 degrees range, -90 to 90
    if (needle) needle.style.transform = `translateX(-50%) rotate(${Math.max(-90, Math.min(rotation, 90))}deg)`;
}

// --- Endret CSV-funksjon ---
function downloadCSV() {
    if (!validateForm()) {
        return;
    }

    const operatorNavn = document.getElementById('operator-navn').value || "UkjentOperatør";
    const dateValue = document.getElementById('date').value;

    // Formaterer datoen tilbake til DD-MM-YYYY format fra datovelgeren
    let formattedDate;
    if (dateValue) {
        const parts = dateValue.split('-'); // Input is YYYY-MM-DD
        formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // Output becomes DD-MM-YYYY
    } else {
        // Fallback if no date is selected
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
        const yyyy = today.getFullYear();
        formattedDate = `${dd}-${mm}-${yyyy}`;
    }

    const fileName = `${operatorNavn.replace(/ /g,"_")}_${formattedDate}.csv`;
    
    // 1. Bygg overskriftsraden
    const headers = ['Operatørnavn', 'Fylt ut av', 'Dato', 'Dokumentasjon ikke vurdert', 'Ytelse ikke vurdert'];
    fieldData.forEach(field => {
        headers.push(`${field.label} (Valg)`);
        headers.push(`${field.label} (Verdi)`);
    });
    headers.push('Dokumentasjon Sum', 'Ytelse Sum', 'Totalsum', 'Kommentarer');

    // 2. Bygg dataraden
    const dataRow = [
        `"${operatorNavn.replace(/"/g, '""')}"`,
        `"${document.getElementById('filled-by').value.replace(/"/g, '""')}"`,
        `"${dateValue}"`,
        notAssessedState.doc ? "Ja" : "Nei",
        notAssessedState.ytelse ? "Ja" : "Nei"
    ];

    fieldData.forEach(field => {
        const selectedText = getSelectedText(field.id);
        const score = document.getElementById(field.id + '-value').textContent;
        dataRow.push(`"${selectedText.replace(/"/g, '""')}"`);
        dataRow.push(score);
    });

    const docSum = getNumericValue('doc-sum');
    const ytelseSum = getNumericValue('ytelse-sum');
    const grandTotalForCsv = (notAssessedState.doc && notAssessedState.ytelse) ? 0 : (docSum + ytelseSum);
    const comments = `"${document.getElementById('comments').value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;

    dataRow.push(docSum, ytelseSum, grandTotalForCsv, comments);

    // 3. Sett sammen til én CSV-streng med semikolon
    const csvContent = headers.join(';') + '\r\n' + dataRow.join(';');

    // 4. Last ned filen
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert("Direkte nedlasting støttes ikke av nettleseren din.");
    }
}

// Helper for parsing CSV fields, handling quotes and escaped quotes
function parseCsvField(field) {
    field = field.trim();
    if (field.startsWith('"') && field.endsWith('"')) {
        field = field.substring(1, field.length - 1).replace(/""/g, '"');
    }
    return field;
}

// --- Function to load CSV data ---
function loadCsvFile(event) {
    const file = event.target.files[0];
    if (!file) {
        console.log('No file selected or file dialog cancelled.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const csvContent = e.target.result;
        const lines = csvContent.split(/\r?\n/);

        if (lines.length < 2) {
            alert("CSV-filen er tom eller inneholder ikke nok data (minimum 2 rader for header og data).");
            return;
        }

        const headerLine = lines[0];
        const dataLine = lines[1];

        const headers = headerLine.split(';').map(h => parseCsvField(h));
        const data = dataLine.split(';').map(d => parseCsvField(d));

        if (headers.length !== data.length) {
            console.warn(`CSV header count (${headers.length}) mismatch data count (${data.length}). This might lead to issues.`);
        }

        const headerMap = {};
        headers.forEach((header, index) => {
            headerMap[header] = index;
        });

        // Populate general info fields
        const operatorNameFromCsv = data[headerMap['Operatørnavn']] || '';
        document.getElementById('operator-navn').value = operatorNameFromCsv;
        // When loading from CSV, also update the datalist suggestions if this operator is new
        loadOperatorNamesFromJsonAndPopulateDatalist(); // Re-populate with JSON list + current CSV value

        document.getElementById('filled-by').value = data[headerMap['Fylt ut av']] || '';
        document.getElementById('date').value = data[headerMap['Dato']] || ''; 

        // Populate 'Not Assessed' checkboxes
        const checkboxHeaders = [
            'Dokumentasjon ikke vurdert', 
            'Ytelse ikke vurdert'
        ];
        const checkboxIds = [
            'doc-not-assessed', 
            'ytelse-not-assessed'
        ];
        const checkboxStates = ['doc', 'ytelse'];

        checkboxHeaders.forEach((header, index) => {
            const checkboxId = checkboxIds[index];
            const stateKey = checkboxStates[index];
            const headerIndex = headerMap[header];

            if (headerIndex !== undefined && data[headerIndex] !== undefined) {
                notAssessedState[stateKey] = (data[headerIndex] === 'Ja');
                document.getElementById(checkboxId).checked = notAssessedState[stateKey];
                toggleNotAssessed(stateKey, true); // Pass true to avoid immediate re-calculation
            } else {
                console.warn(`Checkbox header '${header}' not found in CSV or data missing.`);
            }
        });

        // Populate fieldData select values
        fieldData.forEach(field => {
            const selectElement = document.getElementById(field.id);
            if (selectElement) {
                const choiceHeader = `${field.label} (Valg)`;
                const choiceIndex = headerMap[choiceHeader];
                
                if (choiceIndex !== undefined && data[choiceIndex] !== undefined) {
                    const valueToSet = data[choiceIndex];
                    let optionExists = Array.from(selectElement.options).some(option => option.value === valueToSet);

                    if (optionExists) {
                        selectElement.value = valueToSet;
                    } else {
                        console.warn(`Option value '${valueToSet}' not found for select ID '${field.id}'. Check CSV data and HTML options.`);
                        selectElement.value = ""; // Set to default/empty if not found
                    }
                } else {
                    console.warn(`CSV column for field '${choiceHeader}' not found or data missing for field ID '${field.id}'. Setting to empty.`);
                    selectElement.value = ""; // Set to default/empty if header/data missing
                }
            } else {
                console.warn(`HTML element not found for field ID: ${field.id}. Skipping population.`);
            }
        });

        // Populate comments field
        const commentsHeader = 'Kommentarer';
        if (headerMap[commentsHeader] !== undefined && data[headerMap[commentsHeader]] !== undefined) {
            document.getElementById('comments').value = data[headerMap[commentsHeader]] || '';
        } else {
            console.warn(`Comments header '${commentsHeader}' not found in CSV or data missing.`);
        }
        
        updateCalculations();
        alert("CSV-fil lastet inn!");
    };
    reader.onerror = function(e) {
        console.error('FileReader error:', e.target.error.code, e.target.error.message);
        alert("Det oppstod en feil under lesing av CSV-filen. Sjekk konsollen for detaljer.");
    };
    reader.readAsText(file);
}


// --- Initialisering ved side-lasting ---
document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners to buttons
    document.getElementById('clear-form-button').addEventListener('click', clearForm);
    document.getElementById('download-csv-button').addEventListener('click', downloadCSV);
    document.getElementById('print-pdf-button').addEventListener('click', printPDF);

    // Listeners for CSV upload
    const loadCsvButton = document.getElementById('load-csv-button');
    const csvFileInput = document.getElementById('csv-file-input');

    if (loadCsvButton && csvFileInput) {
        loadCsvButton.addEventListener('click', () => {
            csvFileInput.click(); // Triggers the hidden file input
        });
        csvFileInput.addEventListener('change', loadCsvFile); // Handles file selection
    } else {
        console.error('ERROR: Missing load-csv-button or csv-file-input in HTML. CSV load feature will not work.');
    }

    // Load saved data and set date
    // This function now handles loading initial operator names from JSON
    loadData(); 
    if (!document.getElementById('date').value) { // Set date only if it's not already filled
        document.getElementById('date').valueAsDate = new Date();
    }

    // Listeners for form elements to update calculations
    document.querySelectorAll('input[type="text"], input[type="date"], select, input[type="checkbox"], textarea').forEach(el => {
        el.addEventListener('change', updateCalculations);
        if (el.matches('input[type="text"]') || el.matches('textarea')) {
            el.addEventListener('keyup', updateCalculations);
        }
    });

    // Event listener for the operator name input specifically, to update datalist suggestions
    // if a new name is typed (it won't save to JSON directly from here, but will be added to suggestions for the session).
    document.getElementById('operator-navn').addEventListener('input', () => {
        // We re-load and populate the datalist with current typed value + JSON list
        // This ensures that as the user types, their input is available as a temporary suggestion
        // along with the pre-defined list.
        loadOperatorNamesFromJsonAndPopulateDatalist(); 
    });


    // Listeners to remove 'invalid' class on interaction
    document.querySelectorAll('input[type="text"]').forEach(input => {
        input.addEventListener('input', () => {
            if (input.value.trim() !== '') input.classList.remove('invalid');
        });
    });
    document.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', () => {
            if (select.value !== '') select.classList.remove('invalid');
        });
    });

    // Perform initial calculation on page load
    updateCalculations();
});