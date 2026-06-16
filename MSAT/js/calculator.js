document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'msatData';
    let scoringRules = {};
    let msatData = {};
    let fieldData = [];
    let commentHelpData = {};
    const GAUGE_MAX_VALUE = 7;
    const criticalItemsIds = ['2.1.1', '2.2.1', '2.2.2', '3.2.1', '5.2.1', '5.2.2', '5.2.3', '5.2.4'];

    function isAirOpsProfile() {
        return (localStorage.getItem("msat_profile") || "Standard") === 'AirOps';
    }

    // Toggler visning av grensesnittet
    function toggleProfileViews() {
        const isAirOps = isAirOpsProfile();
        const extensionContainer = document.getElementById('extension-block-container');
        const airopsComments = document.getElementById('airops-comments-section');
        const standardComments = document.getElementById('standard-comments-section');
        const profileLabel = document.getElementById('current-profile-label');
        
        const opSelect = document.getElementById('operator-select');
        const opInput = document.getElementById('organisation-name');
        const toggleBtn = document.getElementById('toggle-manual-btn');

        if (profileLabel) profileLabel.textContent = isAirOps ? 'Air Operations / Aircrew' : 'Standard';
        if (extensionContainer) extensionContainer.style.display = isAirOps ? 'block' : 'none';
        if (airopsComments) airopsComments.style.display = isAirOps ? 'block' : 'none';
        if (standardComments) standardComments.style.display = isAirOps ? 'none' : 'block';

        // Styrer om operatørfeltet skal være nedtrekk eller tekstfelt
        if (isAirOps) {
            if(opInput) opInput.placeholder = "Enter manually (only if missing)";
            window.syncOperatorUI(); 
        } else {
            if(opSelect) opSelect.style.display = 'none';
            if(toggleBtn) toggleBtn.style.display = 'none';
            if(opInput) {
                opInput.style.display = 'block';
                opInput.placeholder = "Enter organisation name";
            }
        }
    }

    // --- START: OPERATØR HENTING OG FLETTE LOGIKK ---
    async function fetchAirOpsOperators() {
        try {
            // Henter lister fra både FixedWing og Rotor, slår dem sammen, og fjerner duplikater
            const [fwRes, rotorRes] = await Promise.all([
                fetch('../FixedWing/data/operators.json').then(r => r.ok ? r.json() : []),
                fetch('../Rotor/data/operators.json').then(r => r.ok ? r.json() : [])
            ]);
            
            const combined = [...fwRes, ...rotorRes];
            const uniqueOperators = [...new Set(combined)].sort((a, b) => a.localeCompare(b));
            
            const select = document.getElementById('operator-select');
            if (select) {
                select.innerHTML = '<option value="">Select operator...</option>'; 
                uniqueOperators.forEach(op => {
                    const option = document.createElement('option');
                    option.value = op;
                    option.textContent = op;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading AirOps operators:', error);
        }
    }

    function initOperatorLogic() {
        const opSelect = document.getElementById('operator-select');
        const opInput = document.getElementById('organisation-name');
        const toggleBtn = document.getElementById('toggle-manual-btn');

        if (!opSelect || !opInput || !toggleBtn) return;

        opSelect.addEventListener('change', (e) => {
            if (isAirOpsProfile()) {
                opInput.value = e.target.value;
                opInput.dispatchEvent(new Event('change'));
                saveData();
            }
        });

        toggleBtn.addEventListener('click', () => {
            if (!isAirOpsProfile()) return;

            if (opSelect.style.display !== 'none') {
                const confirmManual = confirm("Please check the list carefully first.\n\nAre you sure the operator is not there? Manual entry should ONLY be used if missing.");
                if (confirmManual) {
                    opSelect.style.display = 'none';
                    opSelect.value = ''; 
                    opInput.style.display = 'block';
                    opInput.value = ''; 
                    toggleBtn.innerHTML = '<i class="fa-solid fa-list"></i>';
                    toggleBtn.title = "Back to list";
                    toggleBtn.style.backgroundColor = '#03477F';
                    opInput.focus();
                }
            } else {
                opInput.style.display = 'none';
                opSelect.style.display = 'block';
                opInput.value = opSelect.value;
                toggleBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                toggleBtn.title = "Enter manually";
                toggleBtn.style.backgroundColor = '#6c757d';
                saveData();
            }
        });
    }

    window.syncOperatorUI = function() {
        if (!isAirOpsProfile()) return;

        const opSelect = document.getElementById('operator-select');
        const opInput = document.getElementById('organisation-name');
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
        } else if (opSelect && opInput && !opInput.value) {
            opSelect.value = '';
            opSelect.style.display = 'block';
            opInput.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
            toggleBtn.style.backgroundColor = '#6c757d';
        }
    };
    // --- SLUTT: OPERATØR HENTING OG LOGIKK ---

    async function safeFetchJson(url) {
        try {
            const res = await fetch(url);
            if (!res.ok) return null;
            const text = await res.text();
            if (text.trim().startsWith('<')) return null; 
            return JSON.parse(text);
        } catch (e) {
            return null;
        }
    }

    async function fetchConfigForProfile(profile) {
        try {
            scoringRules = await safeFetchJson('data/scoring.json');
            let currentMsatData = await safeFetchJson('data/msat_data.json');
            const orgTypes = await safeFetchJson('data/organisation_types.json');
            commentHelpData = await safeFetchJson('data/comment_help.json') || {};

            if (!scoringRules || !currentMsatData) {
                throw new Error("Mangler scoring.json eller msat_data.json");
            }

            populateOrgTypes(orgTypes || []);

            // Fletter inn AirOps
            if (profile === 'AirOps') {
                const extensionData = await safeFetchJson('data/AirOps/extension.json');
                if (extensionData) {
                    extensionData.sections.forEach(extSection => {
                        let baseSection = currentMsatData.sections.find(s => 
                            (s.id && s.id === extSection.id) || 
                            (s.number && s.number === extSection.number)
                        );
                        if (baseSection) {
                            extSection.subsections.forEach(extSub => {
                                let baseSub = baseSection.subsections.find(s => 
                                    s.id && (s.id === extSub.id || s.id.includes("5.1"))
                                );
                                if (baseSub) {
                                    baseSub.items = baseSub.items.concat(extSub.items);
                                } else {
                                    baseSection.subsections.push(extSub);
                                }
                            });
                        }
                    });
                }
            }
            
            msatData = currentMsatData;
            
            toggleProfileViews();
            buildForm(msatData);
            loadData();
            window.syncOperatorUI(); 
            updateCalculations();
            
        } catch (error) {
            console.error(`Feil ved lasting av profil: ${profile}`, error);
        }
    }

    window.addEventListener('msatProfileChanged', () => {
        const newProfile = localStorage.getItem("msat_profile") || "Standard";
        fetchConfigForProfile(newProfile);
    });

    function buildExtensionSection() {
        const container = document.getElementById('main-container');
        const column2 = container.querySelector('.column:last-child');
        if (!column2) return;
        
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
        fieldData = [];
        
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
                    fieldData.push({ id: selectId, label: `${item.id} ${item.text}`, section: section.id, itemId: item.id });
                    
                    const isCritical = criticalItemsIds.includes(item.id);
                    const starHtml = isCritical ? ' <span class="critical-marker">*</span>' : '';
                    
                    sectionContentHtml += `
                        <div class="form-row">
                            <div class="form-cell">
                                <span data-item-id="${item.id}" class="popup-opener">
                                    <strong>${item.id}</strong> ${item.text}
                                </span>
                                ${starHtml}
                            </div>
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
            if (["1", "2"].includes(section.number)) { column1.appendChild(sectionEl); } else { column2.appendChild(sectionEl); }
        });
        
        container.appendChild(column1);
        container.appendChild(column2);
        
        if (isAirOpsProfile()) {
            buildExtensionSection();
        }

        document.querySelectorAll('select').forEach(el => {
            if (el.id !== 'msat-profile-selector') {
                el.addEventListener('change', updateCalculations);
                el.addEventListener('change', saveData);
            }
        });
    }

    function updateCalculations() {
        let sums = { policy: 0, risk: 0, assurance: 0, promotion: 0, additional: 0 };
        let counts = { policy: 0, risk: 0, assurance: 0, promotion: 0, additional: 0 };
        let allMinimumScoreMet = true;

        fieldData.forEach(field => {
            const select = document.getElementById(field.id);
            const valueCell = document.getElementById(field.id + '-value');
            if (select && valueCell) {
                const score = scoringRules['generic-score']?.[select.value] ?? null;
                applyValueCellStyle(valueCell, score);
                if (score !== null) {
                    sums[field.section] += score;
                    counts[field.section]++;
                    if (score < 4) {
                        allMinimumScoreMet = false;
                    }
                }
            }
        });

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
        const totalGaugeEl = document.getElementById('total-gauge-avg-text');
        if(totalGaugeEl) totalGaugeEl.textContent = grandTotalAvg.toFixed(1);
        updateGauge('total', grandTotalAvg, GAUGE_MAX_VALUE);

        if (isAirOpsProfile()) {
            const financialSelect = document.getElementById('q-financial-management');
            const level1Select = document.getElementById('q-level1-findings');
            if(financialSelect && level1Select) {
                const financialScore = scoringRules['extension-scores']?.financial?.[financialSelect.value] ?? null;
                const level1Score = scoringRules['extension-scores']?.level1?.[level1Select.value] ?? null;
                
                applyValueCellStyle(document.getElementById('q-financial-management-value'), financialScore);
                applyValueCellStyle(document.getElementById('q-level1-findings-value'), level1Score);

                const criticalItemsMet = criticalItemsIds.every(id => {
                    const cell = document.getElementById(`q${id.replace(/\./g, '-')}-value`);
                    return cell && parseInt(cell.textContent) === 7;
                });
                const financialMet = financialScore !== null && financialScore >= 4;
                const level1Met = level1Score !== null && level1Score === 7;

                const allConditionsMet = criticalItemsMet && financialMet && level1Met && allMinimumScoreMet;
                updateExtensionChecklist(criticalItemsMet, financialMet, level1Met, allMinimumScoreMet, allConditionsMet);
            }
        }
        
        saveData();
    }

    function updateExtensionChecklist(criticalMet, financialMet, level1Met, allMinimumMet, allConditionsMetUpdated) {
        const checklistContainer = document.getElementById('extension-checklist');
        const finalCommentEl = document.getElementById('extension-final-comment');
        if(!checklistContainer || !finalCommentEl) return;

        const getClass = (met) => met ? 'status-pass' : 'status-fail';
        const getIcon = (met) => met ? 'fa-circle-check' : 'fa-circle-xmark';

        checklistContainer.innerHTML = `
            <div class="${getClass(criticalMet)}"><i class="fa-solid ${getIcon(criticalMet)}"></i><span>All 8 <a href="#" id="critical-items-link" class="critical-items-link">critical items</a><span class="critical-marker">*</span> have a score of 7</span></div>
            <div class="${getClass(financialMet)}"><i class="fa-solid ${getIcon(financialMet)}"></i><span>Financial management score is 4 or higher</span></div>
            <div class="${getClass(level1Met)}"><i class="fa-solid ${getIcon(level1Met)}"></i><span>No level 1 findings in the last 24 months</span></div>
            <div class="${getClass(allMinimumMet)}"><i class="fa-solid ${getIcon(allMinimumMet)}"></i><span>All other items have a minimum score of 4</span></div>`;

        if (allConditionsMetUpdated) {
            finalCommentEl.textContent = "Extension of oversight cycle may be considered (36 months).";
            finalCommentEl.className = "extension-block-comment final-pass";
        } else {
            finalCommentEl.textContent = "Standard oversight cycle (24 months).";
            finalCommentEl.className = "extension-block-comment final-neutral";
        }
    }

    function applyValueCellStyle(valueCell, score) {
        if(!valueCell) return;
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
                        <ul><li>2.1.1, 2.2.1, 2.2.2</li><li>3.2.1</li><li>5.2.1, 5.2.2, 5.2.3, 5.2.4</li></ul>
                    </li>
                    <li><strong>Financial Management</strong> score must be at least <strong>4 (Acceptable)</strong>.</li>
                    <li><strong>Level 1 Findings</strong> score must be <strong>7 (No findings)</strong>.</li>
                    <li><strong>All other items</strong> must have a minimum score of <strong>4 (Operating)</strong>. N/A is acceptable.</li>
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

    function showCommentPopup(targetElement, fieldKey) {
        const popup = document.getElementById('details-popup');
        const text = commentHelpData[fieldKey] || "Ingen informasjon tilgjengelig.";
        popup.innerHTML = `
            <button id="popup-close-button" aria-label="Close">&times;</button>
            <div class="popup-section">${text}</div>
        `;
        displayPopup(popup, targetElement);
    }

    function displayPopup(popup, targetElement) {
        popup.style.display = 'block';
        const rect = targetElement.getBoundingClientRect();
        let top = rect.bottom + window.scrollY + 5;
        let left = rect.left + window.scrollX;

        if (left + popup.offsetWidth > window.innerWidth) left = window.innerWidth - popup.offsetWidth - 20; 
        if (top + popup.offsetHeight > window.innerHeight + window.scrollY) top = rect.top + window.scrollY - popup.offsetHeight - 5; 

        popup.style.top = `${top}px`;
        popup.style.left = `${left}px`;
    }

    function hidePopup() {
        document.getElementById('details-popup').style.display = 'none';
    }

    function saveData() {
        const dataToSave = {};
        document.querySelectorAll('input, select, textarea').forEach(el => {
            if (el.id && el.id !== 'msat-profile-selector' && el.id !== 'operator-select') {
                dataToSave[el.id] = el.value;
            }
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }

    function loadData() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                for (const id in data) {
                    const el = document.getElementById(id);
                    if (el && id !== 'msat-profile-selector' && id !== 'operator-select') {
                        el.value = data[id];
                    }
                }
            } catch (e) {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }

    function clearForm() {
        if (confirm("Are you sure you want to clear the form? All saved data will be deleted.")) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        }
    }

    function printPDF() { window.print(); }

    function getSelectedText(selectId) {
        const selectElement = document.getElementById(selectId);
        if (selectElement && selectElement.selectedIndex >= 0) return selectElement.options[selectElement.selectedIndex]?.text || "";
        return "";
    }

    function downloadCSV() {
        const orgName = document.getElementById('organisation-name').value || "UnknownOrganisation";
        const orgType = document.getElementById('organisation-type').value || "UnknownType";
        const dateValue = document.getElementById('assessment-date').value;
        let formattedDate = "";
        try {
            if (dateValue) {
                const date = new Date(dateValue);
                formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
            } else {
                formattedDate = new Date().toLocaleDateString('no-NO').replace(/\./g, '-');
            }
        } catch (e) { formattedDate = new Date().toLocaleDateString('no-NO'); }
        
        const fileName = `${orgName} - ${orgType} - MSAT - ${formattedDate}.dat`;
        const isAirOps = isAirOpsProfile();

        const primaryHeaders = ['Organisation Name', 'Organisation type', 'Assessed By', 'Date', 'Empic ID', 'Policy Avg', 'Risk Avg', 'Assurance Avg', 'Promotion Avg', 'Additional Avg', 'Total Avg Score'];
        const detailHeaders = fieldData.map(field => [`${field.label} (Choice)`, `${field.label} (Score)`]).flat();
        const escapeCsv = (str) => `"${(str || '').replace(/"/g, '""')}"`;
        const escapeCsvMultiline = (str) => `"${(str || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;

        const primaryData = [
            escapeCsv(orgName), escapeCsv(orgType), escapeCsv(document.getElementById('assessed-by').value),
            escapeCsv(dateValue), escapeCsv(document.getElementById('empic-id').value),
            document.getElementById('policy-avg').textContent, document.getElementById('risk-avg').textContent,
            document.getElementById('assurance-avg').textContent, document.getElementById('promotion-avg').textContent,
            document.getElementById('additional-avg').textContent, document.getElementById('total-gauge-avg-text').textContent
        ];

        let allHeaders = [], allData = [];

        if (isAirOps) {
            const criticalMet = document.querySelector('#extension-checklist div:nth-child(1)')?.classList.contains('status-pass') || false;
            const financialMet = document.querySelector('#extension-checklist div:nth-child(2)')?.classList.contains('status-pass') || false;
            const level1Met = document.querySelector('#extension-checklist div:nth-child(3)')?.classList.contains('status-pass') || false;
            const allMinimumMet = document.querySelector('#extension-checklist div:nth-child(4)')?.classList.contains('status-pass') || false;
            const extensionPossible = (criticalMet && financialMet && level1Met && allMinimumMet) ? 'Yes' : 'No';

            const commentFields = [
                { id: 'comments-compliance', header: 'Comments (Compliance)' }, { id: 'comments-flightops', header: 'Comments (Flight Ops)' },
                { id: 'comments-safety', header: 'Comments (Safety Dept)' }, { id: 'comments-training', header: 'Comments (Training)' },
                { id: 'comments-planning', header: 'Comments (Planning & FTL)' }, { id: 'comments-reporting', header: 'Comments (Reporting)' },
                { id: 'comments-other', header: 'Comments (Other)' }
            ];
            const extensionHeaders = ['Extension Possible', ...commentFields.map(f => f.header), ...detailHeaders, '6.1 Financial management (Choice)', '6.1 Financial management (Score)', '6.2 Level 1 findings (Choice)', '6.2 Level 1 findings (Score)'];
            allHeaders = primaryHeaders.concat(extensionHeaders);

            const commentData = commentFields.map(field => escapeCsvMultiline(document.getElementById(field.id)?.value));
            const extensionData = [escapeCsv(getSelectedText('q-financial-management')), document.getElementById('q-financial-management-value')?.textContent, escapeCsv(getSelectedText('q-level1-findings')), document.getElementById('q-level1-findings-value')?.textContent];
            const detailData = fieldData.map(field => [escapeCsv(getSelectedText(field.id)), document.getElementById(field.id + '-value').textContent]).flat();
            
            allData = primaryData.concat([extensionPossible], commentData, detailData, extensionData);
        } else {
            allHeaders = primaryHeaders.concat(['Comments'], detailHeaders);
            const standardComment = escapeCsvMultiline(document.getElementById('comments')?.value);
            const detailData = fieldData.map(field => [escapeCsv(getSelectedText(field.id)), document.getElementById(field.id + '-value').textContent]).flat();
            allData = primaryData.concat([standardComment], detailData);
        }

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
        URL.revokeObjectURL(url); 
    }

     function loadCsvFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const lines = e.target.result.split(/\r?\n/);
                if (lines.length < 2) throw new Error("CSV file is empty or invalid.");
                if (lines[0].charCodeAt(0) === 0xFEFF) lines[0] = lines[0].slice(1);

                const parseCsvField = (field) => {
                    field = field ? field.trim() : '';
                    if (field.startsWith('"') && field.endsWith('"')) field = field.substring(1, field.length - 1).replace(/""/g, '"');
                    return field;
                };

                const splitCSV = (str) => str.split(/;(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                const headers = splitCSV(lines[0]).map(h => parseCsvField(h));
                const data = splitCSV(lines[1]).map(d => parseCsvField(d));
                const headerMap = Object.fromEntries(headers.map((h, i) => [h, i]));
                const getData = (headerName) => data[headerMap[headerName]] || '';

                document.getElementById('organisation-name').value = getData('Organisation Name');
                document.getElementById('organisation-type').value = getData('Organisation type');
                document.getElementById('assessed-by').value = getData('Assessed By');
                document.getElementById('assessment-date').value = getData('Date');
                document.getElementById('empic-id').value = getData('Empic ID');

                fieldData.forEach(field => {
                    const select = document.getElementById(field.id);
                    if (select) {
                        const choiceValue = getData(`${field.label} (Choice)`);
                         if (choiceValue) {
                            const option = Array.from(select.options).find(opt => opt.text === choiceValue);
                            select.value = option ? option.value : "";
                         }
                    }
                });

                if(isAirOpsProfile()) {
                    const finSelect = document.getElementById('q-financial-management');
                    const levSelect = document.getElementById('q-level1-findings');
                    if (finSelect) finSelect.value = Array.from(finSelect.options).find(opt => opt.text === getData('6.1 Financial management (Choice)'))?.value || "";
                    if (levSelect) levSelect.value = Array.from(levSelect.options).find(opt => opt.text === getData('6.2 Level 1 findings (Choice)'))?.value || "";
                    
                    ['compliance', 'flightops', 'safety', 'training', 'planning', 'reporting', 'other'].forEach(field => {
                        const ta = document.getElementById(`comments-${field}`);
                        if(ta) ta.value = getData(`Comments (${field.charAt(0).toUpperCase() + field.slice(1).replace('ops','Ops').replace('dept','Dept')})`);
                    });
                } else {
                    const ta = document.getElementById('comments');
                    if(ta) ta.value = getData('Comments');
                }

                window.syncOperatorUI();
                updateCalculations();
                alert("CSV file loaded successfully!");
            } catch (error) {
                 alert(`Failed to load CSV file. Error: ${error.message}`);
            } finally {
                 event.target.value = null;
            }
        };
        reader.readAsText(file, "UTF-8");
    }

    async function init() {
        await fetchAirOpsOperators();
        initOperatorLogic();

        const currentProfile = localStorage.getItem("msat_profile") || "Standard";
        await fetchConfigForProfile(currentProfile);

        document.querySelectorAll('input, textarea').forEach(el => {
             el.addEventListener('keyup', saveData); 
             el.addEventListener('change', saveData); 
        });

        document.addEventListener('click', (e) => {
            const popup = document.getElementById('details-popup');
            if (!popup) return; 

            if (e.target.classList.contains('comment-help-icon')) {
                e.preventDefault();
                showCommentPopup(e.target, e.target.getAttribute('data-field'));
            }
            else if (e.target.id === 'critical-items-link') {
                e.preventDefault(); 
                showCriticalItemsPopup(e.target);
            } else if (e.target.closest('.popup-opener')) {
                showPopup(e.target.closest('.popup-opener'));
            } else if (e.target.id === 'extension-help-icon') {
                 showExtensionHelpPopup(e.target);
            } else if (e.target.id === 'popup-close-button') {
                hidePopup();
            } else if (popup.style.display === 'block' && !popup.contains(e.target) && !e.target.closest('.popup-opener, .help-icon, .critical-items-link, .comment-help-icon')) {
                hidePopup();
            }
        });

        const clearBtn = document.getElementById('clear-form-button');
        if(clearBtn) clearBtn.addEventListener('click', clearForm);
        const dlBtn = document.getElementById('download-csv-button');
        if(dlBtn) dlBtn.addEventListener('click', downloadCSV);
        const prtBtn = document.getElementById('print-pdf-button');
        if(prtBtn) prtBtn.addEventListener('click', printPDF);

        const loadCsvButton = document.getElementById('load-csv-button');
        const csvFileInput = document.getElementById('csv-file-input');
        if (loadCsvButton && csvFileInput) {
            loadCsvButton.addEventListener('click', () => csvFileInput.click());
            csvFileInput.addEventListener('change', loadCsvFile);
        }

        const dateInput = document.getElementById('assessment-date');
        if (dateInput && !dateInput.value) {
             dateInput.valueAsDate = new Date();
             saveData();
        }
        
        window.syncOperatorUI();
        updateCalculations();
    }

    init(); 
});