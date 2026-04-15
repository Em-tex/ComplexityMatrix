document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'uasComplexityData_v12'; 
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
        resources: 26, 
        fleet: 32,
        operations: 59, 
        performance: 48,
        total: 165
    };
    
    const AUDIT_FIELDS_MAX_SCORE = 32; 
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
        { id: 'state-operations', label: 'State operations', section: 'operations' },
        { id: 'state-exemptions', label: 'Exemptions from 947', section: 'operations' },
        // Performance
        { id: 'bekymringsmeldinger', label: 'Reports of concern', section: 'performance', needsComment: true },
        { id: 'veiledningsbehov', label: 'Need for guidance', section: 'performance' },
        { id: 'mangler-oat-empic', label: 'Missing data in EMPIC', section: 'performance' },
        { id: 'dato-siste-tilsyn', label: 'Date of last audit', section: 'performance', group: 'tilsyn' },
        { id: 'niva1-avvik', label: 'Level 1 finding', section: 'performance', group: 'tilsyn' },
        { id: 'niva2-avvik', label: 'Number of level 2 findings', section: 'performance', group: 'tilsyn' },
        { id: 'frist-lukking', label: 'Deadline for closure', section: 'performance', group: 'tilsyn' },
        { id: 'sms-tilsyn', label: 'SMS', section: 'performance', group: 'tilsyn' },
        { id: 'dato-forstegangsgodkjenning', label: 'Date of initial approval', section: 'performance', group: 'forstegang' }
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
            const text = selectedOption ? selectedOption.textContent : '';
            if (selectedOption && selectedOption.value) {
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
            if (field.group === 'tilsyn') {
                el.disabled = !hasHadTilsyn;
                if(!hasHadTilsyn) el.classList.remove('invalid');
            }
            if (field.group === 'forstegang') {
                el.disabled = hasHadTilsyn;
                if(hasHadTilsyn) el.classList.remove('invalid');
            }
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

    function getAuditAgeCategory(dateString) {
        if (!dateString) return null;
        const auditDate = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(today - auditDate);
        const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) / 365.25;

        if (diffYears < 1) return 'under-1ar';
        if (diffYears < 2) return '1-2ar';
        if (diffYears < 3) return '2-3ar';
        return 'over-3ar';
    }

    function updateFlags() {
        const flagsContainer = document.getElementById('flags-container');
        if(!flagsContainer) return [];
        flagsContainer.innerHTML = '';
        
        const activeFlagsForExport = [];

        function addFlag(text) {
            activeFlagsForExport.push(text);
            const flagEl = document.createElement('div');
            flagEl.className = 'flag-item';
            flagEl.innerHTML = `<i class="fa-solid fa-flag"></i> ${text}`;
            flagsContainer.appendChild(flagEl);
        }

        // 1. Audit / Approval Time Flag
        const aldriHattTilsyn = document.getElementById('aldri-hatt-tilsyn').checked;
        
        if (aldriHattTilsyn) {
            const forstegang = document.getElementById('dato-forstegangsgodkjenning').value;
            if (forstegang) {
                const cat = getAuditAgeCategory(forstegang);
                if (cat === 'over-3ar') {
                    addFlag("Over 3 years since initial approval");
                }
            }
        } else {
            const datoSiste = document.getElementById('dato-siste-tilsyn').value;
            if (datoSiste) {
                const cat = getAuditAgeCategory(datoSiste);
                if (cat === 'over-3ar') {
                    addFlag("Over 3 years since last audit");
                }
            }
        }

        // 2. Level 1 Finding
        if (!aldriHattTilsyn) {
            const niva1 = document.getElementById('niva1-avvik').value;
            if (niva1 === 'Ja') {
                addFlag("Level 1 finding on last audit");
            }
        }

        // 3. SAIL IV and up
        const sail = document.getElementById('sail').value;
        if (['IV', 'V', 'VI'].includes(sail)) {
            addFlag(`SAIL ${sail}`);
        }

        return activeFlagsForExport;
    }

    function updateCalculations() {
        let totals = { resources: 0, fleet: 0, operations: 0, performance: 0 };
        let currentScores = {};
        let currentMaxScores = { ...BASE_MAX_SCORES };

        // Juster maks performance hvis operatøren aldri har hatt tilsyn
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
            const el = document.getElementById(field.id);
            const valueCell = document.getElementById(field.id + '-value');
            if (el && valueCell) {
                let score = 0;
                const isHidden = el.closest('.form-row') && el.closest('.form-row').classList.contains('hidden');

                if (!el.disabled && !isHidden) {
                    if (field.id === 'dato-siste-tilsyn') {
                        const cat = getAuditAgeCategory(el.value);
                        score = calculateFieldScore('tid-siste-tilsyn', cat, currentScores);
                    } else if (field.id === 'dato-forstegangsgodkjenning') {
                        const cat = getAuditAgeCategory(el.value);
                        score = calculateFieldScore('tid-forstegangsgodkjenning', cat, currentScores);
                    } else {
                        score = calculateFieldScore(field.id, el.value, currentScores);
                    }
                } else {
                    if (el.tagName === 'SELECT' || el.type === 'date') el.value = "";
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
        
        updateFlags();
        saveData();
    }
    
    function downloadCSV() {
        const operatorInput = document.getElementById('operator-navn');
        const filledByInput = document.getElementById('filled-by');
        
        if (!operatorInput.value.trim() || !filledByInput.value.trim()) {
            alert("'Operator' and 'Filled out by' must be completed before downloading.");
            if (!operatorInput.value.trim()) operatorInput.classList.add('invalid');
            if (!filledByInput.value.trim()) filledByInput.classList.add('invalid');
            return;
        }
        if (!validateForm() || !validateOperationTypes()) return;

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
        
        // EKSPORT AV RENE TALL: %-tegnet er fjernet slik at Power Automate float() fungerer.
        const percent = {
            resources: ((parseFloat(sums.resources) / parseFloat(maxSums.resources)) * 100).toFixed(1),
            fleet: ((parseFloat(sums.fleet) / parseFloat(maxSums.fleet)) * 100).toFixed(1),
            operations: ((parseFloat(sums.operations) / parseFloat(maxSums.operations)) * 100).toFixed(1),
            performance: ((parseFloat(sums.performance) / parseFloat(maxSums.performance)) * 100).toFixed(1),
            total: ((parseFloat(sums.total) / parseFloat(maxSums.total)) * 100).toFixed(1)
        };
        
        const activeFlags = updateFlags();
        const flagsString = activeFlags.length > 0 ? `"${activeFlags.join(' | ')}"` : `""`;
        const comments = `"${document.getElementById('comments').value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        const stateComments = `"${document.getElementById('state-comment').value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;

        const headers = [];
        const data = [];

        headers.push('Operator', 'Filled out by', 'Date', 'Main Approval Type', 'Main Operation Type 1', 'Main Operation Type 2', 'Main Operation Type 3', 'Resources Sum', 'Fleet Specific Sum', 'Operations Sum', 'Performance Sum', 'Total Sum', 'Resources Percent', 'Fleet Percent', 'Operations Percent', 'Performance Percent', 'Total Percent', 'Comments', 'Never Been Audited', 'Flags', 'State Ops Comments');
        data.push(`"${operatorName.replace(/"/g, '""')}"`, `"${filledByInput.value.replace(/"/g, '""')}"`, `"${dateValue}"`, `"${document.getElementById('main-approval-type').value}"`, `"${document.getElementById('operation-select-1').value}"`, `"${document.getElementById('operation-select-2').value}"`, `"${document.getElementById('operation-select-3').value}"`, sums.resources, sums.fleet, sums.operations, sums.performance, sums.total, percent.resources, percent.fleet, percent.operations, percent.performance, percent.total, comments, hasNeverBeenAudited, flagsString, stateComments);

        fieldData.forEach(field => {
            const el = document.getElementById(field.id);
            const valueCell = document.getElementById(field.id + '-value');
            let label = field.label;
            if (field.id === 'antall-oats-luc') {
                label = document.getElementById('oat-luc-label-text').textContent;
            }
            
            const isHidden = el.closest('.form-row') && el.closest('.form-row').classList.contains('hidden');
            let selectionText = "N/A";
            
            if (!el.disabled && !isHidden) {
                if (field.id === 'dato-siste-tilsyn' || field.id === 'dato-forstegangsgodkjenning') {
                    selectionText = el.value;
                } else {
                    selectionText = getSelectedText(field.id) || "";
                }
            }
            
            const score = valueCell ? valueCell.textContent : 0;

            headers.push(`${label} (Selection)`, `${label} (Value)`);
            data.push(`"${selectionText.replace(/"/g, '""')}"`, score);
        });

        // Lagrer som .dat for å unngå forvirring, format er fremdeles CSV internt
        const fileName = `${operatorName.replace(/ /g, "_")}_${dateValue}.dat`;
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
        document.querySelectorAll('select.invalid, .select-selected.invalid, input[type="date"].invalid, textarea.invalid').forEach(el => el.classList.remove('invalid'));
        
        fieldData.forEach(field => {
            const el = document.getElementById(field.id);
            const isHidden = el && el.closest('.form-row') && el.closest('.form-row').classList.contains('hidden');
            
            if (el && !el.disabled && !isHidden) {
                if (el.value === "") {
                    el.classList.add('invalid');
                    if (el.tagName === 'SELECT') {
                        const customSelect = el.previousElementSibling?.querySelector('.select-selected');
                        if (customSelect) customSelect.classList.add('invalid');
                    }
                    isValid = false;
                }
            }
        });

        const stateExemptions = document.getElementById('state-exemptions');
        if (stateExemptions && !stateExemptions.disabled && !stateExemptions.closest('.form-row').classList.contains('hidden')) {
            if (['Noe', 'Middels', 'Betydelig'].includes(stateExemptions.value)) {
                const commentBox = document.getElementById('state-comment');
                if (commentBox.value.trim() === '') {
                    commentBox.classList.add('invalid');
                    isValid = false;
                }
            }
        }

        if (!isValid) alert("The form is not completely filled out. Missing fields have been marked.");
        return isValid;
    }

    function validateOperationTypes() {
        const opSelect1 = document.getElementById('operation-select-1');
        const opSelect2 = document.getElementById('operation-select-2');
        const opSelect3 = document.getElementById('operation-select-3');
        const selects = [opSelect1, opSelect2, opSelect3];
        
        const customSelects = selects.map(s => s.previousElementSibling?.querySelector('.select-selected')).filter(Boolean);
        customSelects.forEach(cs => cs.classList.remove('invalid'));
    
        if (opSelect1.value === "") {
            alert("Main operation type 1 is required.");
            if(customSelects[0]) customSelects[0].classList.add('invalid');
            return false;
        }
    
        const filledValues = selects.map(select => select.value).filter(value => value !== '');
        const uniqueValues = new Set(filledValues);

        if (uniqueValues.size !== filledValues.length) {
            alert("Main operation types cannot be duplicates.");
            const counts = filledValues.reduce((acc, val) => ({...acc, [val]: (acc[val] || 0) + 1}), {});
            const duplicates = Object.keys(counts).filter(key => counts[key] > 1);
            selects.forEach((select, index) => {
                if (duplicates.includes(select.value) && customSelects[index]) {
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
                if (lines.length < 2) throw new Error("File is empty or invalid.");

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
                setValue('state-comment', 'State Ops Comments');
                setValue('aldri-hatt-tilsyn', 'Never Been Audited');

                const stateOpEl = document.getElementById('state-operations');
                if (stateOpEl) stateOpEl.dispatchEvent(new Event('change'));

                fieldData.forEach(field => {
                    const el = document.getElementById(field.id);
                    if (el) {
                        let headerName = `${field.label} (Selection)`;
                        if (field.id === 'antall-oats-luc') {
                           const lucLabel = 'LUC privileges (Selection)';
                           const oatLabel = 'Number of OATs (Selection)';
                           headerName = headerMap[lucLabel] !== undefined ? lucLabel : oatLabel;
                        }
                        
                        const index = headerMap[headerName];
                        if (index !== undefined && data[index] !== undefined) {
                            if (field.id === 'dato-siste-tilsyn' || field.id === 'dato-forstegangsgodkjenning') {
                                if(data[index] !== "N/A" && data[index] !== "") el.value = data[index];
                            } else {
                                const valueToFind = data[index];
                                const option = Array.from(el.options).find(opt => opt.text === valueToFind);
                                el.value = option ? option.value : "";
                            }
                        }
                    }
                });

                document.querySelectorAll('.custom-select-container + select').forEach(s => s.dispatchEvent(new Event('change', { bubbles: true })));
                updateOatLucLabel();
                toggleTilsynFields();
                
                alert("Data file loaded successfully!");

            } catch (error) {
                console.error("Error loading data file:", error);
                alert("Failed to load file. Please check the file format and content.");
            }
        };
        reader.readAsText(file, "UTF-8");
    }

    document.getElementById('state-operations').addEventListener('change', function() {
        const isYes = this.value === 'Ja';
        document.getElementById('state-exemptions-row').classList.toggle('hidden', !isYes);
        if(!isYes) {
            document.getElementById('state-exemptions').value = '';
            document.getElementById('state-comment-row').classList.add('hidden');
        }
        updateCalculations();
    });

    document.getElementById('state-exemptions').addEventListener('change', function() {
        const val = this.value;
        const needsComment = val === 'Noe' || val === 'Middels' || val === 'Betydelig';
        document.getElementById('state-comment-row').classList.toggle('hidden', !needsComment);
        updateCalculations();
    });
    
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
                        if (id === 'operation-select-1' && opType === 'SAR') return;
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
            if (el.tagName === 'SELECT' || el.matches('input[type="text"], input[type="date"]')) {
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
            document.getElementById(field.id)?.addEventListener('change', handleCommentAlert);
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
        
        const stateOpEl = document.getElementById('state-operations');
        if (stateOpEl) stateOpEl.dispatchEvent(new Event('change'));
        const stateExEl = document.getElementById('state-exemptions');
        if (stateExEl) stateExEl.dispatchEvent(new Event('change'));

        if (!document.getElementById('date').value) {
            document.getElementById('date').valueAsDate = new Date();
        }
        
        updateOatLucLabel();
        toggleTilsynFields();
    }
    
    init();
});