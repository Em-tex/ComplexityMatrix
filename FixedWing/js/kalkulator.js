document.addEventListener('DOMContentLoaded', async () => {
    // --- Globale konstanter og variabler ---
    const STORAGE_KEY = 'fixedWingComplexityData';
    let scoringRules = {};

    const MAX_SCORES = {
        resources: 22, 
        fleet: 20, 
        operations: 38,
        approvals: 15, 
        total: 95
    };

    const fieldData = [
        // Resources
        { id: 'staff-employed', label: 'Total Number of staff employed for the operation', section: 'resources' },
        { id: 'pilots-employed', label: 'Number of pilots employed', section: 'resources' },
        { id: 'cabin-crew', label: 'Cabin crew carried', section: 'resources' },
        { id: 'leading-personnel-roles', label: 'Leading personell has several roles', section: 'resources' },
        // Fleet
        { id: 'types-operated', label: 'Number of types operated', section: 'fleet' },
        { id: 'aircraft-mops-over-19', label: 'Number of aircraft with MOPSC of MORE than 19 seats', section: 'fleet' },
        { id: 'aircraft-mops-under-19', label: 'Number of aircraft with MOPSC of 19 seats or LESS', section: 'fleet' },
        { id: 'special-modification', label: 'Aircraft with Special Modification', section: 'fleet' },
        // Operations
        { id: 'type-of-operation', label: 'Type of Operation', section: 'operations' },
        { id: 'special-operation', label: 'Number of special Operation (NOT SPA)', section: 'operations' },
        { id: 'derogations', label: 'Number of derogations', section: 'operations' },
        { id: 'airports-based', label: 'Number of airports where aircraft and/or crews are permanently based', section: 'operations' },
        { id: 'group-airline', label: 'Group Airline', section: 'operations' },
        { id: 'subcontractors', label: 'Number of Subcontractors', section: 'operations' },
        { id: 'acmi', label: 'ACMI', section: 'operations' },
        { id: 'spo', label: 'SPO', section: 'operations' },
        // Approvals
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
        { id: 'ato', label: 'ATO', section: 'approvals' }
    ];

    // --- Kjernefunksjoner ---
    function calculateFieldScore(fieldId, selectValue, pilotsValue) {
        const fieldInfo = fieldData.find(f => f.id === fieldId);
        if (!fieldInfo) return 0;
        
        // Specific logic for approvals that are not "generic"
        if (fieldId === 'atqp') {
            return scoringRules['atqp']?.[selectValue] ?? 0;
        }

        // Generic logic for most approvals
        if (fieldInfo.section === 'approvals') {
            return scoringRules['generic-approval']?.[selectValue] ?? 0;
        }

        // Logic for other sections
        if (!scoringRules[fieldId] || !selectValue) return 0;
        
        const rule = scoringRules[fieldId][selectValue];
        if (typeof rule === 'object' && rule.type === 'dependent') {
            return rule.scores[pilotsValue] ?? rule.default;
        }
        return rule ?? 0;
    }

    function applyValueCellStyle(valueCell, score) {
        valueCell.className = 'form-cell calculated-value';
        if (score >= 5) valueCell.classList.add('bg-weak-red');
        else if (score >= 3) valueCell.classList.add('bg-weak-yellow');
        else if (score > 0) valueCell.classList.add('bg-weak-green');
        else valueCell.classList.add('bg-default-gray');
    }

    function updateGauge(prefix, value, maxValue) {
        const needle = document.getElementById(prefix + '-needle');
        if (!needle) return;
        const percentage = maxValue > 0 ? value / maxValue : 0;
        const rotation = -90 + (percentage * 180);
        needle.style.transform = `translateX(-50%) rotate(${Math.min(90, Math.max(-90, rotation))}deg)`;
    }

    function updateCalculations() {
        let totals = { resources: 0, fleet: 0, operations: 0, approvals: 0 };
        const pilotsValue = document.getElementById('pilots-employed').value;

        fieldData.forEach(field => {
            const select = document.getElementById(field.id);
            const valueCell = document.getElementById(field.id + '-value');
            if (select && valueCell) {
                const score = calculateFieldScore(field.id, select.value, pilotsValue);
                valueCell.textContent = score;
                applyValueCellStyle(valueCell, score);
                totals[field.section] += score;
            }
        });

        let grandTotal = 0;
        for (const section in totals) {
            document.getElementById(`${section}-sum`).textContent = totals[section];
            updateGauge(section, totals[section], MAX_SCORES[section]);
            grandTotal += totals[section];
        }
        
        document.getElementById('total-gauge-sum-text').textContent = grandTotal;
        updateGauge('total', grandTotal, MAX_SCORES.total);

        saveData();
    }

    // --- Funksjoner for lagring, lasting, knapper etc. ---
    function saveData() {
        const dataToSave = {};
        document.querySelectorAll('input[type="text"], input[type="date"], select, textarea').forEach(el => {
            if (el.id) dataToSave[el.id] = el.value;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }

    function loadData() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const data = JSON.parse(savedData);
            for (const id in data) {
                const el = document.getElementById(id);
                if (el) el.value = data[id];
            }
        }
    }
    
    function clearForm() {
        if (confirm("Er du sikker på at du vil tømme skjemaet? All lagret data vil bli slettet.")) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        }
    }

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

    function getSelectedText(selectId) {
        const selectElement = document.getElementById(selectId);
        if (selectElement && selectElement.selectedIndex >= 0 && selectElement.options[selectElement.selectedIndex]) {
            return selectElement.options[selectElement.selectedIndex].text;
        }
        return "";
    }

    function downloadCSV() {
        if (!validateForm()) {
            return;
        }
        const operatorNavn = document.getElementById('operator-navn').value || "UkjentOperatør";
        const dateValue = document.getElementById('date').value || new Date().toISOString().slice(0, 10);
        const fileName = `${operatorNavn.replace(/ /g, "_")}_${dateValue}.csv`;

        const primaryHeaders = [
            'Operatørnavn', 'Fylt ut av', 'Dato',
            'Resources Sum', 'Fleet Specific Sum', 'Operations Sum', 'Approvals Sum', 'Totalsum',
            'Complexity Rating',
            'Kommentarer'
        ];
        const detailHeaders = [];
        fieldData.forEach(field => {
            detailHeaders.push(`${field.label} (Valg)`);
            detailHeaders.push(`${field.label} (Verdi)`);
        });
        const allHeaders = primaryHeaders.concat(detailHeaders);

        const comments = `"${document.getElementById('comments').value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        const primaryData = [
            `"${operatorNavn.replace(/"/g, '""')}"`,
            `"${document.getElementById('filled-by').value.replace(/"/g, '""')}"`,
            `"${dateValue}"`,
            document.getElementById('resources-sum').textContent,
            document.getElementById('fleet-sum').textContent,
            document.getElementById('operations-sum').textContent,
            document.getElementById('approvals-sum').textContent,
            document.getElementById('total-gauge-sum-text').textContent,
            "", // Tom verdi for Complexity Rating
            comments
        ];
        const detailData = [];
        fieldData.forEach(field => {
            const selectedText = getSelectedText(field.id);
            const score = document.getElementById(field.id + '-value').textContent;
            detailData.push(`"${selectedText.replace(/"/g, '""')}"`);
            detailData.push(score);
        });
        const allData = primaryData.concat(detailData);

        const csvContent = allHeaders.join(';') + '\r\n' + allData.join(';');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function parseCsvField(field) {
        field = field ? field.trim() : '';
        if (field.startsWith('"') && field.endsWith('"')) {
            field = field.substring(1, field.length - 1).replace(/""/g, '"');
        }
        return field;
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
            const headerMap = Object.fromEntries(headers.map((h, i) => [h, i]));

            document.getElementById('operator-navn').value = data[headerMap['Operatørnavn']] || '';
            document.getElementById('filled-by').value = data[headerMap['Fylt ut av']] || '';
            document.getElementById('date').value = data[headerMap['Dato']] || '';
            
            fieldData.forEach(field => {
                const select = document.getElementById(field.id);
                if (select) {
                    const choiceHeader = `${field.label} (Valg)`;
                    const choiceIndex = headerMap[choiceHeader];
                    if (choiceIndex !== undefined && data[choiceIndex] !== undefined) {
                        const valueToFind = data[choiceIndex];
                        const option = Array.from(select.options).find(opt => opt.text === valueToFind);
                        select.value = option ? option.value : "";
                    }
                }
            });

            const commentsIndex = headerMap['Kommentarer'];
            if (commentsIndex !== undefined) {
                document.getElementById('comments').value = data[commentsIndex] || '';
            }
            
            updateCalculations();
            alert("CSV-fil lastet inn!");
        };
        reader.readAsText(file);
    }

    // --- Initialisering ---
    async function init() {
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
            alert('FEIL: Kunne ikke laste inn datafiler (scoring/operators). Siden kan ikke fungere.');
            return;
        }

        Object.keys(MAX_SCORES).forEach(key => {
            const sumEl = document.getElementById(`${key}-max-sum`);
            const gaugeEl = document.getElementById(`${key}-gauge-max-text`);
            if (sumEl) sumEl.textContent = MAX_SCORES[key];
            if (gaugeEl) gaugeEl.textContent = MAX_SCORES[key];
        });
        
        document.querySelectorAll('input[type="text"], input[type="date"], select, textarea').forEach(el => {
            el.addEventListener('change', updateCalculations);
            if (el.matches('input[type="text"], textarea')) {
                el.addEventListener('keyup', saveData);
            }
        });
        
        document.getElementById('clear-form-button').addEventListener('click', clearForm);
        document.getElementById('download-csv-button').addEventListener('click', downloadCSV);
        document.getElementById('print-pdf-button').addEventListener('click', printPDF);
        
        const loadCsvButton = document.getElementById('load-csv-button');
        const csvFileInput = document.getElementById('csv-file-input');
        loadCsvButton.addEventListener('click', () => csvFileInput.click());
        csvFileInput.addEventListener('change', loadCsvFile);

        document.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('input', () => el.classList.remove('invalid'));
            el.addEventListener('change', () => el.classList.remove('invalid'));
        });

        loadData();
        if (!document.getElementById('date').value) {
            document.getElementById('date').valueAsDate = new Date();
        }

        updateCalculations();
    }

    init();
});