// --- Globale konstanter og variabler ---
const STORAGE_KEY = 'fixedWingComplexityData';
let scoringRules = {};
let gauges = {}; // Objekt for å holde på de nye måler-instansene

// Max scores definert for målerne
const MAX_SCORES = {
    resources: 21,
    fleet: 25,
    operations: 29,
    approvals: 14,
    total: 21 + 25 + 29 + 14
};

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

// --- NY FUNKSJONALITET FOR MÅLERE (GAUGES) ---
function createGauge(elementId, maxValue) {
    const canvas = document.getElementById(elementId);
    if (!canvas) return null;
    const gaugeOptions = {
        angle: 0.15, lineWidth: 0.3, radiusScale: 1.0,
        pointer: { length: 0.5, strokeWidth: 0.035, color: '#333' },
        staticZones: [
           {strokeStyle: "#30B32D", min: 0, max: maxValue * 0.4},
           {strokeStyle: "#FFDD00", min: maxValue * 0.4, max: maxValue * 0.75},
           {strokeStyle: "#F03E3E", min: maxValue * 0.75, max: maxValue}
        ],
        strokeColor: '#E0E0E0', generateGradient: true, highDpiSupport: true,
    };
    const gauge = new Gauge(canvas).setOptions(gaugeOptions);
    gauge.maxValue = maxValue;
    gauge.setMinValue(0);
    gauge.animationSpeed = 32;
    gauge.set(0);
    return gauge;
}

function initializeGauges() {
    gauges.resources = createGauge('resources-gauge', MAX_SCORES.resources);
    gauges.fleet = createGauge('fleet-gauge', MAX_SCORES.fleet);
    gauges.operations = createGauge('operations-gauge', MAX_SCORES.operations);
    gauges.approvals = createGauge('approvals-gauge', MAX_SCORES.approvals);
    gauges.total = createGauge('total-gauge', MAX_SCORES.total);
}

// --- Funksjoner for lagring, lasting og tømming (UENDRET) ---
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
    if (confirm("Er du sikker på at du vil tømme skjemaet?")) {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
    }
}

// --- Funksjoner for validering og utskrift (UENDRET) ---
function validateForm() {
    let isValid = true;
    document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

    fieldData.forEach(field => {
        const select = document.getElementById(field.id);
        if (select && select.value === "") {
            select.classList.add('invalid');
            isValid = false;
        }
    });
    if (!isValid) alert("Vennligst fyll ut alle felter markert i rødt.");
    return isValid;
}

function printPDF() {
    if (validateForm()) window.print();
}

// --- Hjelpefunksjoner (UENDRET) ---
function getSelectedText(selectId) {
    const select = document.getElementById(selectId);
    return select && select.selectedIndex >= 0 ? select.options[select.selectedIndex].text : "";
}

function applyValueCellStyle(valueCell, score, isPlaceholderValue) {
    valueCell.className = 'calculated-value';
    if (isPlaceholderValue) valueCell.classList.add('bg-default-gray');
    else if (score <= 1) valueCell.classList.add('bg-weak-green');
    else if (score <= 3) valueCell.classList.add('bg-weak-yellow');
    else if (score >= 4) valueCell.classList.add('bg-weak-red');
}

// --- Kjernefunksjoner for beregning (MODIFISERT) ---
function calculateFieldScore(selectId, selectValue) {
    if (selectValue === "" || Object.keys(scoringRules).length === 0) return 0;
    const approvalFields = fieldData.filter(f => f.section === 'approvals').map(f => f.id);
    if (approvalFields.includes(selectId)) {
        return scoringRules['generic-approval']?.[selectValue] ?? 0;
    }
    const rule = scoringRules[selectId];
    if (!rule) return 0;
    const scoreRule = rule[selectValue];
    if (typeof scoreRule === 'number') return scoreRule;
    if (typeof scoreRule === 'object' && scoreRule.type === 'dependent') {
        const dependentValue = document.getElementById(scoreRule.on)?.value;
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

    // MODIFISERT DEL: Oppdater summer og de nye målerne
    const grandTotal = totals.resources + totals.fleet + totals.operations + totals.approvals;
    
    document.getElementById('resources-gauge-value').textContent = totals.resources;
    if(gauges.resources) gauges.resources.set(totals.resources);
    
    document.getElementById('fleet-gauge-value').textContent = totals.fleet;
    if(gauges.fleet) gauges.fleet.set(totals.fleet);

    document.getElementById('operations-gauge-value').textContent = totals.operations;
    if(gauges.operations) gauges.operations.set(totals.operations);
    
    document.getElementById('approvals-gauge-value').textContent = totals.approvals;
    if(gauges.approvals) gauges.approvals.set(totals.approvals);

    document.getElementById('total-gauge-value').textContent = grandTotal;
    if(gauges.total) gauges.total.set(grandTotal);

    saveData();
}

// --- Funksjoner for CSV (UENDRET) ---
function downloadCSV() { /* ... din eksisterende CSV-logikk ... */ }
function loadCsvFile(event) { /* ... din eksisterende CSV-logikk ... */ }
function parseCsvField(field) { /* ... din eksisterende CSV-logikk ... */ }

// --- Funksjon for å bygge skjemaet dynamisk ---
function buildForm() {
    const table = document.getElementById('main-form-table');
    let currentSection = "";

    const addHeaderRow = (title) => {
        const headerRow = table.insertRow();
        const headerCell = headerRow.insertCell();
        headerCell.colSpan = 3;
        headerCell.innerHTML = `<h3>${title}</h3>`;
        headerCell.className = "section-header";
    };

    fieldData.forEach(field => {
        if (field.section !== currentSection) {
            currentSection = field.section;
            addHeaderRow(currentSection.charAt(0).toUpperCase() + currentSection.slice(1));
        }

        const row = table.insertRow();
        const labelCell = row.insertCell();
        const selectCell = row.insertCell();
        const valueCell = row.insertCell();

        labelCell.textContent = field.label;
        valueCell.id = field.id + '-value';
        valueCell.className = 'calculated-value bg-default-gray';
        valueCell.textContent = '0';

        let optionsHtml = '<option value="" disabled selected>Velg...</option>';
        const rule = scoringRules[field.id] || (field.section === 'approvals' ? scoringRules['generic-approval'] : {});
        for (const key in rule) {
            if(typeof rule[key] !== 'object' || rule[key].type !== 'dependent') {
                 optionsHtml += `<option value="${key}">${key.replace(/_/g, ' ')}</option>`;
            }
        }
        selectCell.innerHTML = `<select id="${field.id}">${optionsHtml}</select>`;
    });
}


// --- Initialisering ved side-lasting ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('data/scoring.json');
        scoringRules = await res.json();
    } catch (error) {
        console.error('Klarte ikke å laste inn scoring.json:', error);
        alert('FEIL: Kunne ikke laste inn datafil for poengberegning.');
        return;
    }
    
    buildForm();
    initializeGauges();

    document.getElementById('clear-form-button').addEventListener('click', clearForm);
    document.getElementById('download-csv-button').addEventListener('click', downloadCSV); // Sørg for at denne er definert
    document.getElementById('print-pdf-button').addEventListener('click', printPDF);
    document.getElementById('load-csv-button').addEventListener('click', () => document.getElementById('csv-file-input').click());
    document.getElementById('csv-file-input').addEventListener('change', loadCsvFile); // Sørg for at denne er definert

    document.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('change', updateCalculations);
        if (el.matches('input[type="text"], textarea')) {
            el.addEventListener('keyup', updateCalculations);
        }
    });

    loadData();
    if (!document.getElementById('date').value) {
        document.getElementById('date').valueAsDate = new Date();
    }
    updateCalculations();
});