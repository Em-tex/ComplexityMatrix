document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'uasComplexityData_v11'; 
    let scoringRules = {};
    let VALID_OPERATION_TYPES = [];

    const operationIcons = {
        "Agriculture": "fa-solid fa-seedling", "Dangerous goods": "fa-solid fa-triangle-exclamation",
        "Drone-in-a-box": "fa-solid fa-box-archive", "Inspection": "fa-solid fa-magnifying-glass",
        "Lightshow": "fa-solid fa-wand-magic-sparkles", "Mapping": "fa-solid fa-map-location-dot",
        "Offshore": "fa-solid fa-water", "Photo/film": "fa-solid fa-camera-retro",
        "Pollution control": "fa-solid fa-leaf", "Power generation": "fa-solid fa-bolt",
        "Powerline inspection": "fa-solid fa-plug-circle-bolt", "Research": "fa-solid fa-flask-vial",
        "SAR": "fa-solid fa-square-plus", "Sling load": "images/slingload.png",
        "State operations": "fa-solid fa-building-columns", "Surveillance": "fa-solid fa-video",
        "Swarm": "fa-solid fa-layer-group", "Tethered": "fa-solid fa-link",
        "Transport": "fa-solid fa-truck-plane", "UAS development": "fa-solid fa-gears",
        "Washing": "fa-solid fa-shower", "Weather sensor": "fa-solid fa-cloud-sun-rain",
        "Default": "fa-solid fa-circle-question"
    };
    
    const BASE_MAX_SCORES = {
        resources: 25,
        fleet: 32,
        operations: 52,
        performance: 38,
        total: 147
    };
    
    const AUDIT_FIELDS_MAX_SCORE = 27; 
    const INITIAL_APPROVAL_MAX_SCORE = 7;

    const fieldData = [
        // Resources
        { id: 'antall-baser', label: 'Number of bases', section: 'resources' },
        { id: 'antall-piloter', label: 'Number of pilots', section: 'resources' },
        { id: 'pilot-employment', label: 'Pilot employment', section: 'resources' },
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
        { id: 'sail', label: 'SAIL', section: 'operations' },
        { id: 'omrade', label: 'Area', section: 'operations' },
        { id: 'synsvidde', label: 'Line of sight', section: 'operations' },
        { id: 'flyhoyde', label: 'Flight altitude', section: 'operations' },
        { id: 'operasjonsmiljo', label: 'Operational environment', section: 'operations' },
        { id: 'redusert-grc', label: 'Reduced GRC', section: 'operations' },
        { id: 'antall-oats-luc', label: 'Number of OATs', section: 'operations' },
        { id: 'flytimer', label: 'Annual flight hours', section: 'operations' },
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

    function createCustomDropdown(originalSelect) {
        const container = document.createElement('div');
        container.className = 'custom-select-container';
        originalSelect.parentNode.insertBefore(container, originalSelect);

        const selectedDisplay = document.createElement('div');
        selectedDisplay.className = 'select-selected';
        
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
        const allItemLists = document.getElementsByClassName('select-items');
        const allSelectedDisplays = document.getElementsByClassName('select-arrow-active');
        
        for (const display of allSelectedDisplays) {
            if (display !== elmnt) {
                display.classList.remove('select-arrow-active');
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
                if (totals[field.section] !== undefined) {
                    totals[field.section] += score;
                }
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
    
    // OPPDATERT FUNKSJON: Omskrevet for garantert rekkefølge og robusthet.
    function downloadCSV() {
        const operatorInput = document.getElementById('operator-navn');
        const filledByInput = document.getElementById('filled-by');
        
        // Validering
        if (!operatorInput.value.trim() || !filledByInput.value.trim()) {
            alert("'Operator' and 'Filled out by' must be completed before downloading.");
            if (!operatorInput.value.trim()) operatorInput.classList.add('invalid');
            if (!filledByInput.value.trim()) filledByInput.classList.add('invalid');
            return;
        }
        if (!validateForm() || !validateOperationTypes()) return;

        // Data-innsamling
        const operatorName = operatorInput.value;
        const dateValue = document.getElementById('date').value;
        const hasNeverBeenAudited = document.getElementById('aldri-hatt-tilsyn').checked;
        
        const sums = {
            resources: document.getElementById('resources-sum').textContent,
            fleet: document.getElementById('fleet-sum').textContent,
            operations: document.getElementById('operations-sum').textContent,
            performance: document.getElementById('performance-sum').textContent,
            total: document.getElementById('total-gauge-sum-text').textContent
        };
        const maxSums = {
            resources: document.getElementById('resources-max-sum').textContent,
            fleet: document.getElementById('fleet-max-sum').textContent,
            operations: document.getElementById('operations-max-sum').textContent,
            performance: document.getElementById('performance-max-sum').textContent,
            total: document.getElementById('total-gauge-max-text').textContent
        };
        const percent = {
            resources: ((parseFloat(sums.resources) / parseFloat(maxSums.resources)) * 100).toFixed(1),
            fleet: ((parseFloat(sums.fleet) / parseFloat(maxSums.fleet)) * 100).toFixed(1),
            operations: ((parseFloat(sums.operations) / parseFloat(maxSums.operations)) * 100).toFixed(1),
            performance: ((parseFloat(sums.performance) / parseFloat(maxSums.performance)) * 100).toFixed(1),
            total: ((parseFloat(sums.total) / parseFloat(maxSums.total)) * 100).toFixed(1)
        };
        
        let auditFlag = 0;
        if (hasNeverBeenAudited) {
            if (document.getElementById('tid-forstegangsgodkjenning').value === 'over-2ar') auditFlag = 1;
        } else {
            if (document.getElementById('tid-siste-tilsyn').value === 'over-3ar') auditFlag = 1;
        }
        const comments = `"${document.getElementById('comments').value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;

        // Bygg headers og data-rader med garantert rekkefølge
        const headers = [];
        const data = [];

        // Primær-seksjon
        headers.push('Operator', 'Filled out by', 'Date', 'Main Approval Type', 'Main Operation Type 1', 'Main Operation Type 2', 'Main Operation Type 3', 'Resources Sum', 'Fleet Specific Sum', 'Operations Sum', 'Performance Sum', 'Total Sum', 'Resources Percent', 'Fleet Percent', 'Operations Percent', 'Performance Percent', 'Total Percent', 'Comments', 'Audit flag', 'Never Been Audited');
        data.push(`"${operatorName.replace(/"/g, '""')}"`, `"${filledByInput.value.replace(/"/g, '""')}"`, `"${dateValue}"`, `"${document.getElementById('main-approval-type').value}"`, `"${document.getElementById('operation-select-1').value}"`, `"${document.getElementById('operation-select-2').value}"`, `"${document.getElementById('operation-select-3').value}"`, sums.resources, sums.fleet, sums.operations, sums.performance, sums.total, percent.resources, percent.fleet, percent.operations, percent.performance, percent.total, comments, auditFlag, hasNeverBeenAudited);

        // Detalj-seksjon
        fieldData.forEach(field => {
            const select = document.getElementById(field.id);
            const valueCell = document.getElementById(field.id + '-value');
            let label = field.label;
            if (field.id === 'antall-oats-luc') {
                label = document.getElementById('oat-luc-label-text').textContent;
            }
            const selectionText = select.disabled ? "N/A" : (getSelectedText(field.id) || "");
            const score = valueCell.textContent;

            headers.push(`${label} (Selection)`, `${label} (Value)`);
            data.push(`"${selectionText.replace(/"/g, '""')}"`, score);
        });

        // Generer og last ned fil
        const fileName = `${operatorName.replace(/ /g, "_")}_${dateValue}.csv`;
        const csvContent = headers.join(';') + '\r\n' + data.join(';');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
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

    // OPPDATERT FUNKSJON: Fikset feil i hvordan den fant de egendefinerte select-boksene.
    function validateOperationTypes() {
        const opSelect1 = document.getElementById('operation-select-1');
        const opSelect2 = document.getElementById('operation-select-2');
        const opSelect3 = document.getElementById('operation-select-3');
        const selects = [opSelect1, opSelect2, opSelect3];
        
        // Fikset måten den finner det visuelle elementet på.
        const customSelects = selects.map(s => s.previousElementSibling.querySelector('.select-selected'));

        customSelects.forEach(cs => cs.classList.remove('invalid'));
    
        if (opSelect1.value === "") {
            alert("Main operation type 1 is required.");
            customSelects[0].classList.add('invalid');
            return false;
        }
    
        const filledValues = selects.map(select => select.value).filter(value => value !== '');
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
            try {
                const lines = e.target.result.split(/\r?\n/);
                if (lines.length < 2) throw new Error("CSV file is empty or invalid.");

                const headers = lines[0].split(';').map(h => parseCsvField(h));
                const data = lines[1].split(';').map(d => parseCsvField(d));
                const headerMap = Object.fromEntries(headers.map((h, i) => [h, i]));

                const setValue = (id, headerName) => {
                    const el = document.getElementById(id);
                    const index = headerMap[headerName];
                    if (el && index !== undefined && data[index] !== undefined) {
                        if (el.type === 'checkbox') {
                            el.checked = data[index].toLowerCase() === 'true';
                        } else {
                            el.value = data[index];
                        }
                    }
                };
                
                setValue('operator-navn', 'Operator');
                setValue('filled-by', 'Filled out by');
                setValue('date', 'Date');
                setValue('main-approval-type', 'Main Approval Type');
                setValue('operation-select-1', 'Main Operation Type 1');
                setValue('operation-select-2', 'Main Operation Type 2');
                setValue('operation-select-3', 'Main Operation Type 3');
                setValue('comments', 'Comments');
                setValue('aldri-hatt-tilsyn', 'Never Been Audited');

                fieldData.forEach(field => {
                    const select = document.getElementById(field.id);
                    if (select) {
                        let headerName = `${field.label} (Selection)`;
                        if (field.id === 'antall-oats-luc') {
                           const lucLabel = 'LUC privileges (Selection)';
                           const oatLabel = 'Number of OATs (Selection)';
                           headerName = headerMap[lucLabel] !== undefined ? lucLabel : oatLabel;
                        }
                        
                        const index = headerMap[headerName];
                        if (index !== undefined && data[index] !== undefined) {
                            const valueToFind = data[index];
                            const option = Array.from(select.options).find(opt => opt.text === valueToFind);
                            select.value = option ? option.value : "";
                        }
                    }
                });

                document.querySelectorAll('.custom-select-container + select').forEach(s => s.dispatchEvent(new Event('change', { bubbles: true })));
                updateOatLucLabel();
                toggleTilsynFields();
                
                alert("CSV file loaded successfully!");

            } catch (error) {
                console.error("Error loading CSV:", error);
                alert("Failed to load CSV file. Please check the file format and content.");
            }
        };
        reader.readAsText(file, "UTF-8");
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
            if (el.tagName === 'SELECT' || el.matches('input[type="text"]')) {
                el.addEventListener('input', () => {
                    el.classList.remove('invalid');
                    const customSelectDisplay = el.previousElementSibling?.querySelector('.select-selected');
                    if (customSelectDisplay) {
                        customSelectDisplay.classList.remove('invalid');
                    }
                });
            }
        });

        fieldData.filter(f => f.needsComment).forEach(field => {
            document.getElementById(field.id).addEventListener('change', handleCommentAlert);
        });

        document.getElementById('main-approval-type').addEventListener('change', updateOatLucLabel);
        document.getElementById('aldri-hatt-tilsyn').addEventListener('change', toggleTilsynFields);
        document.getElementById('clear-form-button').addEventListener('click', clearForm);
        document.getElementById('download-csv-button').addEventListener('click', downloadCSV);
        document.getElementById('print-pdf-button').addEventListener('click', printPDF);
        
        const loadCsvButton = document.getElementById('load-csv-button');
        const csvFileInput = document.getElementById('csv-file-input');
        loadCsvButton.addEventListener('click', () => csvFileInput.click());
        csvFileInput.addEventListener('change', loadCsvFile);

        loadData();
        
        document.getElementById('date').valueAsDate = new Date();
        
        updateOatLucLabel();
        toggleTilsynFields();
    }
    
    init();
});