document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'uasComplexityData_v11'; // Inkrementert versjon
    let scoringRules = {};
    let VALID_OPERATION_TYPES = [];

    // I toppen av js/kalkulator.js

    const operationIcons = {
        "Agriculture": "fa-solid fa-seedling",
        "Dangerous goods": "fa-solid fa-triangle-exclamation",
        "Drone-in-a-box": "fa-solid fa-box-archive",
        "Inspection": "fa-solid fa-magnifying-glass",
        "Lightshow": "fa-solid fa-wand-magic-sparkles",
        "Mapping": "fa-solid fa-map-location-dot",
        "Offshore": "fa-solid fa-water",
        "Photo/film": "fa-solid fa-camera-retro",
        "Pollution control": "fa-solid fa-leaf",
        "Power generation": "fa-solid fa-bolt",
        "Powerline inspection": "fa-solid fa-plug-circle-bolt", // ENDRET
        "Research": "fa-solid fa-flask-vial",
        "SAR": "fa-solid fa-square-plus", // ENDRET
        "Sling load": "images/slingload.png",
        "State operations": "fa-solid fa-building-columns",
        "Surveillance": "fa-solid fa-video",
        "Swarm": "fa-solid fa-layer-group",
        "Tethered": "fa-solid fa-link",
        "Transport": "fa-solid fa-truck-plane",
        "UAS development": "fa-solid fa-gears",
        "Washing": "fa-solid fa-shower",
        "Weather sensor": "fa-solid fa-cloud-sun-rain",
        "Default": "fa-solid fa-circle-question"
    };
    const BASE_MAX_SCORES = {
        resources: 19,
        fleet: 32,
        operations: 48,
        performance: 31,
        total: 130
    };
    
    const AUDIT_FIELDS_MAX_SCORE = 20;  
    const INITIAL_APPROVAL_MAX_SCORE = 7;

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
        { id: 'modifiserte-fartoy', label: 'Modified aircraft', section: 'fleet', needsComment: true },
        { id: 'test-development', label: 'Test and Development', section: 'fleet' },
        // Operations
        { id: 'synsvidde', label: 'Line of sight', section: 'operations' },
        { id: 'flyhoyde', label: 'Flight altitude', section: 'operations' },
        { id: 'operasjonsmiljo', label: 'Operational environment', section: 'operations' },
        { id: 'antall-oats-luc', label: 'Number of OATs', section: 'operations' },
        { id: 'flytimer', label: 'Annual flight hours', section: 'operations' },
        { id: 'redusert-grc', label: 'Reduced GRC', section: 'operations' },
        { id: 'omrade', label: 'Area', section: 'operations' },
        { id: 'sail', label: 'SAIL', section: 'operations' },
        { id: 'annen-risiko', label: 'Other increased risk', section: 'operations', needsComment: true },
        // Performance
        { id: 'bekymringsmeldinger', label: 'Reports of concern', section: 'performance', needsComment: true },
        { id: 'veiledningsbehov', label: 'Need for guidance', section: 'performance' },
        { id: 'mangler-oat-empic', label: 'Missing data in EMPIC', section: 'performance' },
        { id: 'tid-siste-tilsyn', label: 'Time since last audit', section: 'performance', group: 'tilsyn' },
        { id: 'niva1-avvik', label: 'Level 1 finding', section: 'performance', group: 'tilsyn' },
        { id: 'niva2-avvik', label: 'Number of level 2 findings', section: 'performance', group: 'tilsyn' },
        { id: 'frist-lukking', label: 'Deadline for closure', section: 'performance', group: 'tilsyn' },
        { id: 'sms-tilsyn', label: 'SMS', section: 'performance', group: 'tilsyn' },
        { id: 'tid-forstegangsgodkjenning', label: 'Time since initial approval', section: 'performance', group: 'forstegang' }
    ];

    // I js/kalkulator.js

function createCustomDropdown(originalSelect) {
    const container = document.createElement('div');
    container.className = 'custom-select-container';
    originalSelect.parentNode.insertBefore(container, originalSelect);

    const selectedDisplay = document.createElement('div');
    selectedDisplay.className = 'select-selected';
    
    // Intern funksjon for å lage ikon-HTML (enten <i> eller <img>)
    const createIconHtml = (value) => {
        const iconPathOrClass = operationIcons[value] || operationIcons.Default;
        if (iconPathOrClass.includes('.png') || iconPathOrClass.includes('.svg')) {
            return `<img src="${iconPathOrClass}" class="custom-select-icon">`;
        }
        return `<i class="${iconPathOrClass}"></i>`;
    };

    const updateSelectedDisplay = () => {
        const selectedOption = originalSelect.options[originalSelect.selectedIndex];
        const text = selectedOption.textContent;
        if (selectedOption.value) {
            selectedDisplay.innerHTML = `${createIconHtml(selectedOption.value)}<span>${text}</span>`;
            selectedDisplay.classList.remove('placeholder');
        } else {
            selectedDisplay.innerHTML = `<span>${text}</span>`;
            selectedDisplay.classList.add('placeholder');
        }
    };
    updateSelectedDisplay();
    container.appendChild(selectedDisplay);

    const optionsList = document.createElement('div');
    optionsList.className = 'select-items select-hide';
    
    Array.from(originalSelect.options).forEach(option => {
        const optionDiv = document.createElement('div');
        if (option.value) {
            optionDiv.innerHTML = `${createIconHtml(option.value)}<span>${option.textContent}</span>`;
        } else {
            optionDiv.innerHTML = `<span>${option.textContent}</span>`;
        }
        
        optionDiv.addEventListener('click', function() {
            originalSelect.value = option.value;
            originalSelect.dispatchEvent(new Event('change')); 
            updateSelectedDisplay();
            selectedDisplay.click();
        });
        optionsList.appendChild(optionDiv);
    });
    container.appendChild(optionsList);

    selectedDisplay.addEventListener('click', function(e) {
        e.stopPropagation();
        closeAllSelects(this);
        optionsList.classList.toggle('select-hide');
        this.classList.toggle('select-arrow-active');
    });

    originalSelect.style.display = 'none';
}
    
    function closeAllSelects(elmnt) {
        // Finner alle dropdown-lister
        const allItemLists = document.getElementsByClassName('select-items');
        // Finner alle boksene som viser det valgte elementet
        const allSelectedDisplays = document.getElementsByClassName('select-arrow-active');
    
        // Går gjennom alle elementene som er merket som "åpne"
        for (const display of allSelectedDisplays) {
            // Hvis den åpne boksen IKKE er den du nettopp klikket på, lukk den.
            if (display !== elmnt) {
                display.classList.remove('select-arrow-active');
                // Finner den tilhørende listen (som er neste element) og skjuler den
                display.nextElementSibling.classList.add('select-hide');
            }
        }
    }
    document.addEventListener('click', closeAllSelects);

    function calculateFieldScore(fieldId, selectValue, currentScores) {
        if (!scoringRules[fieldId] || !selectValue) return 0;
        const rule = scoringRules[fieldId][selectValue];
        if (typeof rule === 'object' && rule.type === 'additive-dependent') {
            const pilotScore = currentScores['antall-piloter'] || 0;
            const baseScore = currentScores['antall-baser'] || 0;
            return rule.baseValue + pilotScore + baseScore;
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

    function updateGaugeLabel(prefix, value, maxValue) {
        const labelEl = document.getElementById(prefix + '-label');
        if (!labelEl) return;
        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
        let text = '';
        let className = 'gauge-label ';
        if (percentage < 25) { text = 'Low Risk'; className += 'label-green'; }
        else if (percentage < 50) { text = 'Medium Risk'; className += 'label-yellow'; }
        else { text = 'High Risk'; className += 'label-red'; }
        labelEl.textContent = text;
        labelEl.className = className;
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
    
    function updateOatLucLabel() {
        const approvalType = document.getElementById('main-approval-type').value;
        const labelText = document.getElementById('oat-luc-label-text');
        const tooltip = document.getElementById('luc-privileges-tooltip');
        if (approvalType === 'LUC') {
            labelText.textContent = 'LUC privileges';
            tooltip.style.display = 'inline-block';
        } else {
            labelText.textContent = 'Number of OATs';
            tooltip.style.display = 'none';
        }
    }

    function updateCalculations() {
        let totals = { resources: 0, fleet: 0, operations: 0, performance: 0 };
        let currentScores = {};
        let currentMaxScores = { ...BASE_MAX_SCORES };
        if (document.getElementById('aldri-hatt-tilsyn').checked) {
            currentMaxScores.performance = BASE_MAX_SCORES.performance - AUDIT_FIELDS_MAX_SCORE + INITIAL_APPROVAL_MAX_SCORE;
            currentMaxScores.total = BASE_MAX_SCORES.total - AUDIT_FIELDS_MAX_SCORE + INITIAL_APPROVAL_MAX_SCORE;
        }
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
            document.getElementById(`${section}-max-sum`).textContent = currentMaxScores[section];
            updateGauge(section, totals[section], currentMaxScores[section]);
            grandTotal += totals[section];
        }
        document.getElementById('total-gauge-sum-text').textContent = grandTotal;
        document.getElementById('total-gauge-max-text').textContent = currentMaxScores.total;
        updateGauge('total', grandTotal, currentMaxScores.total);
        updateGaugeLabel('total', grandTotal, currentMaxScores.total);
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
        if (!validateForm() || !validateOperationTypes()) return;

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
        const maxSums = {
            resources: parseFloat(document.getElementById('resources-max-sum').textContent),
            fleet: parseFloat(document.getElementById('fleet-max-sum').textContent),
            operations: parseFloat(document.getElementById('operations-max-sum').textContent),
            performance: parseFloat(document.getElementById('performance-max-sum').textContent),
            total: parseFloat(document.getElementById('total-gauge-max-text').textContent)
        };
        const percent = {
            resources: ((sums.resources / maxSums.resources) * 100).toFixed(1),
            fleet: ((sums.fleet / maxSums.fleet) * 100).toFixed(1),
            operations: ((sums.operations / maxSums.operations) * 100).toFixed(1),
            performance: ((sums.performance / maxSums.performance) * 100).toFixed(1),
            total: ((sums.total / maxSums.total) * 100).toFixed(1)
        };
        const primaryHeaders = [
            'Operator', 'Filled out by', 'Date', 
            'Main Approval Type', 'Main Operation Type 1', 'Main Operation Type 2', 'Main Operation Type 3',
            'Resources Sum', 'Fleet Specific Sum', 'Operations Sum', 'Performance Sum', 'Total Sum',
            'Resources Percent', 'Fleet Percent', 'Operations Percent', 'Performance Percent', 'Total Percent',
        ];
        const detailHeaders = fieldData.map(field => {
            if (field.id === 'antall-oats-luc') {
                const currentLabel = document.getElementById('oat-luc-label-text').textContent;
                return [`${currentLabel} (Selection)`, `${currentLabel} (Value)`];
            }
            return [`${field.label} (Selection)`, `${field.label} (Value)`]
        }).flat();
        const allHeaders = [...primaryHeaders, 'Comments', ...detailHeaders];
        const primaryData = [
            `"${operatorName.replace(/"/g, '""')}"`, `"${filledByInput.value.replace(/"/g, '""')}"`, `"${dateValue}"`,
            `"${document.getElementById('main-approval-type').value}"`,
            `"${document.getElementById('operation-select-1').value}"`,
            `"${document.getElementById('operation-select-2').value}"`,
            `"${document.getElementById('operation-select-3').value}"`,
            sums.resources, sums.fleet, sums.operations, sums.performance, sums.total,
            percent.resources, percent.fleet, percent.operations, percent.performance, percent.total,
        ];
        const detailData = fieldData.map(field => {
            const select = document.getElementById(field.id);
            const selectedText = select.disabled ? "N/A" : (getSelectedText(field.id) || "");
            const score = document.getElementById(field.id + '-value').textContent;
            return [`"${selectedText.replace(/"/g, '""')}"`, score];
        }).flat();
        const comments = `"${document.getElementById('comments').value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        const allData = [...primaryData, comments, ...detailData];
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
        document.querySelectorAll('select.invalid, .select-selected.invalid').forEach(el => el.classList.remove('invalid'));
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

    function validateOperationTypes() {
        const opSelect1 = document.getElementById('operation-select-1');
        const opSelect2 = document.getElementById('operation-select-2');
        const opSelect3 = document.getElementById('operation-select-3');
        const selects = [opSelect1, opSelect2, opSelect3];
        const customSelects = selects.map(s => s.previousSibling);

        customSelects.forEach(cs => cs.classList.remove('invalid'));
    
        if (opSelect1.value === "") {
            alert("Main operation type 1 is required.");
            customSelects[0].classList.add('invalid');
            return false;
        }
    
        const filledValues = selects
            .map(select => select.value)
            .filter(value => value !== '');
    
        const uniqueValues = new Set(filledValues);
        if (uniqueValues.size !== filledValues.length) {
            alert("Main operation types cannot be duplicates.");
            const counts = filledValues.reduce((acc, val) => ({...acc, [val]: (acc[val] || 0) + 1}), {});
            const duplicates = Object.keys(counts).filter(key => counts[key] > 1);
            selects.forEach((select, index) => {
                if (duplicates.includes(select.value)) {
                    customSelects[index].classList.add('invalid');
                }
            });
            return false;
        }
        return true;
    }

    function printPDF() { if (validateForm() && validateOperationTypes()) window.print(); }

    function getSelectedText(selectId) {
        const sel = document.getElementById(selectId);
        if (!sel || sel.selectedIndex === -1) return "";
        return sel.options[sel.selectedIndex].text;
    }

    function handleCommentAlert(event) {
        const fieldId = event.target.id;
        const selectedValue = event.target.value;
        const score = calculateFieldScore(fieldId, selectedValue, {});
        if (score > 0) {
            setTimeout(() => {
                alert("Please provide a justification for this selection in the comments field.");
            }, 100);
        }
    }
    
    async function init() {
        try {
            const [scoringRes, operatorsRes, opTypesRes] = await Promise.all([
                fetch('data/scoring.json'),
                fetch('data/operators.json'),
                fetch('data/operation_types.json')
            ]);
            scoringRules = await scoringRes.json();
            const operators = await operatorsRes.json();
            VALID_OPERATION_TYPES = await opTypesRes.json();
            
            const operatorDatalist = document.getElementById('operator-list');
            operators.forEach(op => { operatorDatalist.innerHTML += `<option value="${op}"></option>`; });
            
            const opSelectIds = ['operation-select-1', 'operation-select-2', 'operation-select-3'];
            opSelectIds.forEach(id => {
                const select = document.getElementById(id);
                if(select) {
                    VALID_OPERATION_TYPES.forEach(opType => {
                        select.innerHTML += `<option value="${opType}">${opType}</option>`;
                    });
                    createCustomDropdown(select);
                }
            });

        } catch (error) {
            console.error('Failed to load data files:', error);
            alert('ERROR: Could not load data files (scoring.json/operators.json/operation_types.json).');
            return;
        }

        document.querySelectorAll('input, select, textarea').forEach(el => {
            el.addEventListener('change', updateCalculations);
            if (el.matches('input[type="text"], textarea')) el.addEventListener('keyup', saveData);
            if (el.tagName === 'SELECT' || el.type === 'text') el.addEventListener('input', () => {
                el.classList.remove('invalid');
                if (el.previousSibling && el.previousSibling.classList.contains('select-selected')) {
                    el.previousSibling.classList.remove('invalid');
                }
            });
        });

        fieldData.filter(f => f.needsComment).forEach(field => {
            document.getElementById(field.id).addEventListener('change', handleCommentAlert);
        });

        document.getElementById('main-approval-type').addEventListener('change', updateOatLucLabel);
        document.getElementById('aldri-hatt-tilsyn').addEventListener('change', toggleTilsynFields);
        document.getElementById('clear-form-button').addEventListener('click', clearForm);
        document.getElementById('download-csv-button').addEventListener('click', downloadCSV);
        document.getElementById('print-pdf-button').addEventListener('click', printPDF);
        
        loadData();
        if (!document.getElementById('date').value) document.getElementById('date').valueAsDate = new Date();
        
        updateOatLucLabel();
        toggleTilsynFields();
    }
    
    init();
});