document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'msatData_merged_v1';
    let scoringRules = {};
    let msatData = {};
    let fieldData = [];
    const GAUGE_MAX_VALUE = 7;
    // FFO-spesifikke ID-er
    const criticalItemsIds = ['2.1.1', '2.2.1', '2.2.2', '3.2.1', '5.2.1', '5.2.2', '5.2.3', '5.2.4'];
    let isExtensionMode = false;

    // --- START: FFO-spesifikke funksjoner ---
    function buildExtensionSection() {
        const container = document.getElementById('main-container');
        const column2 = container.querySelector('.column:last-child');
        const sectionEl = document.createElement('div');
        sectionEl.className = 'section';
        sectionEl.id = 'section-extension';
        // Skjult som standard, vises av toggle-logikk
        sectionEl.style.display = 'none'; 
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
        
        // Legg til FFO-feltene i fieldData for CSV-eksport og lagring
        fieldData.push({ id: 'q-financial-management', label: '6.1 Financial management', section: 'extension' });
        fieldData.push({ id: 'q-level1-findings', label: '6.2 Level 1 findings in the last 24 months', section: 'extension' });
    }
    // --- SLUTT: FFO-spesifikke funksjoner ---

    function buildForm(data) {
        const container = document.getElementById('main-container');
        container.innerHTML = ''; 
        const column1 = document.createElement('div'); column1.className = 'column';
        const column2 = document.createElement('div'); column2.className = 'column';
        
        data.sections.forEach((section) => {
            const sectionEl = document.createElement('div');
            sectionEl.className = 'section';
            sectionEl.id = `section-${section.id}`;
            
            let sectionContentHtml = `<div class="section-header"><i class="fa-solid ${section.icon}"></i><span>${section.number}. ${section.title}</span></div>
                                      <div class="section-content">
                                          <div class="header-row"><div class="header-cell">Criteria</div><div class="header-cell">Selection</div><div class="header-cell">Score</div></div>`;
            
            section.subsections.forEach(subsection => {
                subsection.items.forEach(item => {
                    const selectId = `q${item.id.replace(/\./g, '-')}`;
                    fieldData.push({ id: selectId, label: `${item.id} ${item.text}`, section: section.id, itemId: item.id });
                    
                    // Legg til stjerne-HTML (skjult som standard)
                    const starHtml = ' <span class="critical-marker">*</span>';
                    
                    sectionContentHtml += `
                        <div class="form-row">
                            <div class="form-cell"><strong data-item-id="${item.id}" class="popup-opener">${item.id}</strong> ${item.text}${starHtml}</div>
                            <div class="form-cell">
                                <select id="${selectId}">
                                    <option value="">Select...</option>
                                    <option value="NA">Not Applicable</option>
                                    <option value="P">Present (1)</option>
                                    <option value="S">Suitable (2)</option>
                                    <option value="O">Operating (4)</option>
                                    <option value="E">Effective (7)</option>
                                </select>
                            </div>
                            <div class="form-cell calculated-value" id="${selectId}-value">0</div>
                        </div>`;
                });
            });
            
            sectionContentHtml += '</div>';
            sectionEl.innerHTML = sectionContentHtml;
            
            if (["1", "2"].includes(section.number)) {
                column1.appendChild(sectionEl);
            } else {
                column2.appendChild(sectionEl);
            }
        });
        
        container.appendChild(column1);
        container.appendChild(column2);
        
        // Bygg den skjulte FFO-seksjonen
        buildExtensionSection();
    }

    function populateOrgTypes(types) {
        const datalist = document.getElementById('org-types-list');
        if (datalist) {
            datalist.innerHTML = '';
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                datalist.appendChild(option);
            });
        }
    }
    
    // --- START: Popup-funksjoner (kombinert) ---
    function showPopup(targetElement) {
        const itemId = targetElement.getAttribute('data-item-id');
        const popup = document.getElementById('details-popup');
        let itemData = null;

        for (const section of msatData.sections) {
            for (const subsection of section.subsections) {
                const found = subsection.items.find(i => i.id === itemId);
                if (found) { itemData = found; break; }
            }
            if (itemData) break;
        }

        if (itemData) {
            let whatToLookForHtml = '';
            if (Array.isArray(itemData.details.whatToLookFor)) {
                whatToLookForHtml = '• ' + itemData.details.whatToLookFor.join('<br>• ');
            } else {
                whatToLookForHtml = itemData.details.whatToLookFor || 'Not specified.';
            }

            popup.innerHTML = `
                <button id="popup-close-button" aria-label="Close">&times;</button>
                <h4>${itemData.id} ${itemData.text}</h4>
                <div class="popup-section"><strong>Present:</strong> ${itemData.details.Present || 'Not specified.'}</div>
                <div class="popup-section"><strong>Suitable:</strong> ${itemData.details.Suitable || 'Not specified.'}</div>
                <div class="popup-section"><strong>Operating:</strong> ${itemData.details.Operating || 'Not specified.'}</div>
                <div class="popup-section"><strong>Effective:</strong> ${itemData.details.Effective || 'Not specified.'}</div>
                <hr>
                <div class="popup-section"><strong>What to look for:</strong><br>${whatToLookForHtml}</div>`;
            displayPopup(popup, targetElement);
        }
    }
    
    function showExtensionHelpPopup(targetElement) {
        const popup = document.getElementById('details-popup');
        popup.innerHTML = `
            <button id="popup-close-button" aria-label="Close">&times;</button>
            <h4>Criteria for Extension Consideration</h4>
            <div class="popup-section">To consider an extension of the oversight cycle, the following conditions must be met:
                <ul>
                    <li><strong>Score of 7 (Effective)</strong> is required for items:
                        <ul>
                            <li>2.1.1, 2.2.1, 2.2.2</li>
                            <li>3.2.1</li>
                            <li>5.2.1, 5.2.2, 5.2.3, 5.2.4</li>
                        </ul>
                    </li>
                    <li><strong>Financial Management</strong> score must be at least <strong>4 (Acceptable)</strong>.</li>
                    <li><strong>Level 1 Findings</strong> score must be <strong>7 (No findings)</strong>.</li>
                    <li><strong>All other items</strong> (excluding the above) must have a minimum score of <strong>4 (Operating)</strong>. N/A is acceptable.</li>
                </ul>
            </div>`;
        displayPopup(popup, targetElement);
    }

    function showCriticalItemsPopup(targetElement) {
        const popup = document.getElementById('details-popup');
        let listHtml = criticalItemsIds.map(id => `<li>${id}</li>`).join('');
        popup.innerHTML = `
            <button id="popup-close-button" aria-label="Close">&times;</button>
            <h4>Critical Items for Extension</h4>
            <div class="popup-section">The following items must have a score of 7 (Effective):
                <ul>${listHtml}</ul>
            </div>`;
        displayPopup(popup, targetElement);
    }

    function displayPopup(popup, targetElement) {
        popup.style.display = 'block';
        const rect = targetElement.getBoundingClientRect();
        let top = rect.bottom + window.scrollY + 5;
        let left = rect.left + window.scrollX;

        if (left + popup.offsetWidth > window.innerWidth) {
            left = window.innerWidth - popup.offsetWidth - 20;
        }
        if (top + popup.offsetHeight > window.innerHeight + window.scrollY) {
            top = rect.top + window.scrollY - popup.offsetHeight - 5;
        }
        popup.style.top = `${top}px`;
        popup.style.left = `${left}px`;
    }

    function hidePopup() {
        document.getElementById('details-popup').style.display = 'none';
    }
    // --- SLUTT: Popup-funksjoner ---

    function calculateFieldScore(selectValue, ruleset = 'generic-score') {
         // Håndterer FFO extension scores
        if (ruleset === 'financial') {
            return scoringRules['extension-scores']?.financial?.[selectValue] ?? null;
        }
        if (ruleset === 'level1') {
            return scoringRules['extension-scores']?.level1?.[selectValue] ?? null;
        }
        // Standard MSAT score
        return scoringRules['generic-score']?.[selectValue] ?? null;
    }

    function applyValueCellStyle(valueCell, score) {
        valueCell.className = 'form-cell calculated-value';
        if (score === null) {
            valueCell.classList.add('bg-default-gray');
            valueCell.textContent = 'N/A';
            return;
        }
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
    
    // Standard MSAT anbefalingstekst
    function getRecommendationText(score) {
        if (score >= 5.5) return "The organisation's management system is considered to be at an Effective level. Extension of cycle could be considered (max 48 months).";
        if (score >= 3) return "The organisation's management system is considered to be at an Operating level. Extension of cycle could be considered (max 36 months). Pay attention to elements scoring less than 4.";
        if (score >= 2) return "The organisation's management system is considered to be at a Suitable level. Pay attention to elements scoring less than 4. Consider follow up surveillance, issuance of findings and planning cycle less than 24 months.";
        return "The organisation's management system is considered to be at a Present level. Consider suspension, issuance of findings and planning cycle less than 24 months.";
    }
    
    // FFO Sjekkliste-oppdatering
    function updateExtensionChecklist(criticalMet, financialMet, level1Met, allMinimumMet) {
        const checklistContainer = document.getElementById('extension-checklist');
        const finalCommentEl = document.getElementById('extension-final-comment');
        const getClass = (met) => met ? 'status-pass' : 'status-fail';
        const getIcon = (met) => met ? 'fa-circle-check' : 'fa-circle-xmark';

        checklistContainer.innerHTML = `
            <div class="${getClass(criticalMet)}"><i class="fa-solid ${getIcon(criticalMet)}"></i><span>All 8 <a href="#" id="critical-items-link" class="critical-items-link">critical items</a><span class="critical-marker" style="display:inline;">*</span> have a score of 7</span></div>
            <div class="${getClass(financialMet)}"><i class="fa-solid ${getIcon(financialMet)}"></i><span>Financial management score is 4 or higher</span></div>
            <div class="${getClass(level1Met)}"><i class="fa-solid ${getIcon(level1Met)}"></i><span>No level 1 findings in the last 24 months</span></div>
            <div class="${getClass(allMinimumMet)}"><i class="fa-solid ${getIcon(allMinimumMet)}"></i><span>All other items have a minimum score of 4</span></div>`;

        const allConditionsMet = criticalMet && financialMet && level1Met && allMinimumMet;
        if (allConditionsMet) {
            finalCommentEl.textContent = "Extension of oversight cycle may be considered (36 months).";
            finalCommentEl.className = "extension-block-comment final-pass";
        } else {
            finalCommentEl.textContent = "Standard oversight cycle (24 months).";
            finalCommentEl.className = "extension-block-comment final-neutral";
        }
    }

    function updateCalculations() {
        let sums = { policy: 0, risk: 0, assurance: 0, promotion: 0, additional: 0 };
        let counts = { policy: 0, risk: 0, assurance: 0, promotion: 0, additional: 0 };
        let allMinimumScoreMet = true; // FFO sjekk

        fieldData.forEach(field => {
            const select = document.getElementById(field.id);
            const valueCell = document.getElementById(field.id + '-value');
            if (select && valueCell) {
                let score = null;
                // Håndter FFO-spesifikke felt
                if (field.id === 'q-financial-management') {
                    score = calculateFieldScore(select.value, 'financial');
                    applyValueCellStyle(valueCell, score);
                } else if (field.id === 'q-level1-findings') {
                    score = calculateFieldScore(select.value, 'level1');
                    applyValueCellStyle(valueCell, score);
                } 
                // Håndter standard MSAT-felt
                else if (field.section !== 'extension') {
                    score = calculateFieldScore(select.value, 'generic-score');
                    applyValueCellStyle(valueCell, score);
                    if (score !== null) {
                        sums[field.section] += score;
                        counts[field.section]++;
                        if (score < 4) {
                            allMinimumScoreMet = false;
                        }
                    }
                }
            }
        });

        let grandTotalSum = 0;
        let grandTotalCount = 0;

        for (const section in sums) {
            const avg = counts[section] > 0 ? sums[section] / counts[section] : 0;
            document.getElementById(`${section}-avg`).textContent = avg.toFixed(1);
            updateGauge(section, avg, GAUGE_MAX_VALUE);
            grandTotalSum += sums[section];
            grandTotalCount += counts[section];
        }

        const grandTotalAvg = grandTotalCount > 0 ? grandTotalSum / grandTotalCount : 0;
        document.getElementById('total-gauge-avg-text').textContent = grandTotalAvg.toFixed(1);
        updateGauge('total', grandTotalAvg, GAUGE_MAX_VALUE);
        
        // Oppdater enten FFO-visning eller Standard-visning
        if (isExtensionMode) {
            const financialScore = calculateFieldScore(document.getElementById('q-financial-management').value, 'financial');
            const level1Score = calculateFieldScore(document.getElementById('q-level1-findings').value, 'level1');
            
            const criticalItemsMet = criticalItemsIds.every(id => {
                const cell = document.getElementById(`q${id.replace(/\./g, '-')}-value`);
                return cell && parseInt(cell.textContent) === 7;
            });
            const financialMet = financialScore !== null && financialScore >= 4;
            const level1Met = level1Score !== null && level1Score === 7;
            
            updateExtensionChecklist(criticalItemsMet, financialMet, level1Met, allMinimumScoreMet);
        } else {
            const commentEl = document.getElementById('total-score-comment');
            if (grandTotalCount > 0) {
                commentEl.textContent = getRecommendationText(grandTotalAvg);
            } else {
                commentEl.textContent = '';
            }
        }
        
        saveData();
    }

    // --- START: Lagre, Laste, Tømme funksjoner ---
    function saveData() {
        const dataToSave = {};
        document.querySelectorAll('input[type="text"], input[type="date"], input[type="checkbox"], select, textarea').forEach(el => {
            if (el.id) {
                if (el.type === 'checkbox') {
                    dataToSave[el.id] = el.checked;
                } else {
                    dataToSave[el.id] = el.value;
                }
            }
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
                    if (el.type === 'checkbox') {
                        el.checked = data[id];
                    } else {
                        el.value = data[id];
                    }
                }
            }
        }
    }
    
    function clearForm() {
        if (confirm("Are you sure you want to clear the form? All saved data will be deleted.")) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        }
    }

    function printPDF() {
        window.print();
    }
    
    function getSelectedText(selectId) {
        const selectElement = document.getElementById(selectId);
        if (selectElement && selectElement.selectedIndex >= 0 && selectElement.options[selectElement.selectedIndex]) {
            return selectElement.options[selectElement.selectedIndex].text;
        }
        return "";
    }
    
    function downloadCSV() {
        const orgName = document.getElementById('organisation-name').value || "UnknownOrganisation";
        const orgType = document.getElementById('organisation-type').value || "UnknownType";
        const dateValue = document.getElementById('assessment-date').value;
        let formattedDate = new Date().toLocaleDateString('no-NO').replace(/\./g, '-');
        if (dateValue) {
            try {
                const date = new Date(dateValue);
                const inputDay = String(date.getDate()).padStart(2, '0');
                const inputMonth = String(date.getMonth() + 1).padStart(2, '0');
                const inputYear = date.getFullYear();
                formattedDate = `${inputDay}-${inputMonth}-${inputYear}`;
            } catch (e) { /* Bruk default dato */ }
        }
        const fileName = `${orgName} - ${orgType} - MSAT - ${formattedDate}.csv`;

        const primaryHeaders = [
            'Organisation Name', 'Organisation type', 'Assessed By', 'Date', 'Empic ID',
            'Policy Avg', 'Risk Avg', 'Assurance Avg', 'Promotion Avg', 'Additional Avg',
            'Total Avg Score', 'Comments'
        ];
        
        let extensionPossibleHeader = [];
        let extensionData = [];
        let commentData = [`"${document.getElementById('comments').value.replace(/"/g, '""').replace(/\n/g, ' ')}"`];

        // Legg til FFO-spesifikke data HVIS i extension mode
        if (isExtensionMode) {
            const criticalMet = document.querySelector('#extension-checklist div:nth-child(1)').classList.contains('status-pass');
            const financialMet = document.querySelector('#extension-checklist div:nth-child(2)').classList.contains('status-pass');
            const level1Met = document.querySelector('#extension-checklist div:nth-child(3)').classList.contains('status-pass');
            const allMinimumMet = document.querySelector('#extension-checklist div:nth-child(4)').classList.contains('status-pass');
            const allConditionsMet = criticalMet && financialMet && level1Met && allMinimumMet;
            
            extensionPossibleHeader = ['Extension Possible'];
            extensionData = [allConditionsMet ? 'Yes' : 'No'];
            
            // Overskriv standard kommentar med FFO-kommentarer (som nå er borte, så vi beholder standard)
            // Siden FFO-kommentarfelt er fjernet, bruker vi bare standard-feltet som allerede er hentet.
        }

        const detailHeaders = fieldData.map(field => [`${field.label} (Choice)`, `${field.label} (Score)`]).flat();
        const allHeaders = primaryHeaders.concat(extensionPossibleHeader, detailHeaders);
        
        const primaryData = [
            `"${orgName.replace(/"/g, '""')}"`,
            `"${orgType.replace(/"/g, '""')}"`,
            `"${document.getElementById('assessed-by').value.replace(/"/g, '""')}"`,
            `"${dateValue}"`,
            `"${document.getElementById('empic-id').value.replace(/"/g, '""')}"`,
            document.getElementById('policy-avg').textContent,
            document.getElementById('risk-avg').textContent,
            document.getElementById('assurance-avg').textContent,
            document.getElementById('promotion-avg').textContent,
            document.getElementById('additional-avg').textContent,
            document.getElementById('total-gauge-avg-text').textContent,
            commentData[0] // Legg til standardkommentaren
        ];
        
        const detailData = fieldData.map(field => {
            const selectedText = getSelectedText(field.id);
            const scoreText = document.getElementById(field.id + '-value').textContent;
            return [`"${selectedText.replace(/"/g, '""')}"`, scoreText];
        }).flat();
        
        const allData = primaryData.concat(extensionData, detailData);
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
            try {
                const lines = e.target.result.split(/\r?\n/);
                if (lines.length < 2) throw new Error("CSV file is empty or invalid.");
                
                const headers = lines[0].split(';').map(h => parseCsvField(h));
                const data = lines[1].split(';').map(d => parseCsvField(d));
                const headerMap = Object.fromEntries(headers.map((h, i) => [h, i]));
                
                const getData = (headerName) => data[headerMap[headerName]] || '';

                document.getElementById('organisation-name').value = getData('Organisation Name');
                document.getElementById('organisation-type').value = getData('Organisation type');
                document.getElementById('assessed-by').value = getData('Assessed By');
                document.getElementById('assessment-date').value = getData('Date');
                document.getElementById('empic-id').value = getData('Empic ID');
                
                // Sett extension toggle basert på om CSV-en har FFO-data
                if (headerMap['Extension Possible'] !== undefined) {
                    document.getElementById('extension-toggle').checked = true;
                    toggleExtensionMode(true); // Tving FFO-modus
                } else {
                     document.getElementById('extension-toggle').checked = false;
                     toggleExtensionMode(false); // Tving standard-modus
                }

                fieldData.forEach(field => {
                    const select = document.getElementById(field.id);
                    if (select) {
                        const choiceHeader = `${field.label} (Choice)`;
                        const choiceValue = getData(choiceHeader);
                         if (choiceValue !== undefined) {
                            const option = Array.from(select.options).find(opt => opt.text === choiceValue);
                            select.value = option ? option.value : "";
                         }
                    }
                });

                document.getElementById('comments').value = getData('Comments');
                
                updateCalculations();
                alert("CSV file loaded successfully!");

            } catch (error) {
                 console.error("Error loading CSV file:", error);
                 alert(`Failed to load CSV file. Error: ${error.message}.`);
            } finally {
                 event.target.value = null;
            }
        };
        reader.onerror = function() {
            alert("Error reading the CSV file.");
            event.target.value = null;
        };
        reader.readAsText(file, "UTF-8");
    }
    // --- SLUTT: Lagre, Laste, Tømme funksjoner ---

    // --- START: Toggle-funksjon ---
    function toggleExtensionMode(isOn) {
        isExtensionMode = isOn;
        document.body.classList.toggle('extension-mode', isOn);
        document.getElementById('section-extension').style.display = isOn ? 'flex' : 'none';
        document.getElementById('extension-block-container').style.display = isOn ? 'block' : 'none';
        
        // Skjul/vis standard anbefalingstekst
        document.getElementById('total-score-comment').style.display = isOn ? 'none' : 'block';
        
        // Nullstill FFO-felt hvis modusen slås AV
        if (!isOn) {
            document.getElementById('q-financial-management').value = "";
            document.getElementById('q-level1-findings').value = "";
        }
        
        // Oppdater beregninger for å bytte visning
        updateCalculations();
    }
    // --- SLUTT: Toggle-funksjon ---

    async function init() {
        try {
            // Slå sammen scoring-regler fra begge filene
            const [scoringRes, msatRes, orgTypesRes, ffoScoringRes] = await Promise.all([
                fetch('data/scoring.json'),
                fetch('data/msat_data.json'),
                fetch('data/organisation_types.json'),
                fetch('data/scoring_ffo.json') // Antar en ny fil for FFO-scores
            ]);
            
            scoringRules = await scoringRes.json();
            const ffoScoring = await ffoScoringRes.json();
            // Slå sammen FFO-reglene inn i hoved-scoringRules
            scoringRules['extension-scores'] = ffoScoring['extension-scores'];
            
            msatData = await msatRes.json();
            const orgTypes = await orgTypesRes.json();
            
            populateOrgTypes(orgTypes);
        } catch (error) {
            console.error('Failed to load data files:', error);
            // Fallback til å laste FFO-scoring fra en hardkodet sti hvis den nye filen feiler
            try {
                 const ffoScoringRes = await fetch('../MSAT-FFO/data/scoring.json');
                 const ffoScoring = await ffoScoringRes.json();
                 scoringRules['extension-scores'] = ffoScoring['extension-scores'];
                 console.warn('Loaded FFO scoring from fallback path.');
            } catch (e) {
                 console.error('Could not load FFO scoring rules from any path.', e);
                 alert('ERROR: Could not load essential data files. The page cannot function.');
                 return;
            }
            // Last de andre filene selv om FFO-scoring feilet første gang
            try {
                if (!msatData.sections) {
                     const msatRes = await fetch('data/msat_data.json');
                     msatData = await msatRes.json();
                }
                if (document.getElementById('org-types-list').options.length === 0) {
                    const orgTypesRes = await fetch('data/organisation_types.json');
                    const orgTypes = await orgTypesRes.json();
                    populateOrgTypes(orgTypes);
                }
            } catch(e) {
                 console.error('Failed to load remaining data files:', e);
            }
        }

        buildForm(msatData);
        
        // Event Listeners for inputs
        document.querySelectorAll('input, textarea, select').forEach(el => {
            el.addEventListener('change', updateCalculations);
            if(el.tagName !== 'SELECT') {
                el.addEventListener('keyup', saveData);
            } else {
                 el.addEventListener('change', saveData);
            }
        });
        
        // Event Listener for Toggle
        const toggle = document.getElementById('extension-toggle');
        toggle.addEventListener('change', (e) => {
            toggleExtensionMode(e.target.checked);
            saveData(); // Lagre status for toggle
        });

        // Event Listeners for Popups
        document.addEventListener('click', (e) => {
            const popup = document.getElementById('details-popup');
            if (!popup) return;
            if (e.target.id === 'critical-items-link' && isExtensionMode) {
                e.preventDefault();
                showCriticalItemsPopup(e.target);
            } else if (e.target.matches('.popup-opener')) {
                showPopup(e.target);
            } else if (e.target.id === 'extension-help-icon' && isExtensionMode) {
                 showExtensionHelpPopup(e.target);
            } else if (e.target.id === 'popup-close-button') {
                hidePopup();
            } else if (popup.style.display === 'block' && !popup.contains(e.target) && !e.target.closest('.popup-opener, .help-icon, .critical-items-link')) {
                hidePopup();
            }
        });
        
        // Event Listeners for Knapper
        document.getElementById('clear-form-button').addEventListener('click', clearForm);
        document.getElementById('download-csv-button').addEventListener('click', downloadCSV);
        document.getElementById('print-pdf-button').addEventListener('click', printPDF);
        
        const loadCsvButton = document.getElementById('load-csv-button');
        const csvFileInput = document.getElementById('csv-file-input');
        loadCsvButton.addEventListener('click', () => csvFileInput.click());
        csvFileInput.addEventListener('change', loadCsvFile);

        // Last data og sett oppstarts-tilstand
        loadData();
        const savedToggleState = document.getElementById('extension-toggle').checked;
        toggleExtensionMode(savedToggleState); // Setter riktig modus basert på lagret data

        if (!document.getElementById('assessment-date').value) {
            document.getElementById('assessment-date').valueAsDate = new Date();
        }
        updateCalculations();
    }

    init();
});