document.addEventListener('DOMContentLoaded', async () => {
    // --- Globale konstanter og variabler ---
    const STORAGE_KEY = 'uasComplexityData';
    let scoringRules = {};

    const MAX_SCORES = {
        resources: 17, 
        fleet: 11, 
        operations: 25,
        performance: 36, 
        total: 89
    };

    const fieldData = [
        // Resources
        { id: 'antall-baser', label: 'Antall baser', section: 'resources' },
        { id: 'antall-piloter', label: 'Antall piloter', section: 'resources' },
        { id: 'ansvarsfordeling', label: 'Ansvarsfordeling', section: 'resources' },
        { id: 'krav-eksamen', label: 'Krav til eksamen', section: 'resources' },
        { id: 'kjopt-om', label: 'Kjøpt OM?', section: 'resources' },
        { id: 'sms-org', label: 'SMS (Organisasjon)', section: 'resources' },
        // Fleet
        { id: 'fartoyvekt', label: 'Fartøyvekt', section: 'fleet' },
        { id: 'c2link', label: 'C2 link', section: 'fleet' },
        { id: 'eksternt-vedlikehold', label: 'Eksternt vedlikehold', section: 'fleet' },
        // Operations
        { id: 'synsvidde', label: 'Synsvidde', section: 'operations' },
        { id: 'flyhoyde', label: 'Flyhøyde', section: 'operations' },
        { id: 'operasjonsmiljo', label: 'Operasjonsmiljø', section: 'operations' },
        { id: 'redusert-grc', label: 'Redusert GRC', section: 'operations' },
        { id: 'omrade', label: 'Område', section: 'operations' },
        { id: 'sail', label: 'SAIL', section: 'operations' },
        { id: 'annen-risiko', label: 'Annen økt risiko', section: 'operations' },
        // Performance
        { id: 'flytimer', label: 'Flytimer i året', section: 'performance' },
        { id: 'bekymringsmeldinger', label: 'Bekymringsmeldinger', section: 'performance' },
        { id: 'veiledningsbehov', label: 'Veiledningsbehov', section: 'performance' },
        { id: 'niva1-avvik', label: 'Direkte nivå 1 avvik', section: 'performance' },
        { id: 'niva2-avvik', label: 'Antall nivå 2 avvik', section: 'performance' },
        { id: 'frist-lukking', label: 'Frist for lukking', section: 'performance' },
        { id: 'sms-tilsyn', label: 'SMS (Tilsyn)', section: 'performance' },
        { id: 'siste-kontakt', label: 'Tid siden siste kontakt/revisjon', section: 'performance' },
        { id: 'empic-data', label: 'Manglende data i EMPIC', section: 'performance' },
        { id: 'oat-mangler', label: 'Mangler i OAT', section: 'performance' }
    ];

    // --- Kjernefunksjoner ---
    function calculateFieldScore(fieldId, selectValue, currentScores) {
        if (!scoringRules[fieldId] || !selectValue) return 0;
        
        const rule = scoringRules[fieldId][selectValue];
        if (typeof rule === 'object' && rule.type === 'custom-dependent') {
            const baseScore = currentScores[rule.on[0]] || 0;
            const pilotScore = currentScores[rule.on[1]] || 0;
            return Math.round(rule.baseValue + (baseScore + pilotScore) / 2);
        }
        return rule ?? 0;
    }

    function applyValueCellStyle(valueCell, score) {
        valueCell.className = 'form-cell calculated-value';
        if (score >= 4) valueCell.classList.add('bg-weak-red');
        else if (score >= 2) valueCell.classList.add('bg-weak-yellow');
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
        let totals = { resources: 0, fleet: 0, operations: 0, performance: 0 };
        let currentScores = {};

        // First pass: calculate all non-dependent scores
        fieldData.forEach(field => {
            const select = document.getElementById(field.id);
            if (select) {
                const rule = scoringRules[field.id]?.[select.value];
                if (typeof rule !== 'object') {
                    const score = calculateFieldScore(field.id, select.value, {});
                    currentScores[field.id] = score;
                }
            }
        });

        // Second pass: calculate all scores, including dependent ones
        fieldData.forEach(field => {
            const select = document.getElementById(field.id);
            const valueCell = document.getElementById(field.id + '-value');
            if (select && valueCell) {
                const score = calculateFieldScore(field.id, select.value, currentScores);
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
        if (!operatorNavnInput.value.trim()) {
            errors.push("Operatørnavn må fylles ut.");
            operatorNavnInput.classList.add('invalid');
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
        if (!validateForm()) { return; }
        const operatorNavn = document.getElementById('operator-navn').value || "UkjentOperatør";
        const dateValue = document.getElementById('date').value || new Date().toISOString().slice(0, 10);
        const fileName = `${operatorNavn.replace(/ /g, "_")}_${dateValue}.csv`;

        const primaryHeaders = ['Operatørnavn', 'Fylt ut av', 'Dato', 'Resources Sum', 'Fleet Specific Sum', 'Operations Sum', 'Performance Sum', 'Totalsum', 'Kommentarer'];
        const detailHeaders = fieldData.map(field => [`${field.label} (Valg)`, `${field.label} (Verdi)`]).flat();
        const allHeaders = primaryHeaders.concat(detailHeaders);

        const comments = `"${document.getElementById('comments').value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        const primaryData = [
            `"${operatorNavn.replace(/"/g, '""')}"`,
            `"${document.getElementById('filled-by').value.replace(/"/g, '""')}"`,
            `"${dateValue}"`,
            document.getElementById('resources-sum').textContent,
            document.getElementById('fleet-sum').textContent,
            document.getElementById('operations-sum').textContent,
            document.getElementById('performance-sum').textContent,
            document.getElementById('total-gauge-sum-text').textContent,
            comments
        ];
        const detailData = fieldData.map(field => {
            const selectedText = getSelectedText(field.id);
            const score = document.getElementById(field.id + '-value').textContent;
            return [`"${selectedText.replace(/"/g, '""')}"`, score];
        }).flat();
        
        const allData = primaryData.concat(detailData);
        const csvContent = allHeaders.join(';') + '\r\n' + allData.join(';');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
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

            document.getElementById('comments').value = data[headerMap['Kommentarer']] || '';
            
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
        
        document.querySelectorAll('input, select, textarea').forEach(el => {
            el.addEventListener('change', updateCalculations);
            if (el.matches('input[type="text"], textarea')) {
                el.addEventListener('keyup', saveData);
            }
            el.addEventListener('input', () => el.classList.remove('invalid'));
        });
        
        document.getElementById('clear-form-button').addEventListener('click', clearForm);
        document.getElementById('download-csv-button').addEventListener('click', downloadCSV);
        document.getElementById('print-pdf-button').addEventListener('click', printPDF);
        
        const loadCsvButton = document.getElementById('load-csv-button');
        const csvFileInput = document.getElementById('csv-file-input');
        loadCsvButton.addEventListener('click', () => csvFileInput.click());
        csvFileInput.addEventListener('change', loadCsvFile);

        loadData();
        if (!document.getElementById('date').value) {
            document.getElementById('date').valueAsDate = new Date();
        }

        updateCalculations();
    }

    init();
});