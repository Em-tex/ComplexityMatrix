document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'atoComplexityData';
    let scoringRules = {};

    const MAX_SCORES = {
        resources: 17,
        operations: 24,
        fleet: 10,
        approvals: 19,
        performance: 20,
        total: 90
    };

    const fieldData = [
        { id: 'staff-employed', label: 'Number of staff for the operation (FTE)', section: 'resources' },
        { id: 'instructors-total', label: 'Number of instructors', section: 'resources' },
        { id: 'instructors-part-time', label: 'Number of part-time instructors on contract', section: 'resources' },
        { id: 'leading-personnel-roles', label: 'Leading personnel has several roles', section: 'resources' },
        { id: 'number-of-bases', label: 'Number of bases (main and secondary)', section: 'operations' },
        { id: 'bases-outside-norway', label: 'Secondary base(s) outside Norway', section: 'operations' },
        { id: 'ifr-operation', label: 'IFR operation', section: 'operations' },
        { id: 'ncc-operation', label: 'NCC operation', section: 'operations' },
        { id: 'spa-operation', label: 'SPA operation', section: 'operations' },
        { id: 'holds-aoc', label: 'Operator also holds an AOC', section: 'operations' },
        { id: 'own-camo', label: 'ATO has its own CAMO', section: 'operations' },
        { id: 'leasing-from-aoc', label: 'Leasing aircraft from an AOC', section: 'operations' },
        { id: 'number-of-types', label: 'Number of different types operated by ATO', section: 'fleet' },
        { id: 'me-helicopters', label: 'Number of ME helicopters', section: 'fleet' },
        { id: 'se-helicopters', label: 'Number of SE helicopters', section: 'fleet' },
        { id: 'leased-helicopters', label: 'Number of leased helicopters', section: 'fleet' },
        { id: 'integrated-courses', label: 'Integrated courses', section: 'approvals' },
        { id: 'fcl-courses', label: 'Number of approved FCL courses', section: 'approvals' },
        { id: 'certificate-courses', label: 'Number of courses for certificate issuance', section: 'approvals' },
        { id: 'type-rating-courses', label: 'Number of type rating courses', section: 'approvals' },
        { id: 'instructor-courses', label: 'Number of instructor courses', section: 'approvals' },
        { id: 'theory-ppl', label: 'Theory course for PPL certificate', section: 'approvals' },
        { id: 'theory-cpl-atpl-ir', label: 'Theory course for CPL/ATPL/IR', section: 'approvals' },
        { id: 'risk-management', label: '(1) Effective identification and management of own risk', section: 'performance' },
        { id: 'change-management', label: '(2) System for change management', section: 'performance' },
        { id: 'level-1-findings', label: '(3) Level 1 findings in the last 24 months', section: 'performance' },
        { id: 'findings-handling', label: '(4) Ability to manage findings within given deadlines', section: 'performance' },
        { id: 'general-performance', label: 'General performance of ATO management system', section: 'performance' },
        { id: 'economy', label: 'Economy', section: 'performance' }
    ];

    function calculateFieldScore(fieldId, selectValue, dependencyValue) {
        if (!scoringRules[fieldId] || !selectValue) return 0;
        
        const rule = scoringRules[fieldId][selectValue];
        if (typeof rule === 'object' && rule.type === 'dependent') {
            return rule.scores[dependencyValue] ?? rule.default;
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
        let totals = { resources: 0, operations: 0, fleet: 0, approvals: 0, performance: 0 };
        const instructorsValue = document.getElementById('instructors-total').value;

        fieldData.forEach(field => {
            const select = document.getElementById(field.id);
            const valueCell = document.getElementById(field.id + '-value');
            if (select && valueCell) {
                let dependency = null;
                if (field.id === 'leading-personnel-roles') {
                    dependency = instructorsValue;
                }

                const score = calculateFieldScore(field.id, select.value, dependency);
                valueCell.textContent = score;
                applyValueCellStyle(valueCell, score);
                if(totals.hasOwnProperty(field.section)) {
                    totals[field.section] += score;
                }
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
        if (!validateForm()) { return; }
        const operatorNavn = document.getElementById('operator-navn').value || "UnknownOperator";
        const dateValue = document.getElementById('date').value || new Date().toISOString().slice(0, 10);
        
        // === ENDRING ER HER ===
        const fileName = `${operatorNavn.replace(/ /g, "_")}_${dateValue}.csv`;
        // ======================

        const primaryHeaders = ['OperatorName', 'FilledOutBy', 'Date', 'Resources Sum', 'Operations Sum', 'Fleet Specific Sum', 'Approvals Sum', 'Performance Sum', 'TotalSum', 'Comments'];
        const detailHeaders = fieldData.map(field => [`${field.label} (Choice)`, `${field.label} (Value)`]).flat();
        const allHeaders = primaryHeaders.concat(detailHeaders);

        const comments = `"${document.getElementById('comments').value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        const primaryData = [
            `"${operatorNavn.replace(/"/g, '""')}"`,
            `"${document.getElementById('filled-by').value.replace(/"/g, '""')}"`,
            `"${dateValue}"`,
            document.getElementById('resources-sum').textContent,
            document.getElementById('operations-sum').textContent,
            document.getElementById('fleet-sum').textContent,
            document.getElementById('approvals-sum').textContent,
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
            
            document.getElementById('operator-navn').value = data[headerMap['OperatorName']] || '';
            document.getElementById('filled-by').value = data[headerMap['FilledOutBy']] || '';
            document.getElementById('date').value = data[headerMap['Date']] || '';
            
            fieldData.forEach(field => {
                const select = document.getElementById(field.id);
                if (select) {
                    const choiceHeader = `${field.label} (Choice)`;
                    const choiceIndex = headerMap[choiceHeader];
                    if (choiceIndex !== undefined && data[choiceIndex] !== undefined) {
                        const valueToFind = data[choiceIndex];
                        const option = Array.from(select.options).find(opt => opt.text === valueToFind);
                        select.value = option ? option.value : "";
                    }
                }
            });

            const commentsIndex = headerMap['Comments'];
            if (commentsIndex !== undefined) {
                document.getElementById('comments').value = data[commentsIndex] || '';
            }
            
            updateCalculations();
            alert("CSV-fil lastet inn!");
        };
        reader.readAsText(file, 'UTF-8');
    }

    async function init() {
        try {
            const [scoringRes, operatorsRes] = await Promise.all([
                fetch('data/ato_scoring.json'),
                fetch('data/operators.json') 
            ]);

            if (!scoringRes.ok) throw new Error(`ato_scoring.json not found (${scoringRes.status})`);
            if (!operatorsRes.ok) throw new Error(`operators.json not found (${operatorsRes.status})`);

            scoringRules = await scoringRes.json();
            const operators = await operatorsRes.json();
            
            const datalist = document.getElementById('operator-list');
            operators.forEach(op => {
                const option = document.createElement('option');
                option.value = op;
                datalist.appendChild(option);
            });

        } catch (error) {
            console.error('Failed to load necessary data files:', error);
            alert(`ERROR: Could not load data files (scoring/operators). The page cannot function.\n\nDetails: ${error.message}`);
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
            if (el.matches('input[type="text"], textarea')) { el.addEventListener('keyup', saveData); }
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