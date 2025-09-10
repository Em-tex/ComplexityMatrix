// --- Globale konstanter og variabler ---
const STORAGE_KEY = 'rotaryComplexityData';

// Max scores based on the Excel sheet (sum of maximum values for each category)
const MAX_SCORE_RESOURCES = 5 + 5 + 1 + 1; // staff (5) + pilots (5) + cabin (1) + technical (1) = 12
const MAX_SCORE_FLEET = 5 + 10 + 5 + 5 + 1; // types (5) + multi-offshore (10) + multi-onshore (5) + single (5) + leasing (1) = 26
const MAX_SCORE_OPERATIONS = 5 + 3 + 3 + 2 + 2 + 5 + 2 + 5 + 2 + 2; // Area (5) + Airports (3) + Landings (3) + Route (2) + IFR/IMC (2) + NCC (5) + SPO (2) + Sectors (5) + Mix (2) + Group Airline (2) = 33
const MAX_SCORE_APPROVERS = 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 10 + 10 + 10 + 6 + 1 + 1 + 1; // RNP (1) + MNPS (1) + RVSM (1) + LV Takeoff (1) + LV Landing (1) + Dangerous Goods (1) + NVIS (1) + HHO (1) + HEMS (10) + HOFO (10) + SAR (10) + Police (6) + EFB (1) + FRM (1) + ATO (1) = 47
const MAX_SCORE_GRAND_TOTAL = MAX_SCORE_RESOURCES + MAX_SCORE_FLEET + MAX_SCORE_OPERATIONS + MAX_SCORE_APPROVERS; // 12 + 26 + 33 + 47 = 118

const notAssessedState = {
    resources: false,
    fleet: false,
    operations: false,
    approvals: false // New section
};

const fieldData = [
    // Resources (Blå del)
    { id: 'staff-employed', label: 'Number of staff employed for the operation (full time and temporary)', section: 'resources' },
    { id: 'pilots-employed', label: 'Number of pilots employed - both full time and temporary/contract', section: 'resources' },
    { id: 'cabin-crew', label: 'Cabin Crew Carried', section: 'resources' },
    { id: 'technical-crew', label: 'Technical Crew Carried', section: 'resources' },

    // Fleet Specific (Grønn del)
    { id: 'types-operated', label: 'Number of types operated', section: 'fleet' },
    { id: 'multi-engine-offshore', label: 'Number of Multi-engined helicopters operating offshore', section: 'fleet' },
    { id: 'multi-engine-onshore', label: 'Number of Multi-engined helicopters operating onshore', section: 'fleet' },
    { id: 'single-engine-helicopters', label: 'Number of single engine helicopters operated', section: 'fleet' },
    { id: 'ac-leasing', label: 'A/C Leasing', section: 'fleet' },

    // Operations (Lilla del)
    { id: 'area-of-operation', label: 'Area of Operation', section: 'operations' },
    { id: 'airports-permanently-based', label: 'Number of airports where aircraft and/or crews are permanently based', section: 'operations' },
    { id: 'landings', label: 'Landings', section: 'operations' },
    { id: 'route', label: 'Route', section: 'operations' },
    { id: 'ifr-imc-operation', label: 'IFR/IMC Operation', section: 'operations' },
    { id: 'ncc', label: 'NCC', section: 'operations' },
    { id: 'spo', label: 'SPO', section: 'operations' },
    { id: 'sectors-per-annum', label: 'Sectors per annum', section: 'operations' },
    { id: 'mix-operations', label: 'Mix Operations (Cargo, Pax)', section: 'operations' },
    { id: 'group-airline', label: 'Group Airline', section: 'operations' },

    // Approvals (Mintblå seksjon)
    { id: 'rnp-03', label: 'RNP 0.3', section: 'approvals' },
    { id: 'mnps', label: 'MNPS', section: 'approvals' },
    { id: 'rvsm', label: 'RVSM', section: 'approvals' },
    { id: 'lv-takeoff', label: 'Low Visibility operations (TAKEOFF)', section: 'approvals' },
    { id: 'lv-landing', label: 'Low Visibility Operations (LANDING)', section: 'approvals' },
    { id: 'dangerous-goods', label: 'Dangerous Goods', section: 'approvals' },
    { id: 'nvis', label: 'NVIS', section: 'approvals' },
    { id: 'hho', label: 'HHO', section: 'approvals' },
    { id: 'hems', label: 'HEMS', section: 'approvals' },
    { id: 'hofo', label: 'HOFO', section: 'approvals' },
    { id: 'sar', label: 'SAR', section: 'approvals' },
    { id: 'police-operations', label: 'Police operations', section: 'approvals' },
    { id: 'efb-approval', label: 'EFB Approval', section: 'approvals' },
    { id: 'frm', label: 'FRM', section: 'approvals' },
    { id: 'ato-lite', label: 'ATO Lite', section: 'approvals' }
];


// --- Funksjoner for lagring, lasting og tømming ---

function saveData() {
    const dataToSave = {
        inputs: {},
        checkboxes: {}
    };
    document.querySelectorAll('input[type="text"], select, textarea, input[type="date"]').forEach(el => {
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
                    if ((prefix === 'resources' || prefix === 'fleet' || prefix === 'operations' || prefix === 'approvals') && el.checked) {
                        toggleNotAssessed(prefix, true);
                    }
                }
            }
        }
    }
}

function clearForm() {
    if (confirm("Er du sikker på at du vil tømme skjemaet? All lagret data vil bli slettet.")) {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
    }
}

// --- Funksjoner for validering ---

function validateForm() {
    const errors = [];
    let isValid = true;
    document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

    const operatorNavnInput = document.getElementById('operator-navn');
    const filledByInput = document.getElementById('filled-by');

    if (!operatorNavnInput.value.trim()) {
        errors.push("Operatørnavn må fylles ut.");
        operatorNavnInput.classList.add('invalid');
        isValid = false;
    }
    if (!filledByInput.value.trim()) {
        errors.push("Fylt ut av må fylles ut.");
        filledByInput.classList.add('invalid');
        isValid = false;
    }

    // Validate all selects unless their section is marked "not assessed"
    fieldData.forEach(field => {
        const select = document.getElementById(field.id);
        if (select && !notAssessedState[field.section] && select.value === "") {
            errors.push(`Vennligst gjør et valg for "${field.label}".`);
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
            select.classList.remove('invalid');
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
    const resourcesGaugeBlock = document.getElementById('gauge-block-resources');
    const fleetGaugeBlock = document.getElementById('gauge-block-fleet');
    const operationsGaugeBlock = document.getElementById('gauge-block-operations');
    const approvalsGaugeBlock = document.getElementById('gauge-block-approvals');
    const totalGaugeBlock = document.getElementById('gauge-block-total');
    const grandTotalTextElement = document.getElementById('grand-total-text');
    const totalSummaryBlock = document.getElementById('total-summary-block');

    let resourcesAssessed = !notAssessedState.resources;
    let fleetAssessed = !notAssessedState.fleet;
    let operationsAssessed = !notAssessedState.operations;
    let approvalsAssessed = !notAssessedState.approvals;

    if (resourcesAssessed) resourcesGaugeBlock.classList.remove('hidden-gauge'); else resourcesGaugeBlock.classList.add('hidden-gauge');
    if (fleetAssessed) fleetGaugeBlock.classList.remove('hidden-gauge'); else fleetGaugeBlock.classList.add('hidden-gauge');
    if (operationsAssessed) operationsGaugeBlock.classList.remove('hidden-gauge'); else operationsGaugeBlock.classList.add('hidden-gauge');
    if (approvalsAssessed) approvalsGaugeBlock.classList.remove('hidden-gauge'); else approvalsGaugeBlock.classList.add('hidden-gauge');
    
    if (!resourcesAssessed && !fleetAssessed && !operationsAssessed && !approvalsAssessed) {
        totalSummaryBlock.classList.add('hidden');
    } else {
        totalSummaryBlock.classList.remove('hidden');
    }

    // Only show total gauge and text if all relevant sections are assessed
    if (resourcesAssessed && fleetAssessed && operationsAssessed && approvalsAssessed) {
        totalGaugeBlock.classList.remove('hidden-gauge');
        grandTotalTextElement.classList.remove('hidden-total-text');
    } else {
        totalGaugeBlock.classList.add('hidden-gauge');
        grandTotalTextElement.classList.add('hidden-total-text');
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
    } else if (score <= 1) { // Adjusted thresholds based on common risk matrix (Green)
        valueCell.classList.add('bg-weak-green');
    } else if (score <= 3) { // Yellow
        valueCell.classList.add('bg-weak-yellow');
    } else if (score >= 4) { // Red - for general high risk values
        valueCell.classList.add('bg-weak-red');
    } else {
        valueCell.classList.add('bg-default-gray');
    }
}

function calculateFieldScore(selectId, selectValue) {
    if (selectValue === "") return 0; // Return 0 if no selection is made

    switch (selectId) {
        // Resources (Blå del)
        case 'staff-employed':
            if (selectValue === "<10") return 1;
            if (selectValue === "11-50") return 2;
            if (selectValue === "51-200") return 3;
            if (selectValue === "201-500") return 4;
            if (selectValue === ">500") return 5;
            return 0;
        case 'pilots-employed':
            if (selectValue === "<10") return 1;
            if (selectValue === "11-30") return 2;
            if (selectValue === "31-100") return 3;
            if (selectValue === "101-200") return 4;
            if (selectValue === ">201") return 5;
            return 0;
        case 'cabin-crew':
        case 'technical-crew':
            if (selectValue === "No") return 0;
            if (selectValue === "Yes") return 1;
            return 0;

        // Fleet Specific (Grønn del)
        case 'types-operated':
            if (selectValue === "<3") return 1;
            if (selectValue === "4-6") return 2;
            if (selectValue === "7-9") return 3;
            if (selectValue === "10-12") return 4;
            if (selectValue === ">12") return 5;
            return 0;
        case 'multi-engine-offshore':
            if (selectValue === "N/A") return 0;
            if (selectValue === "1-5") return 2;
            if (selectValue === "6-10") return 4;
            if (selectValue === "11-15") return 6;
            if (selectValue === "16-20") return 8;
            if (selectValue === ">20") return 10;
            return 0;
        case 'multi-engine-onshore':
        case 'single-engine-helicopters':
            if (selectValue === "N/A") return 0;
            if (selectValue === "1-5") return 1;
            if (selectValue === "6-10") return 2;
            if (selectValue === "11-15") return 3;
            if (selectValue === "16-20") return 4;
            if (selectValue === ">20") return 5;
            return 0;
        case 'ac-leasing':
            if (selectValue === "No") return 0;
            if (selectValue === "Yes") return 1;
            return 0;

        // Operations (Lilla del)
        case 'area-of-operation':
            if (selectValue === "Within Norway only") return 1;
            if (selectValue === "Within EU") return 2;
            if (selectValue === "Worldwide") return 5;
            return 0;
        case 'airports-permanently-based':
            if (selectValue === "1") return 1;
            if (selectValue === "2-5") return 2;
            if (selectValue === ">5") return 3;
            return 0;
        case 'landings':
            if (selectValue === "N/A") return 0;
            if (selectValue === "Ad-hoc landings") return 1;
            if (selectValue === "Ad-hoc landings in congested areas") return 3;
            return 0;
        case 'route':
            if (selectValue === "A-A") return 1;
            if (selectValue === "A-B Restricted") return 1;
            if (selectValue === "A-B") return 2;
            return 0;
        case 'ifr-imc-operation':
            if (selectValue === "No") return 0;
            if (selectValue === "Yes") return 2;
            return 0;
        case 'ncc':
            if (selectValue === "No") return 0;
            if (selectValue === "Yes, own a/c") return 1;
            if (selectValue === "Yes, managed a/c") return 5;
            return 0;
        case 'spo':
            if (selectValue === "No") return 0;
            if (selectValue === "Yes") return 1;
            if (selectValue === "High risk SPO") return 2;
            return 0;
        case 'sectors-per-annum':
            if (selectValue === "<=500") return 0;
            if (selectValue === "501-2k") return 1;
            if (selectValue === "2001-5k") return 2;
            if (selectValue === "5001-10k") return 3;
            if (selectValue === "10001-25k") return 4;
            if (selectValue === ">25k") return 5;
            return 0;
        case 'mix-operations':
        case 'group-airline':
            if (selectValue === "No") return 0;
            if (selectValue === "Yes") return 2;
            return 0;

        // Approvals (Mintblå seksjon)
        case 'rnp-03':
        case 'mnps':
        case 'rvsm':
        case 'lv-takeoff':
        case 'lv-landing':
        case 'dangerous-goods':
        case 'nvis':
        case 'hho':
        case 'efb-approval':
        case 'frm':
        case 'ato-lite':
            if (selectValue === "No") return 0;
            if (selectValue === "Yes") return 1;
            return 0;
        case 'hems':
            if (selectValue === "No") return 0;
            if (selectValue === "3 a/c or less") return 5;
            if (selectValue === "4 a/c or more") return 10;
            return 0;
        case 'hofo':
            if (selectValue === "N/A") return 0;
            if (selectValue === "Offshore Windfarms") return 5;
            if (selectValue === "Offshore Helideck") return 10;
            return 0;
        case 'sar':
            if (selectValue === "No") return 0;
            if (selectValue === "3 a/c or less") return 5;
            if (selectValue === "4 a/c or more") return 10;
            return 0;
        case 'police-operations':
            if (selectValue === "No") return 0;
            if (selectValue === "3 a/c or less") return 3;
            if (selectValue === "4 a/c or more") return 6;
            return 0;

        default:
            return 0;
    }
}

function updateCalculations() {
    let resourcesTotal = 0;
    let fleetTotal = 0;
    let operationsTotal = 0;
    let approvalsTotal = 0; // New total for approvals

    document.querySelectorAll('select').forEach(select => {
        if (select.value === "") {
            select.classList.add('placeholder-selected');
        } else {
            select.classList.remove('placeholder-selected');
        }

        const fieldId = select.id;
        const fieldDef = fieldData.find(f => f.id === fieldId);
        const valueCell = document.getElementById(fieldId + '-value');

        if (select && fieldDef && valueCell) {
            let score = 0;
            // Calculate score only if the section is not marked "not assessed" AND the select is not disabled
            if (!notAssessedState[fieldDef.section] && !select.disabled) {
                score = calculateFieldScore(fieldId, select.value);
            }
            valueCell.textContent = score;
            applyValueCellStyle(valueCell, score, select.value === "" && (!notAssessedState[fieldDef.section] && !select.disabled));

            // Accumulate totals based on section
            if (!notAssessedState[fieldDef.section]) {
                if (fieldDef.section === 'resources') resourcesTotal += score;
                else if (fieldDef.section === 'fleet') fleetTotal += score;
                else if (fieldDef.section === 'operations') operationsTotal += score;
                else if (fieldDef.section === 'approvals') approvalsTotal += score; // Accumulate for approvals
            }
        }
    });

    // Update section sums
    document.getElementById('resources-sum').textContent = resourcesTotal;
    document.getElementById('fleet-sum').textContent = fleetTotal;
    document.getElementById('operations-sum').textContent = operationsTotal;
    document.getElementById('approvals-sum').textContent = approvalsTotal; // Update approvals sum

    // Update gauges
    updateGauge('resources', resourcesTotal, MAX_SCORE_RESOURCES);
    document.getElementById('resources-gauge-value').textContent = resourcesTotal;
    document.getElementById('resources-max-sum').textContent = MAX_SCORE_RESOURCES;


    updateGauge('fleet', fleetTotal, MAX_SCORE_FLEET);
    document.getElementById('fleet-gauge-value').textContent = fleetTotal;
    document.getElementById('fleet-max-sum').textContent = MAX_SCORE_FLEET;


    updateGauge('operations', operationsTotal, MAX_SCORE_OPERATIONS);
    document.getElementById('operations-gauge-value').textContent = operationsTotal;
    document.getElementById('operations-max-sum').textContent = MAX_SCORE_OPERATIONS;

    // Update approvals gauge
    updateGauge('approvals', approvalsTotal, MAX_SCORE_APPROVERS);
    document.getElementById('approvals-gauge-value').textContent = approvalsTotal;
    document.getElementById('approvals-max-sum').textContent = MAX_SCORE_APPROVERS;


    // Calculate grand total - only if ALL sections are assessed
    const grandTotal = (notAssessedState.resources || notAssessedState.fleet || notAssessedState.operations || notAssessedState.approvals) ? 0 : (resourcesTotal + fleetTotal + operationsTotal + approvalsTotal);
    document.getElementById('grand-total-display').textContent = grandTotal;
    document.getElementById('total-gauge-sum-text').textContent = grandTotal;

    // Update the total gauge with the correct max value
    document.getElementById('grand-max-total-display').textContent = MAX_SCORE_GRAND_TOTAL;
    document.getElementById('total-gauge-max-text').textContent = MAX_SCORE_GRAND_TOTAL;
    updateGauge('total', grandTotal, MAX_SCORE_GRAND_TOTAL);
    document.getElementById('total-gauge-value').textContent = grandTotal;


    updateGaugeAndTotalVisibility();
    saveData();
}

function updateGauge(prefix, value, maxValue) {
    const needle = document.getElementById(prefix + '-needle');
    let percentage = 0;
    if (maxValue > 0) {
        percentage = (value / maxValue) * 100;
    }
    const rotation = (percentage * 1.8) - 90; // -90 for start at 0, 1.8 for 180 degrees range
    if (needle) needle.style.transform = `translateX(-50%) rotate(${Math.max(-90, Math.min(rotation, 90))}deg)`;
}

// Helper to parse CSV fields, handling quotes and escaped quotes
function parseCsvField(field) {
    field = field.trim();
    if (field.startsWith('"') && field.endsWith('"')) {
        field = field.substring(1, field.length - 1).replace(/""/g, '"');
    }
    return field;
}

// --- Funksjon for å laste ned CSV data ---
function downloadCSV() {
    if (!validateForm()) {
        return;
    }
    const operatorNavn = document.getElementById('operator-navn').value || "UkjentOperatør";
    const dateValue = document.getElementById('date').value;

    let formattedDate;
    if (dateValue) {
        const parts = dateValue.split('-'); // Input is YYYY-MM-DD
        formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // Output becomes DD-MM-YYYY
    } else {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        formattedDate = `${dd}-${mm}-${yyyy}`;
    }
    const fileName = `${operatorNavn.replace(/ /g, "_")}_${formattedDate}.csv`;

    // 1. Bygg overskriftsraden
    const headers = ['Operatørnavn', 'Fylt ut av', 'Dato', 'Resources ikke vurdert', 'Fleet Specific ikke vurdert', 'Operations ikke vurdert', 'Approvals ikke vurdert'];
    fieldData.forEach(field => {
        headers.push(`${field.label} (Valg)`);
        headers.push(`${field.label} (Verdi)`);
    });
    headers.push('Resources Sum', 'Fleet Specific Sum', 'Operations Sum', 'Approvals Sum', 'Totalsum', 'Kommentarer');

    // 2. Bygg dataraden
    const dataRow = [
        `"${operatorNavn.replace(/"/g, '""')}"`,
        `"${document.getElementById('filled-by').value.replace(/"/g, '""')}"`,
        `"${dateValue}"`,
        notAssessedState.resources ? "Ja" : "Nei",
        notAssessedState.fleet ? "Ja" : "Nei",
        notAssessedState.operations ? "Ja" : "Nei",
        notAssessedState.approvals ? "Ja" : "Nei" // New approvals assessed status
    ];
    fieldData.forEach(field => {
        const selectedText = getSelectedText(field.id);
        const score = document.getElementById(field.id + '-value').textContent;
        dataRow.push(`"${selectedText.replace(/"/g, '""')}"`);
        dataRow.push(score);
    });

    const resourcesSum = getNumericValue('resources-sum');
    const fleetSum = getNumericValue('fleet-sum');
    const operationsSum = getNumericValue('operations-sum');
    const approvalsSum = getNumericValue('approvals-sum'); // Get approvals sum

    const grandTotalForCsv = (notAssessedState.resources || notAssessedState.fleet || notAssessedState.operations || notAssessedState.approvals) ? 0 : (resourcesSum + fleetSum + operationsSum + approvalsSum);
    const comments = `"${document.getElementById('comments').value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    dataRow.push(resourcesSum, fleetSum, operationsSum, approvalsSum, grandTotalForCsv, comments);

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


// --- Funksjon for å laste inn CSV data ---
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
        document.getElementById('operator-navn').value = data[headerMap['Operatørnavn']] || '';
        document.getElementById('filled-by').value = data[headerMap['Fylt ut av']] || '';
        document.getElementById('date').value = data[headerMap['Dato']] || ''; 

        // Populate 'Not Assessed' checkboxes
        const checkboxHeaders = [
            'Resources ikke vurdert', 
            'Fleet Specific ikke vurdert', 
            'Operations ikke vurdert', 
            'Approvals ikke vurdert'
        ];
        const checkboxIds = [
            'resources-not-assessed', 
            'fleet-not-assessed', 
            'operations-not-assessed', 
            'approvals-not-assessed'
        ];
        const checkboxStates = ['resources', 'fleet', 'operations', 'approvals'];

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
                        selectElement.value = ""; 
                    }
                } else {
                    console.warn(`CSV column for field '${choiceHeader}' not found or data missing for field ID '${field.id}'. Setting to empty.`);
                    selectElement.value = ""; 
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
    // Feste hendelseslyttere til knapper
    document.getElementById('clear-form-button').addEventListener('click', clearForm);
    document.getElementById('download-csv-button').addEventListener('click', downloadCSV); // downloadCSV er globalt tilgjengelig
    document.getElementById('print-pdf-button').addEventListener('click', printPDF); // printPDF er globalt tilgjengelig

    // Lyttere for CSV opplasting
    const loadCsvButton = document.getElementById('load-csv-button');
    const csvFileInput = document.getElementById('csv-file-input');

    if (loadCsvButton && csvFileInput) {
        loadCsvButton.addEventListener('click', () => {
            csvFileInput.click(); // Triggerer det skjulte fil-inputet
        });
        csvFileInput.addEventListener('change', loadCsvFile); // Håndterer filvalg
    } else {
        console.error('ERROR: Missing load-csv-button or csv-file-input in HTML. CSV load feature will not work.');
    }

    // Laste inn lagret data og sette dato
    loadData();
    if (!document.getElementById('date').value) { // Sett kun dato hvis den ikke allerede er fylt ut
        document.getElementById('date').valueAsDate = new Date();
    }

    // Lyttere for skjemaelementer for å oppdatere beregninger
    document.querySelectorAll('input[type="text"], input[type="date"], select, input[type="checkbox"], textarea').forEach(el => {
        el.addEventListener('change', updateCalculations);
        if (el.matches('input[type="text"]') || el.matches('textarea')) {
            el.addEventListener('keyup', updateCalculations);
        }
    });

    // Lyttere for å fjerne 'invalid' klasse ved interaksjon
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

    // Utfør første beregning ved sideinnlasting
    updateCalculations();
});