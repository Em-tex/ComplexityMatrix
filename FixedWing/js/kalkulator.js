// --- Globale konstanter og variabler ---
const STORAGE_KEY = 'fixedWingComplexityData';
let scoringRules = {}; // Blir fylt inn fra data/scoring.json

// Max scores basert på Fixed Wing arket
const MAX_SCORE_RESOURCES = 5 + 10 + 1 + 2; // staff(5) + pilots(10) + cabin(1) + leading_personnel(2*) = 18. *Antatt maksverdi.
const MAX_SCORE_FLEET = 5 + 10 + 5 + 5; // types(5) + ac_over_40t(10) + ac_5.7_40t(5) + ac_under_5.7t(5) = 25
const MAX_SCORE_OPERATIONS = 5 + 10 + 2 + 5 + 2 + 5; // sectors(5) + type_op(10) + leasing(2) + airports(5) + group_airline(2) + cargo(5) = 29
const MAX_SCORE_APPROVERS = 1 * 14; // 14 x Ja/Nei = 14
const MAX_SCORE_GRAND_TOTAL = MAX_SCORE_RESOURCES + MAX_SCORE_FLEET + MAX_SCORE_OPERATIONS + MAX_SCORE_APPROVERS; // 18 + 25 + 29 + 14 = 86

const notAssessedState = {
    resources: false,
    fleet: false,
    operations: false,
    approvals: false
};

const fieldData = [
    // Resources (Blå del)
    { id: 'staff-employed', label: 'Total Number of staff employed for the operation', section: 'resources' },
    { id: 'pilots-employed', label: 'Number of pilots employed', section: 'resources' },
    { id: 'cabin-crew', label: 'Cabin crew carried', section: 'resources' },
    { id: 'leading-personnel-roles', label: 'Leading personell has several roles', section: 'resources' },

    // Fleet Specific (Grønn del)
    { id: 'types-operated', label: 'Number of types operated', section: 'fleet' },
    { id: 'aircraft-over-40t', label: 'Number of aircraft operated over 40000kg', section: 'fleet' },
    { id: 'aircraft-5.7-40t', label: 'Number of aircraft operated between 5700kg & 40000kg', section: 'fleet' },
    { id: 'aircraft-under-5.7t', label: 'Number of aircraft operated under 5700kg', section: 'fleet' },

    // Operations (Lilla del)
    { id: 'sectors-per-annum', label: 'Sectors per annum', section: 'operations' },
    { id: 'type-of-operation', label: 'Type of Operation', section: 'operations' },
    { id: 'aircraft-leasing', label: 'Aircraft leasing', section: 'operations' },
    { id: 'airports-based', label: 'Number of airports where aircraft and/or crews are permanently based', section: 'operations' },
    { id: 'group-airline', label: 'Group Airline', section: 'operations' },
    { id: 'cargo-carriage', label: 'Cargo Carriage', section: 'operations' },

    // Approvals (Mintblå seksjon)
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

    // Valider alle select-elementer med mindre seksjonen er "ikke vurdert"
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

    resourcesGaugeBlock.style.display = resourcesAssessed ? 'flex' : 'none';
    fleetGaugeBlock.style.display = fleetAssessed ? 'flex' : 'none';
    operationsGaugeBlock.style.display = operationsAssessed ? 'flex' : 'none';
    approvalsGaugeBlock.style.display = approvalsAssessed ? 'flex' : 'none';
    
    if (!resourcesAssessed && !fleetAssessed && !operationsAssessed && !approvalsAssessed) {
        totalSummaryBlock.classList.add('hidden');
    } else {
        totalSummaryBlock.classList.remove('hidden');
    }

    // Vis kun total-gauge hvis alle relevante seksjoner er vurdert
    if (resourcesAssessed && fleetAssessed && operationsAssessed && approvalsAssessed) {
        totalGaugeBlock.style.display = 'flex';
        grandTotalTextElement.classList.remove('hidden-total-text');
    } else {
        totalGaugeBlock.style.display = 'none';
        grandTotalTextElement.classList.add('hidden-total-text');
    }
}

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
    if (selectValue === "" || Object.keys(scoringRules).length === 0) return 0;

    // Felles logikk for alle enkle "Ja/Nei" godkjenninger
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
    } 
    // Håndterer spesialregelen for "Leading personell"
    else if (typeof scoreRule === 'object' && scoreRule.type === 'dependent') {
        const dependentValue = document.getElementById(scoreRule.on)?.value;
        if (!dependentValue) return scoreRule.default;
        
        return scoreRule.scores[dependentValue] ?? scoreRule.default;
    }

    return 0; // Fallback
}


function updateCalculations() {
    let totals = { resources: 0, fleet: 0, operations: 0, approvals: 0 };

    fieldData.forEach(field => {
        const select = document.getElementById(field.id);
        const valueCell = document.getElementById(field.id + '-value');
        
        if (select.value === "") {
            select.classList.add('placeholder-selected');
        } else {
            select.classList.remove('placeholder-selected');
        }

        if (select && valueCell) {
            let score = 0;
            if (!notAssessedState[field.section] && !select.disabled) {
                score = calculateFieldScore(field.id, select.value);
            }
            valueCell.textContent = score;
            applyValueCellStyle(valueCell, score, select.value === "" && !notAssessedState[field.section]);

            if (!notAssessedState[field.section]) {
                totals[field.section] += score;
            }
        }
    });

    // Oppdater summer og gauges for hver seksjon
    document.getElementById('resources-sum').textContent = totals.resources;
    document.getElementById('resources-gauge-value').textContent = totals.resources;
    updateGauge('resources', totals.resources, MAX_SCORE_RESOURCES);

    document.getElementById('fleet-sum').textContent = totals.fleet;
    document.getElementById('fleet-gauge-value').textContent = totals.fleet;
    updateGauge('fleet', totals.fleet, MAX_SCORE_FLEET);

    document.getElementById('operations-sum').textContent = totals.operations;
    document.getElementById('operations-gauge-value').textContent = totals.operations;
    updateGauge('operations', totals.operations, MAX_SCORE_OPERATIONS);

    document.getElementById('approvals-sum').textContent = totals.approvals;
    document.getElementById('approvals-gauge-value').textContent = totals.approvals;
    updateGauge('approvals', totals.approvals, MAX_SCORE_APPROVERS);

    // Beregn og vis totalsum
    const grandTotal = (!notAssessedState.resources && !notAssessedState.fleet && !notAssessedState.operations && !notAssessedState.approvals) 
        ? totals.resources + totals.fleet + totals.operations + totals.approvals 
        : 0;

    document.getElementById('grand-total-display').textContent = grandTotal;
    document.getElementById('total-gauge-sum-text').textContent = grandTotal;
    document.getElementById('total-gauge-value').textContent = grandTotal;
    updateGauge('total', grandTotal, MAX_SCORE_GRAND_TOTAL);
    
    updateGaugeAndTotalVisibility();
    saveData();
}

function updateGauge(prefix, value, maxValue) {
    const needle = document.getElementById(prefix + '-needle');
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    const rotation = (percentage * 1.8) - 90; // -90 for start, 1.8 for 180 grader
    if (needle) {
        needle.style.transform = `translateX(-50%) rotate(${Math.max(-90, Math.min(rotation, 90))}deg)`;
    }
}

function parseCsvField(field) {
    field = field.trim();
    if (field.startsWith('"') && field.endsWith('"')) {
        return field.substring(1, field.length - 1).replace(/""/g, '"');
    }
    return field;
}

// --- Funksjon for å laste ned og laste inn CSV data ---

function downloadCSV() {
    if (!validateForm()) return;

    const operatorNavn = document.getElementById('operator-navn').value || "UkjentOperatør";
    const dateValue = document.getElementById('date').value;
    const today = new Date();
    const formattedDate = dateValue ? `${dateValue.split('-')[2]}-${dateValue.split('-')[1]}-${dateValue.split('-')[0]}` : `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    const fileName = `${operatorNavn.replace(/\s/g, "_")}_${formattedDate}.csv`;

    const headers = ['Operatørnavn', 'Fylt ut av', 'Dato', 'Resources ikke vurdert', 'Fleet Specific ikke vurdert', 'Operations ikke vurdert', 'Approvals ikke vurdert'];
    fieldData.forEach(field => {
        headers.push(`${field.label} (Valg)`, `${field.label} (Verdi)`);
    });
    headers.push('Resources Sum', 'Fleet Specific Sum', 'Operations Sum', 'Approvals Sum', 'Totalsum', 'Kommentarer');

    const dataRow = [
        `"${operatorNavn.replace(/"/g, '""')}"`,
        `"${document.getElementById('filled-by').value.replace(/"/g, '""')}"`,
        `"${dateValue}"`,
        notAssessedState.resources ? "Ja" : "Nei",
        notAssessedState.fleet ? "Ja" : "Nei",
        notAssessedState.operations ? "Ja" : "Nei",
        notAssessedState.approvals ? "Ja" : "Nei"
    ];

    fieldData.forEach(field => {
        dataRow.push(`"${getSelectedText(field.id).replace(/"/g, '""')}"`, document.getElementById(field.id + '-value').textContent);
    });

    const resourcesSum = getNumericValue('resources-sum');
    const fleetSum = getNumericValue('fleet-sum');
    const operationsSum = getNumericValue('operations-sum');
    const approvalsSum = getNumericValue('approvals-sum');
    const grandTotalForCsv = (notAssessedState.resources || notAssessedState.fleet || notAssessedState.operations || notAssessedState.approvals) ? 0 : (resourcesSum + fleetSum + operationsSum + approvalsSum);
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
        if (lines.length < 2) {
            alert("CSV-filen er tom eller ugyldig.");
            return;
        }

        const headers = lines[0].split(';').map(h => parseCsvField(h));
        const data = lines[1].split(';').map(d => parseCsvField(d));
        const headerMap = Object.fromEntries(headers.map((header, index) => [header, index]));

        document.getElementById('operator-navn').value = data[headerMap['Operatørnavn']] || '';
        document.getElementById('filled-by').value = data[headerMap['Fylt ut av']] || '';
        document.getElementById('date').value = data[headerMap['Dato']] || '';

        ['resources', 'fleet', 'operations', 'approvals'].forEach(section => {
            const headerName = `${section.charAt(0).toUpperCase() + section.slice(1).replace('fleet', 'Fleet Specific')} ikke vurdert`;
            const isNotAssessed = data[headerMap[headerName]] === 'Ja';
            document.getElementById(`${section}-not-assessed`).checked = isNotAssessed;
            toggleNotAssessed(section, true);
        });

        fieldData.forEach(field => {
            const selectElement = document.getElementById(field.id);
            if (selectElement) {
                const valueToSet = data[headerMap[`${field.label} (Valg)`]];
                if (valueToSet !== undefined) {
                    const optionExists = [...selectElement.options].some(opt => opt.text === valueToSet);
                    selectElement.value = optionExists ? [...selectElement.options].find(opt => opt.text === valueToSet).value : "";
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
    // 1. Last inn poengreglene FØRST
    try {
        const response = await fetch('data/scoring.json');
        scoringRules = await response.json();
    } catch (error) {
        console.error('Klarte ikke å laste scoring.json:', error);
        alert('FEIL: Kunne ikke laste poengreglene. Kalkulatoren vil ikke fungere.');
        return; // Stopp videre kjøring
    }

    // 2. Last inn operatører
    try {
        const response = await fetch('data/operators.json');
        const operators = await response.json();
        const datalist = document.getElementById('operator-list');
        operators.forEach(op => {
            const option = document.createElement('option');
            option.value = op;
            datalist.appendChild(option);
        });
    } catch (error) {
        console.error('Klarte ikke å laste operators.json:', error);
    }
        
    // 3. Feste hendelseslyttere
    document.getElementById('clear-form-button').addEventListener('click', clearForm);
    document.getElementById('download-csv-button').addEventListener('click', downloadCSV);
    document.getElementById('print-pdf-button').addEventListener('click', printPDF);
    document.getElementById('load-csv-button').addEventListener('click', () => document.getElementById('csv-file-input').click());
    document.getElementById('csv-file-input').addEventListener('change', loadCsvFile);

    // 4. Sett opp lyttere for skjema
    document.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('change', updateCalculations);
        if (el.matches('input[type="text"], textarea')) {
            el.addEventListener('keyup', updateCalculations);
        }
        el.addEventListener('input', () => {
            if (el.value.trim() !== '') el.classList.remove('invalid');
        });
    });

    // 5. Initialiser data og UI
    loadData();
    if (!document.getElementById('date').value) {
        document.getElementById('date').valueAsDate = new Date();
    }
    
    // Initialiser "Ikke vurdert"-status fra checkbox
    ['resources', 'fleet', 'operations', 'approvals'].forEach(section => {
        if (document.getElementById(`${section}-not-assessed`).checked) {
            toggleNotAssessed(section, true);
        }
    });

    // Utfør første beregning
    updateCalculations(); 
});