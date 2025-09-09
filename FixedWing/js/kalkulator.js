// --- Globale konstanter og variabler ---
const STORAGE_KEY = 'fixedWingComplexityData';
let scoringRules = {}; // Blir fylt inn fra data/scoring.json

// Max scores basert på Fixed Wing arket
const MAX_SCORE_RESOURCES = 21; // staff(5) + pilots(10) + cabin(1) + leading_personnel(5)
const MAX_SCORE_FLEET = 25;     // types(5) + ac_over_40t(10) + ac_5.7_40t(5) + ac_under_5.7t(5)
const MAX_SCORE_OPERATIONS = 29;// sectors(5) + type_op(10) + leasing(2) + airports(5) + group_airline(2) + cargo(5)
const MAX_SCORE_APPROVERS = 14; // 14 x Ja/Nei
const MAX_SCORE_GRAND_TOTAL = MAX_SCORE_RESOURCES + MAX_SCORE_FLEET + MAX_SCORE_OPERATIONS + MAX_SCORE_APPROVERS;

const fieldData = [
    { id: 'staff-employed', label: 'Total Number of staff employed for the operation', section: 'resources' },
    { id: 'pilots-employed', label: 'Number of pilots employed', section: 'resources' },
    { id: 'cabin-crew', label: 'Cabin crew carried', section: 'resources' },
    { id: 'leading-personnel-roles', label: 'Leading personell has several roles', section: 'resources' },
    { id: 'types-operated', label: 'Number of types operated', section: 'fleet' },
    { id: 'aircraft-over-40t', label: 'Number of aircraft operated over 40 000 kg', section: 'fleet' },
    { id: 'aircraft-5.7-40t', label: 'Number of aircraft operated between 5 700 kg & 40 000 kg', section: 'fleet' },
    { id: 'aircraft-under-5.7t', label: 'Number of aircraft operated under 5 700 kg', section: 'fleet' },
    { id: 'sectors-per-annum', label: 'Sectors per annum', section: 'operations' },
    { id: 'type-of-operation', label: 'Type of Operation', section: 'operations' },
    { id: 'aircraft-leasing', label: 'Aircraft leasing', section: 'operations' },
    { id: 'airports-based', label: 'Number of airports where aircraft and/or crews are permanently based', section: 'operations' },
    { id: 'group-airline', label: 'Group Airline', section: 'operations' },
    { id: 'cargo-carriage', label: 'Cargo Carriage', section: 'operations' },
    { id: 'rnp-ar-apch', label: 'RNP AR APCH', section: 'approvals' },
    { id: 'mnps-nat-hla', label: 'MNPS/ NAT-HLA', section: 'approvals' },
    { id: 'rvsm', label: 'RVSM', section: 'approvals' },
    { id: 'lv-takeoff', label: 'Low Visibility operations (TAKEOFF)', section: 'approvals' },
    { id: 'lv-landing', label: 'Low Visibility operations (LANDING)', section: 'approvals' },
    { id: 'etops', label: 'ETOPS', section: 'approvals' },
    { id: 'dangerous-goods', label: 'Dangerous Goods', section: 'approvals' },
    { id: 'single-engine-imc', label: 'Single-Engined Turbine IMC', section: 'approvals' },
    { id: 'efb', label: 'Electronic Flight Bag', section: 'approvals' },
    { id: 'isolated-aerodromes', label: 'Isolated Aerodromes', section: 'approvals' },
    { id: 'steep-approach', label: 'Steep Approach', section: 'approvals' },
    { id: 'atqp', label: 'ATQP', section: 'approvals' },
    { id: 'frm', label: 'Fatigue Risk Management', section: 'approvals' },
    { id: 'ato-lite', label: 'ATO Lite', section: 'approvals' }
];

// --- Funksjoner for lagring, lasting og tømming ---
function saveData() {
    const dataToSave = { inputs: {} };
    document.querySelectorAll('input[type="text"], select, textarea, input[type="date"]').forEach(el => {
        if (el.id) dataToSave.inputs[el.id] = el.value;
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
                if (el) el.value = data.inputs[id];
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

    const requiredTextInputs = ['operator-navn', 'filled-by'];
    requiredTextInputs.forEach(id => {
        const input = document.getElementById(id);
        if (!input.value.trim()) {
            errors.push(`"${input.previousElementSibling.textContent}" må fylles ut.`);
            input.classList.add('invalid');
            isValid = false;
        }
    });

    fieldData.forEach(field => {
        const select = document.getElementById(field.id);
        if (select && select.value === "") {
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

// --- Hjelpefunksjoner ---
function getNumericValue(elementId) {
    const el = document.getElementById(elementId);
    return el ? (parseFloat(el.textContent) || 0) : 0;
}

function getSelectedText(selectId) {
    const selectElement = document.getElementById(selectId);
    if (selectElement && selectElement.selectedIndex >= 0) {
        return selectElement.options[selectElement.selectedIndex]?.text || "";
    }
    return "";
}

function applyValueCellStyle(valueCell, score, isPlaceholderValue) {
    valueCell.className = 'form-cell calculated-value'; // Reset classes
    if (isPlaceholderValue) {
        valueCell.classList.add('bg-default-gray');
    } else if (score <= 1) {
        valueCell.classList.add('bg-weak-green');
    } else if (score <= 3) {
        valueCell.classList.add('bg-weak-yellow');
    } else if (score >= 4) {
        valueCell.classList.add('bg-weak-red');
    }
}

// --- Kjernefunksjoner for beregning ---
function calculateFieldScore(selectId, selectValue) {
    if (selectValue === "" || Object.keys(scoringRules).length === 0) return 0;

    const approvalFields = [
        'rnp-ar-apch', 'mnps-nat-hla', 'rvsm', 'lv-takeoff', 'lv-landing',
        'etops', 'dangerous-goods', 'single-engine-imc', 'efb', 'isolated-aerodromes',
        'steep-approach', 'atqp', 'frm', 'ato-lite'
    ];
    if (approvalFields.includes(selectId)) {
        return scoringRules['generic-approval']?.[selectValue] ?? 0;
    }

    const rule = scoringRules[selectId];
    if (!rule) return 0;

    const scoreRule = rule[selectValue];
    if (typeof scoreRule === 'number') {
        return scoreRule;
    } else if (typeof scoreRule === 'object' && scoreRule.type === 'dependent') {
        const dependentValue = document.getElementById(scoreRule.on)?.value;
        if (!dependentValue) return scoreRule.default;
        return scoreRule.scores[dependentValue] ?? scoreRule.default;
    }
    return 0;
}

function updateCalculations() {
    let totals = { resources: 0, fleet: 0, operations: 0, approvals: 0 };

    fieldData.forEach(field => {
        const select = document.getElementById(field.id);
        const valueCell = document.getElementById(field.id + '-value');
        
        select.classList.toggle('placeholder-selected', select.value === "");

        if (select && valueCell) {
            const score = calculateFieldScore(field.id, select.value);
            valueCell.textContent = score;
            applyValueCellStyle(valueCell, score, select.value === "");
            totals[field.section] += score;
        }
    });

    // Oppdater summer og gauges
    Object.keys(totals).forEach(section => {
        const maxScore = window[`MAX_SCORE_${section.toUpperCase()}`];
        document.getElementById(`${section}-sum`).textContent = totals[section];
        document.getElementById(`${section}-gauge-value`).textContent = totals[section];
        updateGauge(section, totals[section], maxScore);
    });

    // Totalsum
    const grandTotal = totals.resources + totals.fleet + totals.operations + totals.approvals;
    document.getElementById('grand-total-display').textContent = grandTotal;
    document.getElementById('total-gauge-sum-text').textContent = grandTotal;
    document.getElementById('total-gauge-value').textContent = grandTotal;
    updateGauge('total', grandTotal, MAX_SCORE_GRAND_TOTAL);
    
    saveData();
}

function updateGauge(prefix, value, maxValue) {
    const needle = document.getElementById(prefix + '-needle');
    if (!needle) return;
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    const rotation = (percentage * 1.8) - 90;
    needle.style.transform = `translateX(-50%) rotate(${Math.max(-90, Math.min(rotation, 90))}deg)`;
}

// --- Funksjoner for CSV ---
function parseCsvField(field) {
    field = field.trim();
    if (field.startsWith('"') && field.endsWith('"')) {
        return field.substring(1, field.length - 1).replace(/""/g, '"');
    }
    return field;
}

function downloadCSV() {
    if (!validateForm()) return;

    const operatorNavn = document.getElementById('operator-navn').value || "UkjentOperatør";
    const dateValue = document.getElementById('date').value;
    const today = new Date();
    const formattedDate = dateValue ? `${dateValue.split('-')[2]}-${dateValue.split('-')[1]}-${dateValue.split('-')[0]}` : `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    const fileName = `${operatorNavn.replace(/\s/g, "_")}_${formattedDate}.csv`;

    const headers = ['Operatørnavn', 'Fylt ut av', 'Dato'];
    fieldData.forEach(field => {
        headers.push(`${field.label} (Valg)`, `${field.label} (Verdi)`);
    });
    headers.push('Resources Sum', 'Fleet Specific Sum', 'Operations Sum', 'Approvals Sum', 'Totalsum', 'Kommentarer');

    const dataRow = [
        `"${operatorNavn.replace(/"/g, '""')}"`,
        `"${document.getElementById('filled-by').value.replace(/"/g, '""')}"`,
        `"${dateValue}"`
    ];

    fieldData.forEach(field => {
        dataRow.push(`"${getSelectedText(field.id).replace(/"/g, '""')}"`, document.getElementById(field.id + '-value').textContent);
    });

    const resourcesSum = getNumericValue('resources-sum');
    const fleetSum = getNumericValue('fleet-sum');
    const operationsSum = getNumericValue('operations-sum');
    const approvalsSum = getNumericValue('approvals-sum');
    const grandTotalForCsv = resourcesSum + fleetSum + operationsSum + approvalsSum;
    const comments = `"${document.getElementById('comments').value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    dataRow.push(resourcesSum, fleetSum, operationsSum, approvalsSum, grandTotalForCsv, comments);

    const csvContent = headers.join(';') + '\r\n' + dataRow.join(';');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function loadCsvFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const lines = e.target.result.split(/\r?\n/);
        if (lines.length < 2) return alert("CSV-filen er tom eller ugyldig.");

        const headers = lines[0].split(';').map(h => parseCsvField(h));
        const data = lines[1].split(';').map(d => parseCsvField(d));
        const headerMap = Object.fromEntries(headers.map((h, i) => [h, i]));

        document.getElementById('operator-navn').value = data[headerMap['Operatørnavn']] || '';
        document.getElementById('filled-by').value = data[headerMap['Fylt ut av']] || '';
        document.getElementById('date').value = data[headerMap['Dato']] || '';

        fieldData.forEach(field => {
            const select = document.getElementById(field.id);
            if (select) {
                const valueToSet = data[headerMap[`${field.label} (Valg)`]];
                if (valueToSet !== undefined) {
                    const option = [...select.options].find(opt => opt.text === valueToSet);
                    select.value = option ? option.value : "";
                }
            }
        });

        document.getElementById('comments').value = data[headerMap['Kommentarer']] || '';
        updateCalculations();
        alert("CSV-fil lastet inn!");
    };
    reader.readAsText(file, 'UTF-8');
}

// --- Initialisering ved side-lasting ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [scoringRes, operatorsRes] = await Promise.all([
            fetch('data/scoring.json'),
            fetch('data/operators.json')
        ]);
        scoringRules = await scoringRes.json();
        const operators = await operatorsRes.json();
        const datalist = document.getElementById('operator-list');
        operators.forEach(op => {
            const option = document.createElement('option');
            option.value = op;
            datalist.appendChild(option);
        });
    } catch (error) {
        console.error('Klarte ikke å laste inn nødvendige datafiler:', error);
        alert('FEIL: Kunne ikke laste inn datafiler (scoring/operators). Sjekk at filene ligger i "data"-mappen og at stien er riktig.');
        return;
    }

    // Feste hendelseslyttere
    document.getElementById('clear-form-button').addEventListener('click', clearForm);
    document.getElementById('download-csv-button').addEventListener('click', downloadCSV);
    document.getElementById('print-pdf-button').addEventListener('click', printPDF);
    document.getElementById('load-csv-button').addEventListener('click', () => document.getElementById('csv-file-input').click());
    document.getElementById('csv-file-input').addEventListener('change', loadCsvFile);

    document.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('change', updateCalculations);
        if (el.matches('input[type="text"], textarea')) {
            el.addEventListener('keyup', updateCalculations);
        }
        el.addEventListener('input', () => {
            if (el.value.trim() !== '') el.classList.remove('invalid');
        });
    });

    // Initialiser skjemaet
    loadData();
    if (!document.getElementById('date').value) {
        document.getElementById('date').valueAsDate = new Date();
    }
    updateCalculations();
});