document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'rotorComplexityData';
    let scoringRules = {};

    const MAX_SCORES = {
        resources: 16,
        fleet: 17,
        operations: 56,
        approvals: 14,
        total: 103
    };

    const fieldData = [
        { id: 'staff-employed', label: 'Total Number of staff employed for the operation', section: 'resources' },
        { id: 'pilots-employed', label: 'Number of pilots employed', section: 'resources' },
        { id: 'leading-personnel-roles', label: 'Leading personel has several roles', section: 'resources' },
        { id: 'types-operated', label: 'Number of types operated', section: 'fleet' },
        { id: 'aircraft-mops-over-9', label: 'Number of aircraft with MOPSC of MORE than 9 seats', section: 'fleet' },
        { id: 'aircraft-mops-under-9', label: 'Number of aircraft with MOPSC of 9 seats or LESS', section: 'fleet' },
        { id: 'special-modification', label: 'Aircraft with Special Modification', section: 'fleet' },
        { id: 'operation-types', label: 'Number of Operation types', section: 'operations' },
        { id: 'operation-complexity', label: 'Operation Complexity', section: 'operations' },
        { id: 'special-operation', label: 'Number of special Operation (NOT SPA)', section: 'operations' },
        { id: 'derogations', label: 'Number of derogations', section: 'operations' },
        { id: 'airports-based', label: 'Number of airports where aircraft and/or crews are permanently based', section: 'operations' },
        { id: 'subcontractors', label: 'Number of Subcontractors', section: 'operations' },
        { id: 'acmi', label: 'ACMI', section: 'operations' },
        { id: 'certificate', label: 'Certificate', section: 'operations' },
        { id: 'nvis', label: 'NVIS', section: 'approvals' },
        { id: 'hho', label: 'HHO', section: 'approvals' },
        { id: 'hems', label: 'HEMS', section: 'approvals' },
        { id: 'lv-takeoff', label: 'Low Visibility operations (TAKEOFF)', section: 'approvals' },
        { id: 'dangerous-goods', label: 'Dangerous Goods', section: 'approvals' },
        { id: 'efb', label: 'Electronic Flight Bag', section: 'approvals' },
        { id: 'frms', label: 'FRMS', section: 'approvals' },
        { id: 'crew-training', label: 'Crew Training', section: 'approvals' }
    ];

    // --- START: SIKRET OPERATØR-LOGIKK ---
    async function initOperatorField() {
        try {
            const response = await fetch('data/operators.json');
            const data = await response.json();
            const select = document.getElementById('operator-select');
            if (select) {
                select.innerHTML = '<option value="">Velg operatør...</option>'; 
                data.forEach(op => {
                    const option = document.createElement('option');
                    option.value = op;
                    option.textContent = op;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading operators:', error);
        }

        const opSelect = document.getElementById('operator-select');
        const opInput = document.getElementById('operator-navn');
        const toggleBtn = document.getElementById('toggle-manual-btn');

        if (!opSelect || !opInput || !toggleBtn) return;

        opSelect.addEventListener('change', (e) => {
            opInput.value = e.target.value;
            opInput.dispatchEvent(new Event('change'));
            saveData();
        });

        toggleBtn.addEventListener('click', () => {
            if (opSelect.style.display !== 'none') {
                const confirmManual = confirm("Vennligst sjekk listen nøye først.\n\nEr du sikker på at operatøren ikke finnes? Manuell inntasting skal KUN brukes hvis operatøren mangler i listen.");
                if (confirmManual) {
                    opSelect.style.display = 'none';
                    opSelect.value = ''; 
                    opInput.style.display = 'block';
                    opInput.value = ''; 
                    toggleBtn.innerHTML = '<i class="fa-solid fa-list"></i>';
                    toggleBtn.title = "Tilbake til liste";
                    toggleBtn.style.backgroundColor = '#03477F';
                    opInput.focus();
                }
            } else {
                opInput.style.display = 'none';
                opSelect.style.display = 'block';
                opInput.value = opSelect.value;
                toggleBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                toggleBtn.title = "Skriv inn manuelt";
                toggleBtn.style.backgroundColor = '#6c757d';
                saveData();
            }
        });
    }

    window.syncOperatorUI = function() {
        const opSelect = document.getElementById('operator-select');
        const opInput = document.getElementById('operator-navn');
        const toggleBtn = document.getElementById('toggle-manual-btn');

        if (opSelect && opInput && opInput.value) {
            const optionExists = Array.from(opSelect.options).some(opt => opt.value === opInput.value);
            if (optionExists) {
                opSelect.value = opInput.value;
                opSelect.style.display = 'block';
                opInput.style.display = 'none';
                toggleBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                toggleBtn.style.backgroundColor = '#6c757d';
            } else {
                opSelect.style.display = 'none';
                opInput.style.display = 'block';
                toggleBtn.innerHTML = '<i class="fa-solid fa-list"></i>';
                toggleBtn.style.backgroundColor = '#03477F';
            }
        }
    };
    // --- SLUTT: SIKRET OPERATØR-LOGIKK ---

    function calculateFieldScore(fieldId, selectValue, pilotsValue) {
        const fieldInfo = fieldData.find(f => f.id === fieldId);
        if (!fieldInfo) return 0;

        if (fieldId === 'crew-training' || fieldId === 'frms') {
            return scoringRules[fieldId]?.[selectValue] ?? scoringRules['generic-approval']?.[selectValue] ?? 0;
        }

        if (fieldInfo.section === 'approvals') {
            return scoringRules['generic-approval']?.[selectValue] ?? 0;
        }

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

    function saveData() {
        const dataToSave = {};
        document.querySelectorAll('input[type="text"], input[type="date"], select, textarea').forEach(el => {
            if (el.id && el.id !== 'operator-select') dataToSave[el.id] = el.value;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }

    function loadData() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const data = JSON.parse(savedData);
            for (const id in data) {
                const el = document.getElementById(id);
                if (el && id !== 'operator-select') el.value = data[id];
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
        if (!validateForm()) { return; }
        const operatorNavn = document.getElementById('operator-navn').value || "UkjentOperatør";
        const dateValue = document.getElementById('date').value || new Date().toISOString().slice(0, 10);
        
        const fileName = `${operatorNavn.replace(/ /g, "_")}_${dateValue}.dat`;

        const primaryHeaders = ['Operatørnavn', 'Fylt ut av', 'Dato', 'Resources Sum', 'Fleet Specific Sum', 'Operations Sum', 'Approvals Sum', 'Totalsum', 'Kommentarer'];
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
            document.getElementById('approvals-sum').textContent,
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
        
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'application/octet-stream' });
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
                alert("Filen er tom eller ugyldig.");
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

            window.syncOperatorUI();
            updateCalculations();
            alert("Data lastet inn!");
        };
        reader.readAsText(file, "UTF-8");
    }

    async function init() {
        await initOperatorField();

        try {
            const scoringRes = await fetch('data/scoring.json');
            scoringRules = await scoringRes.json();
        } catch (error) {
            console.error('Klarte ikke å laste inn nødvendige datafiler:', error);
            alert('FEIL: Kunne ikke laste inn datafiler. Siden kan ikke fungere.');
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

        const dropZone = document.body;
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover-active'), false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover-active'), false);
        });

        dropZone.addEventListener('drop', handleDrop, false);

        function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

        function handleDrop(e) {
            let dt = e.dataTransfer;
            let files = dt.files;
            if (files.length > 0) {
                const fileName = files[0].name.toLowerCase();
                if (fileName.endsWith('.csv') || fileName.endsWith('.txt') || fileName.endsWith('.dat')) {
                    const simulatedEvent = { target: { files: files } };
                    loadCsvFile(simulatedEvent); 
                } else {
                    alert("Vennligst slipp kun .dat eller .csv filer.");
                }
            }
        }

        loadData();
        window.syncOperatorUI();
        
        if (!document.getElementById('date').value) {
            document.getElementById('date').valueAsDate = new Date();
        }

        updateCalculations();
    }

    init();
});