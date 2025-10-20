document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'msatData';
    let scoringRules = {};
    let msatData = {};
    let fieldData = [];
    const GAUGE_MAX_VALUE = 7;
    const criticalItemsIds = ['2.1.1', '2.2.1', '2.2.2', '3.2.1', '5.2.1', '5.2.2', '5.2.3', '5.2.4'];

    function buildExtensionSection() {
        const container = document.getElementById('main-container');
        const column2 = container.querySelector('.column:last-child');
        const sectionEl = document.createElement('div');
        sectionEl.className = 'section';
        sectionEl.id = 'section-extension';
        sectionEl.innerHTML = `
            <div class="section-header">
                <i class="fa-solid fa-calendar-check"></i>
                <span>6. ITEMS FOR CONSIDERATION OF EXTENSION</span>
                <i class="fa-solid fa-circle-question help-icon" id="extension-help-icon"></i>
            </div>
            <div class="section-content">
                <div class="header-row"><div class="header-cell">Criteria</div><div class="header-cell">Selection</div><div class="header-cell">Score</div></div>
                <div class="form-row">
                    <div class="form-cell"><strong>6.1</strong> Financial management</div>
                    <div class="form-cell"><select id="q-financial-management"><option value="">Select...</option><option value="7">Good (7)</option><option value="4">Acceptable (4)</option><option value="1">Poor/Concern (1)</option></select></div>
                    <div class="form-cell calculated-value" id="q-financial-management-value">0</div>
                </div>
                <div class="form-row">
                    <div class="form-cell"><strong>6.2</strong> Level 1 findings in the last 24 months</div>
                    <div class="form-cell"><select id="q-level1-findings"><option value="">Select...</option><option value="7">No (7)</option><option value="1">Yes (1)</option></select></div>
                    <div class="form-cell calculated-value" id="q-level1-findings-value">0</div>
                </div>
            </div>`;
        column2.appendChild(sectionEl);
    }

    function buildForm(data) {
        const container = document.getElementById('main-container');
        container.innerHTML = ''; 
        const column1 = document.createElement('div'); column1.className = 'column';
        const column2 = document.createElement('div'); column2.className = 'column';
        data.sections.forEach((section) => {
            const sectionEl = document.createElement('div');
            sectionEl.className = 'section';
            sectionEl.id = `section-${section.id}`;
            let sectionContentHtml = `<div class="section-header"><i class="fa-solid ${section.icon}"></i><span>${section.number}. ${section.title}</span></div><div class="section-content"><div class="header-row"><div class="header-cell">Criteria</div><div class="header-cell">Selection</div><div class="header-cell">Score</div></div>`;
            section.subsections.forEach(subsection => {
                subsection.items.forEach(item => {
                    const selectId = `q${item.id.replace(/\./g, '-')}`;
                    fieldData.push({ id: selectId, label: `${item.id} ${item.text}`, section: section.id });
                    const isCritical = criticalItemsIds.includes(item.id);
                    const starHtml = isCritical ? ' <span class="critical-marker">*</span>' : '';
                    sectionContentHtml += `<div class="form-row"><div class="form-cell"><strong data-item-id="${item.id}" class="popup-opener">${item.id}</strong> ${item.text}${starHtml}</div><div class="form-cell"><select id="${selectId}"><option value="">Select...</option><option value="NA">Not Applicable</option><option value="P">Present (1)</option><option value="S">Suitable (2)</option><option value="O">Operating (4)</option><option value="E">Effective (7)</option></select></div><div class="form-cell calculated-value" id="${selectId}-value">0</div></div>`;
                });
            });
            sectionContentHtml += '</div>';
            sectionEl.innerHTML = sectionContentHtml;
            if (["1", "2"].includes(section.number)) { column1.appendChild(sectionEl); } else { column2.appendChild(sectionEl); }
        });
        container.appendChild(column1);
        container.appendChild(column2);
        buildExtensionSection();
    }

    function updateCalculations() {
        let sums = { policy: 0, risk: 0, assurance: 0, promotion: 0, additional: 0 };
        let counts = { policy: 0, risk: 0, assurance: 0, promotion: 0, additional: 0 };
        fieldData.forEach(field => {
            const select = document.getElementById(field.id);
            const valueCell = document.getElementById(field.id + '-value');
            if (select && valueCell) {
                const score = scoringRules['generic-score']?.[select.value] ?? null;
                applyValueCellStyle(valueCell, score);
                if (score !== null) {
                    sums[field.section] += score;
                    counts[field.section]++;
                }
            }
        });
        const financialSelect = document.getElementById('q-financial-management');
        const level1Select = document.getElementById('q-level1-findings');
        const financialScore = scoringRules['extension-scores']?.financial?.[financialSelect.value] ?? null;
        const level1Score = scoringRules['extension-scores']?.level1?.[level1Select.value] ?? null;
        applyValueCellStyle(document.getElementById('q-financial-management-value'), financialScore);
        applyValueCellStyle(document.getElementById('q-level1-findings-value'), level1Score);
        let grandTotalSum = 0;
        let grandTotalCount = 0;
        for (const section in sums) {
            const avg = counts[section] > 0 ? sums[section] / counts[section] : 0;
            const avgEl = document.getElementById(`${section}-avg`);
            if (avgEl) avgEl.textContent = avg.toFixed(1);
            updateGauge(section, avg, GAUGE_MAX_VALUE);
            grandTotalSum += sums[section];
            grandTotalCount += counts[section];
        }
        const grandTotalAvg = grandTotalCount > 0 ? grandTotalSum / grandTotalCount : 0;
        document.getElementById('total-gauge-avg-text').textContent = grandTotalAvg.toFixed(1);
        updateGauge('total', grandTotalAvg, GAUGE_MAX_VALUE);
        const criticalItemsMet = criticalItemsIds.every(id => {
            const cell = document.getElementById(`q${id.replace(/\./g, '-')}-value`);
            return cell && parseInt(cell.textContent) === 7;
        });
        const financialMet = financialScore !== null && financialScore >= 4;
        const level1Met = level1Score !== null && level1Score === 7;
        const allConditionsMet = criticalItemsMet && financialMet && level1Met;
        updateExtensionChecklist(criticalItemsMet, financialMet, level1Met, allConditionsMet);
        saveData();
    }
    
    function updateExtensionChecklist(criticalMet, financialMet, level1Met, allMet) {
        const checklistContainer = document.getElementById('extension-checklist');
        const finalCommentEl = document.getElementById('extension-final-comment');
        const getClass = (met) => met ? 'status-pass' : 'status-fail';
        const getIcon = (met) => met ? 'fa-circle-check' : 'fa-circle-xmark';
        checklistContainer.innerHTML = `
            <div class="${getClass(criticalMet)}"><i class="fa-solid ${getIcon(criticalMet)}"></i><span>All 8 <a href="#" id="critical-items-link" class="critical-items-link">critical items</a><span class="critical-marker">*</span> have a score of 7</span></div>
            <div class="${getClass(financialMet)}"><i class="fa-solid ${getIcon(financialMet)}"></i><span>Financial management score is 4 or higher</span></div>
            <div class="${getClass(level1Met)}"><i class="fa-solid ${getIcon(level1Met)}"></i><span>No level 1 findings in the last 24 months</span></div>`;
        if (allMet) {
            finalCommentEl.textContent = "Extension of oversight cycle may be considered (36 months).";
            finalCommentEl.className = "extension-block-comment final-pass";
        } else {
            finalCommentEl.textContent = "Standard oversight cycle (24 months).";
            finalCommentEl.className = "extension-block-comment final-neutral";
        }
    }

    function applyValueCellStyle(valueCell, score) {
        valueCell.className = 'form-cell calculated-value';
        if (score === null) { valueCell.classList.add('bg-default-gray'); valueCell.textContent = 'N/A'; return; }
        valueCell.textContent = score;
        if (score >= 7) valueCell.classList.add('bg-weak-green');
        else if (score >= 4) valueCell.classList.add('bg-weak-yellow');
        else if (score >= 2) valueCell.classList.add('bg-weak-orange');
        else if (score >= 0) valueCell.classList.add('bg-weak-red');
    }
    
    function updateGauge(prefix, value, maxValue) {
        const needle = document.getElementById(prefix + '-needle');
        if (!needle) return;
        const percentage = maxValue > 0 ? value / maxValue : 0;
        const rotation = -90 + (percentage * 180);
        needle.style.transform = `translateX(-50%) rotate(${Math.min(90, Math.max(-90, rotation))}deg)`;
    }

    function populateOrgTypes(types) { const datalist = document.getElementById('org-types-list'); if (datalist) { datalist.innerHTML = ''; types.forEach(type => { const option = document.createElement('option'); option.value = type; datalist.appendChild(option); }); } }
    
    function showPopup(targetElement) {
        const itemId = targetElement.getAttribute('data-item-id');
        const popup = document.getElementById('details-popup');
        let itemData = null;
        for (const section of msatData.sections) { for (const subsection of section.subsections) { const found = subsection.items.find(i => i.id === itemId); if (found) { itemData = found; break; } } if (itemData) break; }
        if (itemData) {
            let whatToLookForHtml = Array.isArray(itemData.details.whatToLookFor) ? '• ' + itemData.details.whatToLookFor.join('<br>• ') : itemData.details.whatToLookFor;
            popup.innerHTML = `<button id="popup-close-button" aria-label="Close">&times;</button><h4>${itemData.id} ${itemData.text}</h4><div class="popup-section"><strong>Present:</strong> ${itemData.details.Present}</div><div class="popup-section"><strong>Suitable:</strong> ${itemData.details.Suitable}</div><div class="popup-section"><strong>Operating:</strong> ${itemData.details.Operating}</div><div class="popup-section"><strong>Effective:</strong> ${itemData.details.Effective}</div><hr><div class="popup-section"><strong>What to look for:</strong><br>${whatToLookForHtml}</div>`;
            displayPopup(popup, targetElement);
        }
    }

    function showExtensionHelpPopup(targetElement) {
        const popup = document.getElementById('details-popup');
        popup.innerHTML = `<button id="popup-close-button" aria-label="Close">&times;</button><h4>Criteria for Extension Consideration</h4><div class="popup-section">To consider an extension of the oversight cycle, the following conditions must be met:<ul><li><strong>Score of 7 (Effective)</strong> is required for items:<ul><li>2.1.1, 2.2.1, 2.2.2</li><li>3.2.1</li><li>5.2.1, 5.2.2, 5.2.3, 5.2.4</li></ul></li><li><strong>Financial Management</strong> score must be at least <strong>4 (Acceptable)</strong>.</li><li><strong>Level 1 Findings</strong> score must be <strong>7 (No findings)</strong>.</li></ul></div>`;
        displayPopup(popup, targetElement);
    }
    
    function showCriticalItemsPopup(targetElement) {
        const popup = document.getElementById('details-popup');
        let listHtml = criticalItemsIds.map(id => `<li>${id}</li>`).join('');
        popup.innerHTML = `<button id="popup-close-button" aria-label="Close">&times;</button><h4>Critical Items for Extension</h4><div class="popup-section">The following items must have a score of 7 (Effective):<ul>${listHtml}</ul></div>`;
        displayPopup(popup, targetElement);
    }

    function displayPopup(popup, targetElement) {
        popup.style.display = 'block';
        const rect = targetElement.getBoundingClientRect();
        let top = rect.bottom + window.scrollY + 5;
        let left = rect.left + window.scrollX;
        if (left + popup.offsetWidth > window.innerWidth) { left = window.innerWidth - popup.offsetWidth - 20; }
        if (top + popup.offsetHeight > window.innerHeight + window.scrollY) { top = rect.top + window.scrollY - popup.offsetHeight - 5; }
        popup.style.top = `${top}px`;
        popup.style.left = `${left}px`;
    }

    function hidePopup() { document.getElementById('details-popup').style.display = 'none'; }
    function saveData() { const dataToSave = {}; document.querySelectorAll('input[type="text"], input[type="date"], select, textarea').forEach(el => { if (el.id) dataToSave[el.id] = el.value; }); localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave)); }
    function loadData() { const savedData = localStorage.getItem(STORAGE_KEY); if (savedData) { const data = JSON.parse(savedData); for (const id in data) { const el = document.getElementById(id); if (el) el.value = data[id]; } } }
    function clearForm() { if (confirm("Are you sure you want to clear the form? All saved data will be deleted.")) { localStorage.removeItem(STORAGE_KEY); window.location.reload(); } }
    function getSelectedText(selectId) { const selectElement = document.getElementById(selectId); if (selectElement && selectElement.selectedIndex >= 0) { return selectElement.options[selectElement.selectedIndex].text; } return ""; }

    function downloadCSV() {
        const orgName = document.getElementById('organisation-name').value || "UnknownOrganisation";
        const orgType = document.getElementById('organisation-type').value || "UnknownType";
        const dateValue = document.getElementById('assessment-date').value;
        let formattedDate = "";
        try { const today = new Date(); formattedDate = today.toLocaleDateString('no-NO').replace(/\./g, '-'); if (dateValue) { const date = new Date(dateValue); const inputDay = String(date.getDate()).padStart(2, '0'); const inputMonth = String(date.getMonth() + 1).padStart(2, '0'); const inputYear = date.getFullYear(); formattedDate = `${inputDay}-${inputMonth}-${inputYear}`; } } catch (e) { const today = new Date(); formattedDate = today.toLocaleDateString('no-NO'); }
        const fileName = `${orgName} - ${orgType} - MSAT - ${formattedDate}.csv`;

        // --- START OF CHANGES ---
        
        // Determine if extension is possible
        const financialScore = scoringRules['extension-scores']?.financial?.[document.getElementById('q-financial-management').value] ?? null;
        const level1Score = scoringRules['extension-scores']?.level1?.[document.getElementById('q-level1-findings').value] ?? null;
        const criticalItemsMet = criticalItemsIds.every(id => {
            const cell = document.getElementById(`q${id.replace(/\./g, '-')}-value`);
            return cell && parseInt(cell.textContent) === 7;
        });
        const financialMet = financialScore !== null && financialScore >= 4;
        const level1Met = level1Score !== null && level1Score === 7;
        const allConditionsMet = criticalItemsMet && financialMet && level1Met;
        const extensionPossible = allConditionsMet ? 'Yes' : 'No';

        // Define headers in new order
        const primaryHeaders = ['Organisation Name', 'Organisation type', 'Assessed By', 'Date', 'Empic ID', 'Policy Avg', 'Risk Avg', 'Assurance Avg', 'Promotion Avg', 'Additional Avg', 'Total Avg Score'];
        const extensionPossibleHeader = ['Extension Possible'];
        const commentFields = [ { id: 'comments-compliance', header: 'Comments (Compliance)' }, { id: 'comments-flightops', header: 'Comments (Flight Ops)' }, { id: 'comments-safety', header: 'Comments (Safety Dept)' }, { id: 'comments-training', header: 'Comments (Training)' }, { id: 'comments-planning', header: 'Comments (Planning & FTL)' }, { id: 'comments-reporting', header: 'Comments (Reporting)' }, { id: 'comments-other', header: 'Comments (Other)' } ];
        const commentHeaders = commentFields.map(f => f.header);
        const detailHeaders = fieldData.map(field => [`${field.label} (Choice)`, `${field.label} (Score)`]).flat();
        const extensionHeaders = ['6.1 Financial management (Choice)', '6.1 Financial management (Score)', '6.2 Level 1 findings (Choice)', '6.2 Level 1 findings (Score)'];
        
        const allHeaders = primaryHeaders.concat(extensionPossibleHeader, commentHeaders, detailHeaders, extensionHeaders);
        
        // Gather data in new order
        const primaryData = [ `"${orgName.replace(/"/g, '""')}"`, `"${orgType.replace(/"/g, '""')}"`, `"${document.getElementById('assessed-by').value.replace(/"/g, '""')}"`, `"${dateValue}"`, `"${document.getElementById('empic-id').value.replace(/"/g, '""')}"`, document.getElementById('policy-avg').textContent, document.getElementById('risk-avg').textContent, document.getElementById('assurance-avg').textContent, document.getElementById('promotion-avg').textContent, document.getElementById('additional-avg').textContent, document.getElementById('total-gauge-avg-text').textContent ];
        const extensionPossibleData = [extensionPossible];
        const commentData = commentFields.map(field => { const textarea = document.getElementById(field.id); const value = textarea ? textarea.value : ''; return `"${value.replace(/"/g, '""').replace(/\n/g, ' ')}"`; });
        const detailData = fieldData.map(field => { const selectedText = getSelectedText(field.id); const scoreText = document.getElementById(field.id + '-value').textContent; return [`"${selectedText.replace(/"/g, '""')}"`, scoreText]; }).flat();
        const extensionData = [ `"${getSelectedText('q-financial-management').replace(/"/g, '""')}"`, document.getElementById('q-financial-management-value').textContent, `"${getSelectedText('q-level1-findings').replace(/"/g, '""')}"`, document.getElementById('q-level1-findings-value').textContent ];

        const allData = primaryData.concat(extensionPossibleData, commentData, detailData, extensionData);

        // --- END OF CHANGES ---

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

    function loadCsvFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const lines = e.target.result.split(/\r?\n/);
            if (lines.length < 2) { alert("CSV file is empty or invalid."); return; }
            const headers = lines[0].split(';').map(h => h.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            const data = lines[1].split(';').map(d => d.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            const headerMap = Object.fromEntries(headers.map((h, i) => [h, i]));

            document.getElementById('organisation-name').value = data[headerMap['Organisation Name']] || '';
            document.getElementById('organisation-type').value = data[headerMap['Organisation type']] || '';
            document.getElementById('assessed-by').value = data[headerMap['Assessed By']] || '';
            document.getElementById('assessment-date').value = data[headerMap['Date']] || '';
            document.getElementById('empic-id').value = data[headerMap['Empic ID']] || '';
            
            fieldData.forEach(field => { const select = document.getElementById(field.id); if (select) { const choiceHeader = `${field.label} (Choice)`; const choiceIndex = headerMap[choiceHeader]; if (choiceIndex !== undefined && data[choiceIndex] !== undefined) { const valueToFind = data[choiceIndex]; const option = Array.from(select.options).find(opt => opt.text === valueToFind); select.value = option ? option.value : ""; } } });
            const financialChoice = data[headerMap['6.1 Financial management (Choice)']] || '';
            const level1Choice = data[headerMap['6.2 Level 1 findings (Choice)']] || '';
            const financialSelect = document.getElementById('q-financial-management');
            const level1Select = document.getElementById('q-level1-findings');
            if (financialSelect) { const option = Array.from(financialSelect.options).find(opt => opt.text === financialChoice); financialSelect.value = option ? option.value : ""; }
            if (level1Select) { const option = Array.from(level1Select.options).find(opt => opt.text === level1Choice); level1Select.value = option ? option.value : ""; }
            
            const commentFields = [ { id: 'comments-compliance', header: 'Comments (Compliance)' }, { id: 'comments-flightops', header: 'Comments (Flight Ops)' }, { id: 'comments-safety', header: 'Comments (Safety Dept)' }, { id: 'comments-training', header: 'Comments (Training)' }, { id: 'comments-planning', header: 'Comments (Planning & FTL)' }, { id: 'comments-reporting', header: 'Comments (Reporting)' }, { id: 'comments-other', header: 'Comments (Other)' } ];
            commentFields.forEach(field => { const textarea = document.getElementById(field.id); const index = headerMap[field.header]; if (textarea && index !== undefined && data[index] !== undefined) { textarea.value = data[index]; } });

            updateCalculations();
            alert("CSV file loaded successfully!");
        };
        reader.readAsText(file, "UTF-8");
    }

    async function init() {
        try {
            const [scoringRes, msatRes, orgTypesRes] = await Promise.all([ fetch('data/scoring.json'), fetch('data/msat_data.json'), fetch('data/organisation_types.json') ]);
            scoringRules = await scoringRes.json();
            msatData = await msatRes.json();
            populateOrgTypes(await orgTypesRes.json());
        } catch (error) { console.error('Failed to load data files:', error); alert('ERROR: Could not load essential data files.'); return; }

        buildForm(msatData);
        
        document.querySelectorAll('input, textarea, select').forEach(el => { el.addEventListener('change', updateCalculations); if(el.tagName !== 'SELECT') el.addEventListener('keyup', updateCalculations); });
        
        document.addEventListener('click', (e) => {
            const popup = document.getElementById('details-popup');
            if (e.target.id === 'critical-items-link') { e.preventDefault(); showCriticalItemsPopup(e.target); }
            else if (e.target.matches('.popup-opener')) { showPopup(e.target); } 
            else if (e.target.id === 'extension-help-icon') { showExtensionHelpPopup(e.target); }
            else if (e.target.id === 'popup-close-button') { hidePopup(); }
            else if (popup.style.display === 'block' && !popup.contains(e.target) && !e.target.closest('.popup-opener, .help-icon, .critical-items-link')) { hidePopup(); }
        });
        
        document.getElementById('clear-form-button').addEventListener('click', clearForm);
        document.getElementById('download-csv-button').addEventListener('click', downloadCSV);
        
        const loadCsvButton = document.getElementById('load-csv-button');
        const csvFileInput = document.getElementById('csv-file-input');
        loadCsvButton.addEventListener('click', () => csvFileInput.click());
        csvFileInput.addEventListener('change', loadCsvFile);

        loadData();
        if (!document.getElementById('assessment-date').value) { document.getElementById('assessment-date').valueAsDate = new Date(); }
        updateCalculations();
    }

    init();
});