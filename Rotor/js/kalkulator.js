document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'rotorComplexityData';
    const t = (k) => (window.I18n ? window.I18n.t(k) : k);
    let scoringRules = {};

    // Maks-poeng pr. seksjon (fra det rotor-spesifikke designet som matcher
    // data/scoring.json – poenglogikken er FASIT).
    const MAX_SCORES = {
        resources: 16,
        fleet: 41,
        operations: 60,
        approvals: 19,
        total: 136
    };

    // Tilsynspakke-grupper bestemmes av totalscoren. Terskler (min-poeng) = FASIT,
    // sortert fra høyest til lavest: Gruppe 1 (>=60) er mest kompleks, Gruppe 5
    // (>=10) minst. Under 10 poeng gir ingen pakke. Hver gruppe lenker til sin PDF.
    const TILSYNSPAKKE = [
        { group: 1, min: 60, url: 'https://caano.sharepoint.com/:b:/r/teams/Oversightproduction/Delte%20dokumenter/General/Nytt%20tilsynssystem%202025/Tilsynsgrunnpakker/RW%20Tilsynspakker/RW%20Tilsynspakke%20Gruppe%201.pdf?csf=1&web=1&e=ClmBe0' },
        { group: 2, min: 50, url: 'https://caano.sharepoint.com/:b:/r/teams/Oversightproduction/Delte%20dokumenter/General/Nytt%20tilsynssystem%202025/Tilsynsgrunnpakker/RW%20Tilsynspakker/RW%20Tilsynspakke%20Gruppe%202.pdf?csf=1&web=1&e=xOTY36' },
        { group: 3, min: 41, url: 'https://caano.sharepoint.com/:b:/r/teams/Oversightproduction/Delte%20dokumenter/General/Nytt%20tilsynssystem%202025/Tilsynsgrunnpakker/RW%20Tilsynspakker/RW%20Tilsynspakke%20Gruppe%203.pdf?csf=1&web=1&e=ISyyTo' },
        { group: 4, min: 27, url: 'https://caano.sharepoint.com/:b:/r/teams/Oversightproduction/Delte%20dokumenter/General/Nytt%20tilsynssystem%202025/Tilsynsgrunnpakker/RW%20Tilsynspakker/RW%20Tilsynspakke%20Gruppe%204.pdf?csf=1&web=1&e=cXzUHy' },
        { group: 5, min: 10, url: 'https://caano.sharepoint.com/:b:/r/teams/Oversightproduction/Delte%20dokumenter/General/Nytt%20tilsynssystem%202025/Tilsynsgrunnpakker/RW%20Tilsynspakker/RW%20Tilsynspakke%20Gruppe%205.pdf?csf=1&web=1&e=Wgwz5Q' }
    ];

    function groupForTotal(total) {
        const match = TILSYNSPAKKE.find(item => total >= item.min);
        return match ? match.group : null;
    }

    // Poengintervall for en gruppe: nedre = min, øvre = (forrige gruppes min - 1),
    // eller totalmaks for den øverste gruppen.
    function rangeText(idx) {
        const item = TILSYNSPAKKE[idx];
        const upper = idx === 0 ? MAX_SCORES.total : TILSYNSPAKKE[idx - 1].min - 1;
        return `${item.min}–${upper}`;
    }

    function buildTilsynspakkeLegend() {
        const container = document.getElementById('tilsynspakke-groups');
        if (!container) return;
        container.innerHTML = '';
        // Vises med økende poeng: Gruppe 5 (lavest) først, Gruppe 1 (høyest) sist.
        [...TILSYNSPAKKE].reverse().forEach((item) => {
            const idx = TILSYNSPAKKE.indexOf(item);
            const chip = document.createElement('a');
            chip.className = 'tp-chip group-' + item.group;
            chip.id = 'tp-chip-' + item.group;
            chip.href = item.url;
            chip.target = '_blank';
            chip.rel = 'noopener';
            chip.innerHTML =
                `<span class="tp-group">${t('rotor.group')} ${item.group}</span>` +
                `<span class="tp-range">${rangeText(idx)}</span>`;
            container.appendChild(chip);
        });
    }

    let lastTotal = 0;

    function updateTilsynspakke(total) {
        lastTotal = total;
        const container = document.getElementById('tilsynspakke-groups');
        if (!container) return;
        if (!container.children.length) buildTilsynspakkeLegend();
        const group = groupForTotal(total);
        TILSYNSPAKKE.forEach(item => {
            const chip = document.getElementById('tp-chip-' + item.group);
            if (chip) chip.classList.toggle('active', item.group === group);
        });
    }

    // Feltene speiler scoring.json. fieldData.label holdes ALLTID engelsk (CSV-fasit).
    const fieldData = [
        // Resources
        { id: 'staff-employed', label: 'Number of staff employed for the operation', section: 'resources' },
        { id: 'pilots-employed', label: 'Number of pilots employed', section: 'resources' },
        { id: 'technical-crew', label: 'Technical Crew Carried', section: 'resources' },
        { id: 'leading-personnel-roles', label: 'Leading personnel has several roles', section: 'resources' },
        // Fleet
        { id: 'types-operated', label: 'Number of types operated', section: 'fleet' },
        { id: 'multi-engine-offshore', label: 'Number of Multi-engined helicopters operating offshore', section: 'fleet' },
        { id: 'multi-engine-onshore', label: 'Number of Multi-engined helicopters operating onshore', section: 'fleet' },
        { id: 'single-engine-helicopters', label: 'Number of single engine helicopters operated', section: 'fleet' },
        { id: 'ac-leasing', label: 'A/C Leasing', section: 'fleet' },
        { id: 'special-modification', label: 'Helicopters with special modification', section: 'fleet' },
        // Operations
        { id: 'number-operation-types', label: 'Number of Operation types', section: 'operations' },
        { id: 'operation-complexity', label: 'Operation Complexity', section: 'operations' },
        { id: 'bases-permanently', label: 'Number of bases where aircraft and/or crews are permanently based', section: 'operations' },
        { id: 'subcontractors', label: 'Number of Subcontractors', section: 'operations' },
        { id: 'ifr-imc-operation', label: 'IFR/VFR operation', section: 'operations' },
        { id: 'single-pilot', label: 'Singlepilot operation', section: 'operations' },
        { id: 'certificate', label: 'Certificate', section: 'operations' },
        { id: 'hr-spo', label: 'HR SPO', section: 'operations' },
        { id: 'group-airline', label: 'Group Airline', section: 'operations' },
        { id: 'derogations', label: 'Number of derogations', section: 'operations' },
        // Approvals
        { id: 'rnp-03', label: 'RNP 0.3', section: 'approvals' },
        { id: 'lv-takeoff', label: 'Low Visibility operations (TAKEOFF)', section: 'approvals' },
        { id: 'lv-landing', label: 'Low Visibility Operations (LANDING)', section: 'approvals' },
        { id: 'dangerous-goods', label: 'Dangerous Goods', section: 'approvals' },
        { id: 'cat-pol-h-305', label: 'CAT.POL.H.305', section: 'approvals' },
        { id: 'nvis', label: 'NVIS', section: 'approvals' },
        { id: 'hho', label: 'HHO', section: 'approvals' },
        { id: 'hems', label: 'HEMS', section: 'approvals' },
        { id: 'hofo', label: 'HOFO', section: 'approvals' },
        { id: 'sar', label: 'SAR', section: 'approvals' },
        { id: 'police-operations', label: 'Police operations', section: 'approvals' },
        { id: 'efb-approval', label: 'EFB Approval', section: 'approvals' },
        { id: 'frms', label: 'FRMS', section: 'approvals' },
        { id: 'ato', label: 'ATO', section: 'approvals' }
    ];

    // id -> i18n-nøkkel for kriterieteksten. fieldData.label holdes ALLTID
    // engelsk (CSV-kolonner); denne brukes kun til oversatte brukermeldinger.
    const labelKeys = {
        'staff-employed': 'rotor.staffEmployed', 'pilots-employed': 'rotor.pilotsEmployed',
        'technical-crew': 'rotor.technicalCrew', 'leading-personnel-roles': 'rotor.leadingRoles',
        'types-operated': 'rotor.typesOperated', 'multi-engine-offshore': 'rotor.multiOffshore',
        'multi-engine-onshore': 'rotor.multiOnshore', 'single-engine-helicopters': 'rotor.singleEngine',
        'ac-leasing': 'rotor.acLeasing', 'special-modification': 'rotor.specialMod',
        'number-operation-types': 'rotor.numberOperationTypes', 'operation-complexity': 'rotor.operationComplexity',
        'bases-permanently': 'rotor.basesPermanently', 'subcontractors': 'rotor.subcontractors',
        'ifr-imc-operation': 'rotor.ifrVfr', 'single-pilot': 'rotor.singlePilot',
        'certificate': 'rotor.certificate', 'hr-spo': 'rotor.hrSpo', 'group-airline': 'rotor.groupAirline',
        'derogations': 'rotor.derogations', 'rnp-03': 'rotor.rnp03', 'lv-takeoff': 'rotor.lvTakeoff',
        'lv-landing': 'rotor.lvLanding', 'dangerous-goods': 'rotor.dangerousGoods',
        'cat-pol-h-305': 'rotor.catPolH305', 'nvis': 'rotor.nvis', 'hho': 'rotor.hho', 'hems': 'rotor.hems',
        'hofo': 'rotor.hofo', 'sar': 'rotor.sar', 'police-operations': 'rotor.policeOperations',
        'efb-approval': 'rotor.efbApproval', 'frms': 'rotor.frms', 'ato': 'rotor.ato'
    };
    const labelFor = (field) => (labelKeys[field.id] ? t(labelKeys[field.id]) : field.label);

    // --- START: SIKRET OPERATØR-LOGIKK ---
    async function initOperatorField() {
        try {
            const response = await fetch('data/operators.json');
            const data = await response.json();
            const select = document.getElementById('operator-select');
            if (select) {
                select.innerHTML = '<option value="" data-i18n="rotor.selectOperator">' + t('rotor.selectOperator') + '</option>';
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
                const confirmManual = confirm(t('rotor.confirmManual'));
                if (confirmManual) {
                    opSelect.style.display = 'none';
                    opSelect.value = ''; 
                    opInput.style.display = 'block';
                    opInput.value = ''; 
                    toggleBtn.innerHTML = '<i class="fa-solid fa-list"></i>';
                    toggleBtn.title = t('rotor.backToListTitle');
                    toggleBtn.style.backgroundColor = '#03477F';
                    opInput.focus();
                }
            } else {
                opInput.style.display = 'none';
                opSelect.style.display = 'block';
                opInput.value = opSelect.value;
                toggleBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                toggleBtn.title = t('rotor.manualTitle');
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

        // Felt med egne (ikke-generiske) scoreverdier
        if (fieldId === 'hems' || fieldId === 'hofo' || fieldId === 'ato' || fieldId === 'single-pilot') {
            return scoringRules[fieldId]?.[selectValue] ?? 0;
        }

        // Øvrige approvals bruker generic-approval (No/Yes = 0/1)
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
        updateTilsynspakke(grandTotal);

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
        if (confirm(t('rotor.confirmClear'))) {
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
            errors.push(t('rotor.errOperatorRequired'));
            operatorNavnInput.classList.add('invalid');
            isValid = false;
        }
        if (!filledByInput.value.trim()) {
            errors.push(t('rotor.errFilledByRequired'));
            filledByInput.classList.add('invalid');
            isValid = false;
        }

        fieldData.forEach(field => {
            const select = document.getElementById(field.id);
            if (select && select.value === "") {
                errors.push(t('rotor.errChoiceRequired').replace('{label}', labelFor(field)));
                select.classList.add('invalid');
                isValid = false;
            }
        });

        if (!isValid) {
            alert(t('rotor.formIncomplete') + "\n\n" + errors.join('\n'));
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
            const opt = selectElement.options[selectElement.selectedIndex];
            // CSV holdes språkuavhengig: bruk kanonisk data-en når den finnes
            // (oversatte Ja/Nei), ellers selve teksten (tall/range er like).
            return opt.dataset.en || opt.text;
        }
        return "";
    }

    function downloadCSV() {
        if (!validateForm()) { return; }
        const operatorNavn = document.getElementById('operator-navn').value || t('rotor.unknownOperator');
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
                alert(t('rotor.fileEmpty'));
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
                        // Matcher mot kanonisk data-en (eller tekst) – uavhengig av språk
                        const option = Array.from(select.options).find(opt => (opt.dataset.en || opt.text) === valueToFind);
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
            alert(t('rotor.dataLoaded'));
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
            alert(t('rotor.loadError'));
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
                    alert(t('rotor.dropOnlyDat'));
                }
            }
        }

        // Bygg tilsynspakke-legenden på nytt ved språkbytte (gruppe-etiketten oversettes).
        window.addEventListener('languageChanged', () => {
            buildTilsynspakkeLegend();
            updateTilsynspakke(lastTotal);
        });

        loadData();
        window.syncOperatorUI();
        
        if (!document.getElementById('date').value) {
            document.getElementById('date').valueAsDate = new Date();
        }

        updateCalculations();
    }

    init();
});