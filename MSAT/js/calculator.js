document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'msatData';
    let scoringRules = {};
    let msatData = {};
    let fieldData = [];
    let commentHelpData = {};
    let msatDataNo = null;          // Norske oversettelser (samme struktur/ids som msat_data.json)
    let noSectionTitleById = {};    // seksjon-id -> norsk tittel
    let noItemById = {};            // punkt-id -> { text, details }
    const GAUGE_MAX_VALUE = 7;
    const criticalItemsIds = ['2.1.1', '2.2.1', '2.2.2', '3.2.1', '5.2.1', '5.2.2', '5.2.3', '5.2.4'];

    // Oversettelses-hjelper. window.I18n finnes ved kjøretid (i18n.js lastes før navbar.js).
    const t = (key) => (window.I18n ? window.I18n.t(key) : key);
    const isNo = () => (window.I18n ? window.I18n.getLang() : 'en') === 'no';

    // Bygg oppslagsindeks fra den norske datafila (kalles etter at den er lastet).
    function buildNoIndex() {
        noSectionTitleById = {};
        noItemById = {};
        if (!msatDataNo || !Array.isArray(msatDataNo.sections)) return;
        msatDataNo.sections.forEach(s => {
            if (s.id) noSectionTitleById[s.id] = s.title;
            (s.subsections || []).forEach(ss => (ss.items || []).forEach(it => {
                if (it.id) noItemById[it.id] = it;
            }));
        });
    }

    function isAirOpsProfile() {
        return (localStorage.getItem("msat_profile") || "AirOps") === 'AirOps';
    }

    function toggleProfileViews() {
        const isAirOps = isAirOpsProfile();
        const extensionContainer = document.getElementById('extension-block-container');
        const airopsComments = document.getElementById('airops-comments-section');
        const standardComments = document.getElementById('standard-comments-section');
        const profileLabel = document.getElementById('current-profile-label');
        
        const opSelect = document.getElementById('operator-select');
        const opInput = document.getElementById('organisation-name');
        const toggleBtn = document.getElementById('toggle-manual-btn');

        if (profileLabel) profileLabel.textContent = isAirOps ? t('msat.profileLabelAirOps') : t('msat.profileLabelStandard');
        if (extensionContainer) extensionContainer.style.display = isAirOps ? 'block' : 'none';
        if (airopsComments) airopsComments.style.display = isAirOps ? 'block' : 'none';
        if (standardComments) standardComments.style.display = isAirOps ? 'none' : 'block';

        if (isAirOps) {
            if(opInput) opInput.placeholder = t('msat.orgNameManualPlaceholder');
            window.syncOperatorUI();
        } else {
            if(opSelect) opSelect.style.display = 'none';
            if(toggleBtn) toggleBtn.style.display = 'none';
            if(opInput) {
                opInput.style.display = 'block';
                opInput.placeholder = t('msat.orgNamePlaceholder');
            }
        }
    }

    async function fetchAirOpsOperators() {
        try {
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
                const confirmManual = confirm(t('msat.dialog.manualConfirm'));
                if (confirmManual) {
                    opSelect.style.display = 'none';
                    opSelect.value = '';
                    opInput.style.display = 'block';
                    opInput.value = '';
                    toggleBtn.innerHTML = '<i class="fa-solid fa-list"></i>';
                    toggleBtn.title = t('msat.tooltipBackToList');
                    toggleBtn.style.backgroundColor = '#03477F';
                    opInput.focus();
                }
            } else {
                opInput.style.display = 'none';
                opSelect.style.display = 'block';
                opInput.value = opSelect.value;
                toggleBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                toggleBtn.title = t('msat.tooltipEnterManually');
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
            msatDataNo = await safeFetchJson('data/msat_data.no.json');
            buildNoIndex();

            if (!scoringRules || !currentMsatData) {
                throw new Error("Mangler scoring.json eller msat_data.json");
            }

            populateOrgTypes(orgTypes || []);
            
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
        const newProfile = localStorage.getItem("msat_profile") || "AirOps";
        fetchConfigForProfile(newProfile);
    });

    // Ved språkbytte: re-oversett statisk tekst og bygg HELE skjemaet på nytt
    // (samme trygge vei som ved profilbytte). Svar beholdes via localStorage (loadData).
    window.addEventListener('languageChanged', () => {
        if (window.I18n) window.I18n.apply();
        const profile = localStorage.getItem("msat_profile") || "AirOps";
        fetchConfigForProfile(profile);
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
                <span>6. ${t('msat.ext.sectionTitle')}</span>
                <i class="fa-solid fa-circle-question help-icon" id="extension-help-icon"></i>
            </div>
            <div class="section-content">
                <div class="header-row"><div class="header-cell">${t('msat.form.criteria')}</div><div class="header-cell">${t('msat.form.selection')}</div><div class="header-cell">${t('msat.form.score')}</div></div>
                <div class="form-row">
                    <div class="form-cell"><strong>6.1</strong> ${t('msat.ext.financialLabel')}</div>
                    <div class="form-cell"><select id="q-financial-management"><option value="">Select...</option><option value="7">Good (7)</option><option value="4">Acceptable (4)</option><option value="1">Poor/Concern (1)</option></select></div>
                    <div class="form-cell calculated-value" id="q-financial-management-value">0</div>
                </div>
                <div class="form-row">
                    <div class="form-cell"><strong>6.2</strong> ${t('msat.ext.level1Label')}</div>
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
            // Vis oversatt tittel når NO er valgt; fall tilbake til engelsk.
            const sectionTitle = (isNo() && noSectionTitleById[section.id]) || section.title;
            let sectionContentHtml = `<div class="section-header"><i class="fa-solid ${section.icon}"></i><span>${section.number}. ${sectionTitle}</span></div><div class="section-content"><div class="header-row"><div class="header-cell">${t('msat.form.criteria')}</div><div class="header-cell">${t('msat.form.selection')}</div><div class="header-cell">${t('msat.form.score')}</div></div>`;

            section.subsections.forEach(subsection => {
                subsection.items.forEach(item => {
                    const selectId = `q${item.id.replace(/\./g, '-')}`;
                    // VIKTIG: label holdes på engelsk – den styrer CSV-kolonnene og -innlasting.
                    fieldData.push({ id: selectId, label: `${item.id} ${item.text}`, section: section.id, itemId: item.id });

                    const noItem = isNo() ? noItemById[item.id] : null;
                    const itemText = (noItem && noItem.text) || item.text;

                    const isCritical = criticalItemsIds.includes(item.id);
                    const starHtml = isCritical ? ' <span class="critical-marker">*</span>' : '';

                    sectionContentHtml += `
                        <div class="form-row">
                            <div class="form-cell">
                                <span data-item-id="${item.id}" class="popup-opener">
                                    <strong>${item.id}</strong> ${itemText}
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

                // Tell opp antall critical items med score 7
                let criticalItemsWith7 = 0;
                criticalItemsIds.forEach(id => {
                    const cell = document.getElementById(`q${id.replace(/\./g, '-')}-value`);
                    if (cell && parseInt(cell.textContent) === 7) {
                        criticalItemsWith7++;
                    }
                });
                
                const criticalItemsMet = (criticalItemsWith7 === criticalItemsIds.length);
                const financialMet = financialScore !== null && financialScore >= 4;
                const level1Met = level1Score !== null && level1Score === 7;

                const allConditionsMet = criticalItemsMet && financialMet && level1Met && allMinimumScoreMet;
                // Send med antallet (criticalItemsWith7) til neste funksjon
                updateExtensionChecklist(criticalItemsMet, financialMet, level1Met, allMinimumScoreMet, allConditionsMet, criticalItemsWith7);
            }
        }
        
        saveData();
    }

    function updateExtensionChecklist(criticalMet, financialMet, level1Met, allMinimumMet, allConditionsMetUpdated, criticalItemsCount = 0) {
        const checklistContainer = document.getElementById('extension-checklist');
        const finalCommentEl = document.getElementById('extension-final-comment');
        if(!checklistContainer || !finalCommentEl) return;

        const getClass = (met) => met ? 'status-pass' : 'status-fail';
        const getIcon = (met) => met ? 'fa-circle-check' : 'fa-circle-xmark';

        checklistContainer.innerHTML = `
            <div class="${getClass(criticalMet)}"><i class="fa-solid ${getIcon(criticalMet)}"></i><span>${criticalItemsCount} ${t('msat.checklist.critOf')} ${criticalItemsIds.length} <a href="#" id="critical-items-link" class="critical-items-link">${t('msat.checklist.critLink')}</a><span class="critical-marker">*</span> ${t('msat.checklist.critSuffix')}</span></div>
            <div class="${getClass(financialMet)}"><i class="fa-solid ${getIcon(financialMet)}"></i><span>${t('msat.checklist.financial')}</span></div>
            <div class="${getClass(level1Met)}"><i class="fa-solid ${getIcon(level1Met)}"></i><span>${t('msat.checklist.level1')}</span></div>
            <div class="${getClass(allMinimumMet)}"><i class="fa-solid ${getIcon(allMinimumMet)}"></i><span>${t('msat.checklist.allOther')}</span></div>`;

        if (allConditionsMetUpdated) {
            finalCommentEl.textContent = t('msat.checklist.finalPass');
            finalCommentEl.className = "extension-block-comment final-pass";
        } else {
            finalCommentEl.textContent = t('msat.checklist.finalNeutral');
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
            // Scoringsbegrepene Present/Suitable/Operating/Effective er etiketter og holdes
            // uendret. Selve hjelpeteksten/innholdet vises oversatt når NO er valgt, med
            // engelsk fallback per felt.
            const notSpecified = t('msat.popup.notSpecified');
            const noItem = isNo() ? noItemById[itemId] : null;
            const enD = itemData.details || {};
            const noD = (noItem && noItem.details) || {};
            const detail = (k) => (isNo() ? (noD[k] || enD[k]) : enD[k]) || notSpecified;
            const itemText = (noItem && noItem.text) || itemData.text;

            const wtl = (isNo() && noD.whatToLookFor) ? noD.whatToLookFor : enD.whatToLookFor;
            let whatToLookForHtml = '';
            if (Array.isArray(wtl)) {
                whatToLookForHtml = '• ' + wtl.join('<br>• ');
            } else {
                whatToLookForHtml = wtl || notSpecified;
            }

            popup.innerHTML = `
                <button id="popup-close-button" aria-label="Close">&times;</button>
                <h4>${itemData.id} ${itemText}</h4>
                <div class="popup-section"><strong>Present:</strong> ${detail('Present')}</div>
                <div class="popup-section"><strong>Suitable:</strong> ${detail('Suitable')}</div>
                <div class="popup-section"><strong>Operating:</strong> ${detail('Operating')}</div>
                <div class="popup-section"><strong>Effective:</strong> ${detail('Effective')}</div>
                <hr>
                <div class="popup-section"><strong>${t('msat.popup.whatToLookFor')}</strong><br>${whatToLookForHtml}</div>`;
            displayPopup(popup, targetElement);
        }
    }

    function showExtensionHelpPopup(targetElement) {
        const popup = document.getElementById('details-popup');
        const t = window.I18n ? window.I18n.t : (k => k);
        popup.innerHTML = `
            <button id="popup-close-button" aria-label="Close">&times;</button>
            <h4>${t('msat.ext.title')}</h4>
            <div class="popup-section">${t('msat.ext.intro')}
                <ul>
                    <li>${t('msat.ext.scoreItems')}
                        <ul><li>2.1.1, 2.2.1, 2.2.2</li><li>3.2.1</li><li>5.2.1, 5.2.2, 5.2.3, 5.2.4</li></ul>
                    </li>
                    <li>${t('msat.ext.financial')}</li>
                    <li>${t('msat.ext.level1')}</li>
                    <li>${t('msat.ext.allOther')}</li>
                </ul>
            </div>`;
        displayPopup(popup, targetElement);
    }

    function showCriticalItemsPopup(targetElement) {
        const popup = document.getElementById('details-popup');
        let listHtml = criticalItemsIds.map(id => {
            const field = fieldData.find(f => f.itemId === id);
            const text = field ? field.label.replace(/^\S+\s*/, '') : '';
            return `<li><strong>${id}</strong> ${text}</li>`;
        }).join('');
        const t = window.I18n ? window.I18n.t : (k => k);
        popup.innerHTML = `
            <button id="popup-close-button" aria-label="Close">&times;</button>
            <h4>${t('msat.crit.title')}</h4>
            <div class="popup-section critical-items-list">${t('msat.crit.intro')}
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
        if (confirm(t('msat.dialog.clearConfirm'))) {
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
                if (lines.length < 2) throw new Error(t('msat.dialog.csvEmpty'));
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
                alert(t('msat.dialog.csvLoaded'));
            } catch (error) {
                 alert(t('msat.dialog.csvFailedPrefix') + error.message);
            } finally {
                 event.target.value = null;
            }
        };
        reader.readAsText(file, "UTF-8");
    }

    async function init() {
        await fetchAirOpsOperators();
        initOperatorLogic();

        const currentProfile = localStorage.getItem("msat_profile") || "AirOps";
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
                showCriticalItemsPopup(e.target); // Beholder infoboksen i tillegg
                
                // Kjør gjennom alle de kritiske punktene og lys dem opp
                criticalItemsIds.forEach(id => {
                    const selectId = `q${id.replace(/\./g, '-')}`;
                    const selectElement = document.getElementById(selectId);
                    const valueCell = document.getElementById(`${selectId}-value`);
                    
                    if (selectElement && valueCell) {
                        // Finn raden (.form-row) elementet ligger i
                        const row = selectElement.closest('.form-row');
                        if (row) {
                            const isSeven = parseInt(valueCell.textContent) === 7;
                            
                            // Finn ut om den skal lyse grønt eller rødt
                            const highlightClass = isSeven ? 'highlight-green' : 'highlight-red';
                            
                            // Legg til class
                            row.classList.add(highlightClass);
                            
                            // Fjern class etter 2 sekunder (2000 ms)
                            setTimeout(() => {
                                row.classList.remove('highlight-green', 'highlight-red');
                            }, 2000);
                        }
                    }
                });
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