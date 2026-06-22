document.addEventListener('DOMContentLoaded', async () => {
    const t = (k) => (window.I18n ? window.I18n.t(k) : k);
    let scoringData = null;
    let operationTypes = null;
    const STORAGE_KEY = 'uasComplexityData';

    // Ikon per operasjonstype (vises i den egendefinerte nedtrekksmenyen). Verdier som
    // peker paa .png/.svg vises som bilde, ellers som Font Awesome-klasse.
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
    const dropdownRefreshers = [];   // synk visningen til de egendefinerte nedtrekkene

    // Definerer maksverdier
    const MAX_SCORES = {
        resources: 26,
        fleet: 32,
        operations: 59,
        performance: 48,
        total: 165
    };

    const categories = {
        resources: ['antall-baser', 'antall-piloter', 'pilot-employment', 'ledende-personell-roller', 'krav-eksamen', 'manualverk'],
        fleet: ['tyngste-fartoy', 'antall-fartoy', 'antall-typer', 'c2link', 'modifiserte-fartoy', 'test-development'],
        operations: ['sail', 'omrade', 'synsvidde', 'flyhoyde', 'operasjonsmiljo', 'redusert-grc', 'antall-oats-luc', 'flytimer', 'annen-risiko', 'state-operations', 'state-exemptions'],
        performance: ['bekymringsmeldinger', 'veiledningsbehov', 'mangler-oat-empic', 'niva1-avvik', 'niva2-avvik', 'frist-lukking', 'sms-tilsyn']
    };

    // CSV-etiketter er ALLTID engelske (uavhengig av visningsspråk) slik at
    // eksport/import er stabilt. Bygges fra denne faste engelske mappen, ikke
    // fra DOM-teksten (som oversettes).
    const csvLabels = {
        'antall-baser': 'Number of bases',
        'antall-piloter': 'Number of pilots',
        'pilot-employment': 'Pilot employment',
        'ledende-personell-roller': 'Leading personnel has multiple roles',
        'krav-eksamen': 'Exam requirements',
        'manualverk': 'Manuals',
        'tyngste-fartoy': 'Heaviest aircraft',
        'antall-fartoy': 'Number of aircraft',
        'antall-typer': 'Number of aircraft types',
        'c2link': 'C2 link',
        'modifiserte-fartoy': 'Modified aircraft',
        'test-development': 'Test and Development',
        'sail': 'Highest SAIL',
        'omrade': 'Area of approval',
        'synsvidde': 'Line of sight',
        'flyhoyde': 'Flight altitude',
        'operasjonsmiljo': 'Operational environment',
        'redusert-grc': 'Reduced GRC',
        'antall-oats-luc': 'Number of OATs / LUC privileges',
        'flytimer': 'Expected annual flight hours',
        'annen-risiko': 'Other increased complexity',
        'state-operations': 'State operations',
        'state-exemptions': 'Exemptions from 947 that could increase risk?',
        'bekymringsmeldinger': 'Reports of concern',
        'veiledningsbehov': 'Need for guidance',
        'mangler-oat-empic': 'Missing data in EMPIC',
        'niva1-avvik': 'Level 1 finding',
        'niva2-avvik': 'Number of level 2 findings',
        'frist-lukking': 'Deadline for closure',
        'sms-tilsyn': 'SMS'
    };
    const csvLabelFor = (fieldId) => csvLabels[fieldId] || fieldId;

    // Laster inn den nye operatørlisten
    async function initOperatorField() {
        try {
            const response = await fetch('data/operators.json');
            const data = await response.json();
            const select = document.getElementById('operator-select');
            if (select) {
                select.innerHTML = `<option value="" data-i18n="uas.selectOperator">${t('uas.selectOperator')}</option>`;
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
                const confirmManual = confirm(t('uas.confirmManual'));
                if (confirmManual) {
                    opSelect.style.display = 'none';
                    opSelect.value = '';
                    opInput.style.display = 'block';
                    opInput.value = '';
                    toggleBtn.innerHTML = '<i class="fa-solid fa-list"></i>';
                    toggleBtn.title = t('uas.backToList');
                    toggleBtn.style.backgroundColor = '#03477F';
                    opInput.focus();
                }
            } else {
                opInput.style.display = 'none';
                opSelect.style.display = 'block';
                opInput.value = opSelect.value;
                toggleBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                toggleBtn.title = t('uas.enterManually');
                toggleBtn.style.backgroundColor = '#6c757d';
                saveData();
            }
        });
    }

    // Synkroniserer operatørfeltet ved lasting av filer
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

    async function loadConfig() {
        try {
            const [scoringRes, typesRes] = await Promise.all([
                fetch('data/scoring.json'),
                fetch('data/operation_types.json')
            ]);
            scoringData = await scoringRes.json();
            operationTypes = await typesRes.json();
            initOperationTypes();
        } catch (error) {
            console.error("Error loading JSON configs:", error);
            alert(t('uas.loadConfigError'));
        }
    }

    function initOperationTypes() {
        for (let i = 1; i <= 3; i++) {
            const select = document.getElementById(`operation-select-${i}`);
            if (select) {
                operationTypes.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type;
                    option.textContent = type;
                    select.appendChild(option);
                });
                createCustomDropdown(select);   // egendefinert nedtrekk med ikoner
            }
        }
    }

    function refreshCustomDropdowns() {
        dropdownRefreshers.forEach(fn => fn());
    }

    function closeAllSelects(except) {
        document.querySelectorAll('.select-selected.select-arrow-active').forEach(display => {
            if (display !== except) {
                display.classList.remove('select-arrow-active');
                display.nextElementSibling.classList.add('select-hide');
            }
        });
    }

    // Bygger et egendefinert nedtrekk over en skjult <select>, slik at hvert valg kan
    // ha ikon og bruke samme font (Overpass) baade lukket og aapen.
    function createCustomDropdown(originalSelect) {
        const container = document.createElement('div');
        container.className = 'custom-select-container';
        originalSelect.parentNode.insertBefore(container, originalSelect);

        const iconHtml = (value) => {
            const ref = operationIcons[value] || operationIcons.Default;
            return (ref.includes('.png') || ref.includes('.svg'))
                ? `<img src="${ref}" class="custom-select-icon">`
                : `<i class="${ref}"></i>`;
        };

        const selectedDisplay = document.createElement('div');
        selectedDisplay.className = 'select-selected';
        const updateSelectedDisplay = () => {
            const opt = originalSelect.options[originalSelect.selectedIndex];
            const text = opt ? opt.textContent : '';
            if (opt && opt.value) {
                selectedDisplay.innerHTML = `${iconHtml(opt.value)}<span>${text}</span>`;
                selectedDisplay.classList.remove('placeholder');
            } else {
                selectedDisplay.innerHTML = `<span>${text}</span>`;
                selectedDisplay.classList.add('placeholder');
            }
        };
        updateSelectedDisplay();
        dropdownRefreshers.push(updateSelectedDisplay);
        container.appendChild(selectedDisplay);

        const optionsList = document.createElement('div');
        optionsList.className = 'select-items select-hide';
        Array.from(originalSelect.options).forEach(option => {
            const optionDiv = document.createElement('div');
            optionDiv.innerHTML = option.value
                ? `${iconHtml(option.value)}<span>${option.textContent}</span>`
                : `<span>${option.textContent}</span>`;
            optionDiv.addEventListener('click', () => {
                originalSelect.value = option.value;
                originalSelect.dispatchEvent(new Event('change'));
                updateSelectedDisplay();
                closeAllSelects(null);
            });
            optionsList.appendChild(optionDiv);
        });
        container.appendChild(optionsList);

        selectedDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            const willOpen = optionsList.classList.contains('select-hide');
            closeAllSelects(willOpen ? selectedDisplay : null);
            optionsList.classList.toggle('select-hide', !willOpen);
            selectedDisplay.classList.toggle('select-arrow-active', willOpen);
        });

        originalSelect.style.display = 'none';
    }

    function getSelectValue(id) {
        const el = document.getElementById(id);
        return el && !el.disabled ? el.value : '';
    }

    function calculateScore() {
        if (!scoringData) return;

        let categorySums = { resources: 0, fleet: 0, operations: 0, performance: 0 };
        let grandTotal = 0;

        for (const [category, fields] of Object.entries(categories)) {
            fields.forEach(fieldId => {
                const selectValue = getSelectValue(fieldId);
                const score = scoringData[fieldId] && scoringData[fieldId][selectValue] !== undefined 
                              ? scoringData[fieldId][selectValue] : 0;

                const valueCell = document.getElementById(`${fieldId}-value`);
                if (valueCell) {
                    valueCell.textContent = selectValue === 'N/A' || selectValue === '' ? '-' : score;
                    if (selectValue !== 'N/A' && selectValue !== '') {
                        valueCell.classList.add('bg-weak-yellow');
                    } else {
                        valueCell.classList.remove('bg-weak-yellow');
                    }
                }
                categorySums[category] += score;
            });
            
            document.getElementById(`${category}-sum`).textContent = categorySums[category];
            updateGauge(category, categorySums[category], MAX_SCORES[category]);
            grandTotal += categorySums[category];
        }

        document.getElementById('total-gauge-sum-text').textContent = grandTotal;
        updateGauge('total', grandTotal, MAX_SCORES.total);
        updateTotalLabel(grandTotal);
        updateFlags();
        saveData();
    }

    function updateGauge(prefix, value, maxValue) {
        const needle = document.getElementById(prefix + '-needle');
        if (!needle) return;
        const percentage = Math.min(1, Math.max(0, value / maxValue));
        const rotation = -90 + (percentage * 180);
        needle.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
    }

    function updateTotalLabel(totalScore) {
        const labelEl = document.getElementById('total-label');
        if (!labelEl) return;
        
        if (totalScore <= 40) {
            labelEl.textContent = 'Low Risk';
            labelEl.style.backgroundColor = '#d4edda';
            labelEl.style.color = '#155724';
        } else if (totalScore <= 80) {
            labelEl.textContent = 'Medium Risk';
            labelEl.style.backgroundColor = '#fff3cd';
            labelEl.style.color = '#856404';
        } else {
            labelEl.textContent = 'High Risk';
            labelEl.style.backgroundColor = '#f8d7da';
            labelEl.style.color = '#721c24';
        }
    }

    function updateFlags() {
        const container = document.getElementById('flags-container');
        container.innerHTML = ''; 

        const stateOps = document.getElementById('state-operations').value;
        if (stateOps === 'Ja') {
            container.innerHTML += `<div class="flag-item"><i class="fa-solid fa-flag"></i> ${t('uas.flagState')}</div>`;
        }

        const neverAudited = document.getElementById('aldri-hatt-tilsyn').checked;
        if (neverAudited) {
            container.innerHTML += `<div class="flag-item"><i class="fa-solid fa-flag"></i> ${t('uas.flagNeverAudited')}</div>`;
        }
    }

    function toggleStateExemptions() {
        const stateSelect = document.getElementById('state-operations');
        const exceptionsRow = document.getElementById('state-exemptions-row');
        const commentRow = document.getElementById('state-comment-row');
        const exemptionsSelect = document.getElementById('state-exemptions');

        if (stateSelect.value === 'Ja') {
            exceptionsRow.classList.remove('hidden');
            if(exemptionsSelect.value !== 'Nei' && exemptionsSelect.value !== '') {
                commentRow.classList.remove('hidden');
            } else {
                commentRow.classList.add('hidden');
            }
        } else {
            exceptionsRow.classList.add('hidden');
            commentRow.classList.add('hidden');
            exemptionsSelect.value = '';
        }
        calculateScore();
    }

    function toggleAuditFields() {
        const neverAudited = document.getElementById('aldri-hatt-tilsyn').checked;
        const auditContainer = document.getElementById('tilsyn-fields-container');
        const initialContainer = document.getElementById('forstegang-fields-container');

        if (neverAudited) {
            auditContainer.classList.add('hidden');
            initialContainer.classList.remove('hidden');
            auditContainer.querySelectorAll('select, input').forEach(el => {
                if (el.tagName === 'SELECT') el.value = '';
                if (el.tagName === 'INPUT') el.value = '';
            });
        } else {
            auditContainer.classList.remove('hidden');
            initialContainer.classList.add('hidden');
            initialContainer.querySelectorAll('input').forEach(el => el.value = '');
        }
        calculateScore();
    }

    function toggleApprovalTypes() {
        const mainApproval = document.getElementById('main-approval-type').value;
        const lucLabelText = document.getElementById('oat-luc-label-text');
        const lucTooltip = document.getElementById('luc-privileges-tooltip');
        
        if (mainApproval === 'LUC') {
            lucLabelText.textContent = t('uas.lucNumber');
            lucTooltip.style.display = "inline-block";
        } else {
            lucLabelText.textContent = t('uas.oatNumber');
            lucTooltip.style.display = "none";
        }
    }

    function saveData() {
        const data = {};
        document.querySelectorAll('input[type="text"], input[type="date"], select, textarea, input[type="checkbox"]').forEach(el => {
            if (el.id && el.id !== 'operator-select') {
                data[el.id] = el.type === 'checkbox' ? el.checked : el.value;
            }
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function loadData() {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (data) {
            for (const key in data) {
                const el = document.getElementById(key);
                if (el) {
                    if (el.type === 'checkbox') el.checked = data[key];
                    else el.value = data[key];
                }
            }
        }
    }

    function getSelectedText(selectId) {
        const select = document.getElementById(selectId);
        if (!select || select.selectedIndex < 0) return '';
        const opt = select.options[select.selectedIndex];
        // CSV skal alltid være engelsk: bruk data-en hvis satt, ellers vist tekst.
        return opt.dataset.en || opt.text;
    }

    function downloadCSV() {
        const orgName = document.getElementById('operator-navn').value || "UnknownOperator";
        const dateValue = document.getElementById('date').value;
        const formattedDate = dateValue ? new Date(dateValue).toLocaleDateString('no-NO').replace(/\./g, '-') : new Date().toLocaleDateString('no-NO').replace(/\./g, '-');
        const fileName = `UAS - ${orgName} - ${formattedDate}.dat`;

        let headers = ['Filled by', 'Date', 'Operator', 'Main Approval', 'Op Type 1', 'Op Type 2', 'Op Type 3'];
        let rowData = [
            `"${document.getElementById('filled-by').value}"`, `"${document.getElementById('date').value}"`,
            `"${orgName}"`, `"${getSelectedText('main-approval-type')}"`,
            `"${getSelectedText('operation-select-1')}"`, `"${getSelectedText('operation-select-2')}"`, `"${getSelectedText('operation-select-3')}"`
        ];

        for (const [category, fields] of Object.entries(categories)) {
            fields.forEach(fieldId => {
                const label = csvLabelFor(fieldId);
                headers.push(`"${label} (Choice)"`, `"${label} (Score)"`);
                rowData.push(`"${getSelectedText(fieldId)}"`, document.getElementById(`${fieldId}-value`)?.textContent || "0");
            });
            headers.push(`"${category.toUpperCase()} SUM"`);
            rowData.push(document.getElementById(`${category}-sum`).textContent);
        }

        headers.push('"Never Audited"', '"Initial Approval Date"', '"Last Audit Date"', '"Exemptions Comment"', '"Total Score"', '"Risk Level"', '"General Comments"');
        rowData.push(
            document.getElementById('aldri-hatt-tilsyn').checked ? "Yes" : "No",
            `"${document.getElementById('dato-forstegangsgodkjenning').value}"`,
            `"${document.getElementById('dato-siste-tilsyn').value}"`,
            `"${document.getElementById('state-comment').value.replace(/\n/g, ' ')}"`,
            document.getElementById('total-gauge-sum-text').textContent,
            `"${document.getElementById('total-label').textContent}"`,
            `"${document.getElementById('comments').value.replace(/\n/g, ' ')}"`
        );

        const csvContent = "\uFEFF" + headers.join(';') + '\r\n' + rowData.join(';');
        const blob = new Blob([csvContent], { type: 'application/octet-stream' });
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
            try {
                let lines = e.target.result.split(/\r?\n/);
                if (lines[0].charCodeAt(0) === 0xFEFF) lines[0] = lines[0].slice(1);
                
                const parseCsvField = (field) => {
                    field = field ? field.trim() : '';
                    if (field.startsWith('"') && field.endsWith('"')) return field.substring(1, field.length - 1).replace(/""/g, '"');
                    return field;
                };

                const splitCSV = (str) => str.split(/;(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                const headers = splitCSV(lines[0]).map(parseCsvField);
                const data = splitCSV(lines[1]).map(parseCsvField);
                const headerMap = Object.fromEntries(headers.map((h, i) => [h, i]));

                const setVal = (id, headerName) => { if (document.getElementById(id) && headerMap[headerName] !== undefined) document.getElementById(id).value = data[headerMap[headerName]]; };
                const setChoice = (id, headerName) => {
                    const sel = document.getElementById(id);
                    if (sel && headerMap[headerName] !== undefined) {
                        const wanted = data[headerMap[headerName]];
                        // Matcher mot engelsk (data-en) først, så vist tekst – CSV er engelsk.
                        const opt = Array.from(sel.options).find(o => (o.dataset.en || o.text) === wanted);
                        if(opt) sel.value = opt.value;
                    }
                };

                setVal('filled-by', 'Filled by');
                setVal('date', 'Date');
                setVal('operator-navn', 'Operator');
                
                setChoice('main-approval-type', 'Main Approval');
                setChoice('operation-select-1', 'Op Type 1');
                setChoice('operation-select-2', 'Op Type 2');
                setChoice('operation-select-3', 'Op Type 3');

                for (const fields of Object.values(categories)) {
                    fields.forEach(fieldId => {
                        setChoice(fieldId, `${csvLabelFor(fieldId)} (Choice)`);
                    });
                }

                const chk = document.getElementById('aldri-hatt-tilsyn');
                if (chk) chk.checked = (data[headerMap['Never Audited']] === 'Yes');

                setVal('dato-forstegangsgodkjenning', 'Initial Approval Date');
                setVal('dato-siste-tilsyn', 'Last Audit Date');
                setVal('state-comment', 'Exemptions Comment');
                setVal('comments', 'General Comments');

                window.syncOperatorUI();
                refreshCustomDropdowns();
                toggleApprovalTypes();
                toggleStateExemptions();
                toggleAuditFields();
                calculateScore();
                alert(t('uas.dataLoaded'));
            } catch (err) {
                alert(t('uas.loadFileError'));
            }
        };
        reader.readAsText(file, "UTF-8");
    }

    async function init() {
        await initOperatorField();
        await loadConfig();
        loadData();
        refreshCustomDropdowns();   // synk ikon/tekst i nedtrekkene med innlastede verdier
        window.syncOperatorUI();

        // Lukk aapne egendefinerte nedtrekk ved klikk utenfor.
        document.addEventListener('click', () => closeAllSelects(null));

        document.querySelectorAll('select, input, textarea').forEach(el => {
            el.addEventListener('change', calculateScore);
            el.addEventListener('keyup', saveData);
        });

        document.getElementById('state-operations').addEventListener('change', toggleStateExemptions);
        document.getElementById('state-exemptions').addEventListener('change', toggleStateExemptions);
        document.getElementById('main-approval-type').addEventListener('change', toggleApprovalTypes);
        document.getElementById('aldri-hatt-tilsyn').addEventListener('change', toggleAuditFields);

        document.getElementById('clear-form-button')?.addEventListener('click', () => {
            if(confirm(t('uas.clearForm'))) { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }
        });

        // Ved språkbytte: oppdater dynamisk OAT/LUC-etikett og flagg/tekster.
        window.addEventListener('languageChanged', () => {
            toggleApprovalTypes();
            updateFlags();
        });
        document.getElementById('download-csv-button')?.addEventListener('click', downloadCSV);
        document.getElementById('print-pdf-button')?.addEventListener('click', () => window.print());

        const csvFileInput = document.getElementById('csv-file-input');
        if (csvFileInput) {
            document.getElementById('load-csv-button')?.addEventListener('click', () => csvFileInput.click());
            csvFileInput.addEventListener('change', loadCsvFile);
        }

        if (!document.getElementById('date').value) document.getElementById('date').valueAsDate = new Date();

        toggleApprovalTypes();
        toggleStateExemptions();
        toggleAuditFields();
        calculateScore();
    }

    init();
});