document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'uasComplexityData_v4';
    let scoringRules = {};

    const MAX_SCORES = {
        resources: 19, 
        fleet: 25, 
        operations: 36,
        performance: 36, 
        total: 116
    };

    const fieldData = [
        // Resources
        { id: 'antall-baser', label: 'Number of bases', section: 'resources' },
        { id: 'antall-piloter', label: 'Number of pilots', section: 'resources' },
        { id: 'ledende-personell-roller', label: 'Leading personnel has multiple roles', section: 'resources' },
        { id: 'krav-eksamen', label: 'Exam requirements', section: 'resources' },
        { id: 'manualverk', label: 'Manuals', section: 'resources' },
        // Fleet
        { id: 'tyngste-fartoy', label: 'Heaviest aircraft', section: 'fleet' },
        { id: 'antall-fartoy', label: 'Number of aircraft', section: 'fleet' },
        { id: 'antall-typer', label: 'Number of different aircraft types', section: 'fleet' },
        { id: 'c2link', label: 'C2 link', section: 'fleet' },
        { id: 'modifiserte-fartoy', label: 'Modified aircraft', section: 'fleet' },
        // Operations
        { id: 'synsvidde', label: 'Line of sight', section: 'operations' },
        { id: 'flyhoyde', label: 'Flight altitude', section: 'operations' },
        { id: 'operasjonsmiljo', label: 'Operational environment', section: 'operations' },
        { id: 'redusert-grc', label: 'Reduced GRC', section: 'operations' },
        { id: 'omrade', label: 'Area', section: 'operations' },
        { id: 'sail', label: 'SAIL', section: 'operations' },
        { id: 'annen-risiko', label: 'Other increased risk', section: 'operations' },
        // Performance
        { id: 'flytimer', label: 'Annual flight hours', section: 'performance' },
        { id: 'bekymringsmeldinger', label: 'Reports of concern', section: 'performance' },
        { id: 'veiledningsbehov', label: 'Need for guidance', section: 'performance' },
        { id: 'mangler-oat-empic', label: 'Missing data in OAT or EMPIC', section: 'performance' },
        { id: 'tid-siste-tilsyn', label: 'Time since last audit', section: 'performance', group: 'tilsyn' },
        { id: 'niva1-avvik', label: 'Level 1 finding', section: 'performance', group: 'tilsyn' },
        { id: 'niva2-avvik', label: 'Number of level 2 findings', section: 'performance', group: 'tilsyn' },
        { id: 'frist-lukking', label: 'Deadline for closure', section: 'performance', group: 'tilsyn' },
        { id: 'sms-tilsyn', label: 'SMS', section: 'performance', group: 'tilsyn' },
        { id: 'tid-forstegangsgodkjenning', label: 'Time since initial approval', section: 'performance', group: 'forstegang' }
    ];

    function calculateFieldScore(fieldId, selectValue, currentScores) {
        if (!scoringRules[fieldId] || !selectValue) return 0;
        const rule = scoringRules[fieldId][selectValue];
        if (typeof rule === 'object') {
            if (rule.type === 'additive-dependent') {
                const pilotScore = currentScores['antall-piloter'] || 0;
                const baseScore = currentScores['antall-baser'] || 0;
                return rule.baseValue + pilotScore + baseScore;
            }
        }
        return rule ?? 0;
    }

    function applyValueCellStyle(valueCell, score) {
        valueCell.className = 'form-cell calculated-value';
        if (score >= 5) valueCell.classList.add('bg-weak-red');
        else if (score >= 2) valueCell.classList.add('bg-weak-yellow');
        else if (score > 0) valueCell.classList.add('bg-weak-green');
        else if (score < 0) valueCell.classList.add('bg-weak-blue');
        else valueCell.classList.add('bg-default-gray');
    }

    function updateGauge(prefix, value, maxValue) {
        const needle = document.getElementById(prefix + '-needle');
        if (!needle) return;
        const percentage = maxValue > 0 ? value / maxValue : 0;
        const rotation = -90 + (percentage * 180);
        needle.style.transform = `translateX(-50%) rotate(${Math.min(90, Math.max(-90, rotation))}deg)`;
    }

    function toggleTilsynFields() {
        const hasHadTilsyn = !document.getElementById('aldri-hatt-tilsyn').checked;
        document.getElementById('tilsyn-fields-container').classList.toggle('hidden', !hasHadTilsyn);
        document.getElementById('forstegang-fields-container').classList.toggle('hidden', hasHadTilsyn);
        fieldData.forEach(field => {
            const el = document.getElementById(field.id);
            if (!el) return;
            if (field.group === 'tilsyn') el.disabled = !hasHadTilsyn;
            if (field.group === 'forstegang') el.disabled = hasHadTilsyn;
        });
        updateCalculations();
    }

    function updateCalculations() {
        let totals = { resources: 0, fleet: 0, operations: 0, performance: 0 };
        let currentScores = {};
        fieldData.forEach(field => {
            if (field.id === 'antall-piloter' || field.id === 'antall-baser') {
                const select = document.getElementById(field.id);
                if (select && !select.disabled) {
                    currentScores[field.id] = calculateFieldScore(field.id, select.value, {});
                }
            }
        });
        fieldData.forEach(field => {
            const select = document.getElementById(field.id);
            const valueCell = document.getElementById(field.id + '-value');
            if (select && valueCell) {
                let score = 0;
                if (!select.disabled) {
                    score = calculateFieldScore(field.id, select.value, currentScores);
                } else {
                    select.value = "";
                }
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
    
    function downloadCSV() {
        const operatorInput = document.getElementById('operator-navn');
        const filledByInput = document.getElementById('filled-by');
        let formIsValid = true;

        [operatorInput, filledByInput].forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('invalid');
                formIsValid = false;
            } else {
                input.classList.remove('invalid');
            }
        });

        if (!formIsValid) {
            alert("'Operator' and 'Filled out by' must be completed before downloading.");
            return;
        }
        if (!validateForm()) return;

        const operatorName = operatorInput.value || "Unknown_Operator";
        const dateValue = document.getElementById('date').value || new Date().toISOString().slice(0, 10);
        const fileName = `${operatorName.replace(/ /g, "_")}_${dateValue}.csv`;

        const sums = {
            resources: parseFloat(document.getElementById('resources-sum').textContent),
            fleet: parseFloat(document.getElementById('fleet-sum').textContent),
            operations: parseFloat(document.getElementById('operations-sum').textContent),
            performance: parseFloat(document.getElementById('performance-sum').textContent),
            total: parseFloat(document.getElementById('total-gauge-sum-text').textContent)
        };
        const percent = {
            resources: ((sums.resources / MAX_SCORES.resources) * 100).toFixed(1),
            fleet: ((sums.fleet / MAX_SCORES.fleet) * 100).toFixed(1),
            operations: ((sums.operations / MAX_SCORES.operations) * 100).toFixed(1),
            performance: ((sums.performance / MAX_SCORES.performance) * 100).toFixed(1),
            total: ((sums.total / MAX_SCORES.total) * 100).toFixed(1)
        };
        const primaryHeaders = [
            'Operator', 'Filled out by', 'Date', 
            'Resources Sum', 'Fleet Specific Sum', 'Operations Sum', 'Performance Sum', 'Total Sum',
            'Resources Percent', 'Fleet Percent', 'Operations Percent', 'Performance Percent', 'Total Percent',
            'Comments'
        ];
        const detailHeaders = fieldData.map(field => [`${field.label} (Selection)`, `${field.label} (Value)`]).flat();
        const allHeaders = primaryHeaders.concat(detailHeaders);
        const comments = `"${document.getElementById('comments').value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        const primaryData = [
            `"${operatorName.replace(/"/g, '""')}"`, `"${filledByInput.value.replace(/"/g, '""')}"`, `"${dateValue}"`,
            sums.resources, sums.fleet, sums.operations, sums.performance, sums.total,
            percent.resources, percent.fleet, percent.operations, percent.performance, percent.total,
            comments
        ];
        const detailData = fieldData.map(field => {
            const selectedText = document.getElementById(field.id).disabled ? "N/A" : (getSelectedText(field.id) || "");
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
    
    function saveData() {
        const dataToSave = {};
        document.querySelectorAll('input[type="text"], input[type="date"], input[type="checkbox"], select, textarea').forEach(el => {
            if (el.id) dataToSave[el.id] = el.type === 'checkbox' ? el.checked : el.value;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }

    function loadData() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const data = JSON.parse(savedData);
            for (const id in data) {
                const el = document.getElementById(id);
                if (el) {
                    if (el.type === 'checkbox') el.checked = data[id];
                    else el.value = data[id];
                }
            }
        }
    }
    
    function clearForm() {
        if (confirm("Are you sure you want to clear the form?")) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        }
    }
    
    function validateForm() {
        let isValid = true;
        document.querySelectorAll('select.invalid').forEach(el => el.classList.remove('invalid'));
        fieldData.forEach(field => {
            const select = document.getElementById(field.id);
            if (select && !select.disabled && select.value === "") {
                select.classList.add('invalid');
                isValid = false;
            }
        });
        if (!isValid) alert("The form is not completely filled out. Missing fields have been marked.");
        return isValid;
    }

    function printPDF() { if (validateForm()) window.print(); }

    function getSelectedText(selectId) {
        const sel = document.getElementById(selectId);
        return sel.options[sel.selectedIndex]?.text;
    }
    
    async function init() {
        try {
            const [scoringRes, operatorsRes] = await Promise.all([ fetch('data/scoring.json'), fetch('data/operators.json') ]);
            scoringRules = await scoringRes.json();
            const operators = await operatorsRes.json();
            const datalist = document.getElementById('operator-list');
            operators.forEach(op => { datalist.innerHTML += `<option value="${op}"></option>`; });
        } catch (error) {
            console.error('Failed to load data files:', error);
            alert('ERROR: Could not load data files (scoring.json/operators.json).');
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
            if (el.matches('input[type="text"], textarea')) el.addEventListener('keyup', saveData);
            if (el.tagName === 'SELECT' || el.type === 'text') el.addEventListener('input', () => el.classList.remove('invalid'));
        });
        document.getElementById('aldri-hatt-tilsyn').addEventListener('change', toggleTilsynFields);
        document.getElementById('clear-form-button').addEventListener('click', clearForm);
        document.getElementById('download-csv-button').addEventListener('click', downloadCSV);
        document.getElementById('print-pdf-button').addEventListener('click', printPDF);
        loadData();
        if (!document.getElementById('date').value) document.getElementById('date').valueAsDate = new Date();
        toggleTilsynFields();
    }
    init();
});