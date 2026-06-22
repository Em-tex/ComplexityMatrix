document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'msatData';
    let scoringRules = {};
    let msatData = {};
    let fieldData = [];
    let commentHelpData = {};       // Norske hjelpetekster (original)
    let commentHelpDataEn = {};      // Engelske hjelpetekster (oversettelse)
    let msatDataNo = null;          // Norske oversettelser (samme struktur/ids som msat_data.json)
    let noSectionTitleById = {};    // seksjon-id -> norsk tittel
    let noItemById = {};            // punkt-id -> { text, details }
    const GAUGE_MAX_VALUE = 7;
    const criticalItemsIds = ['2.1.1', '2.2.1', '2.2.2', '3.2.1', '5.2.1', '5.2.2', '5.2.3', '5.2.4'];

    // De 8 kritiske punktene delt i tre underkategorier (vises som egne linjer i
    // forlengelse-sjekklista). Til sammen = criticalItemsIds.
    const criticalGroups = [
        { ids: ['2.1.1', '2.2.1', '2.2.2'], labelKey: 'msat.checklist.groupRisk' },
        { ids: ['3.2.1'], labelKey: 'msat.checklist.groupChange' },
        { ids: ['5.2.1', '5.2.2', '5.2.3', '5.2.4'], labelKey: 'msat.checklist.groupFindings' }
    ];

    // Forlengelse-punktene (seksjon 6) har ogsaa begrunnelse per rad, paa linje med
    // matrisepunktene 1-5. Brukes kun naar Air Operations er valgt.
    const extensionFields = [
        { id: 'q-financial-management', itemId: '6.1', labelKey: 'msat.ext.financialLabel' },
        // "Nei" (verdi 7 = ingen funn) krever ingen begrunnelse; kun "Ja" (verdi 1).
        { id: 'q-level1-findings', itemId: '6.2', labelKey: 'msat.ext.level1Label', skipCommentValues: ['7'] }
    ];

    // Antall av de gitte punktene som har score 7 (leses fra poengcellene i skjemaet).
    function countAtSeven(ids) {
        return ids.filter(id => {
            const cell = document.getElementById(`q${id.replace(/\./g, '-')}-value`);
            return cell && parseInt(cell.textContent, 10) === 7;
        }).length;
    }

    // Lys opp radene til de gitte punktene (gronn ved score 7, ellers rod).
    function highlightRows(ids) {
        ids.forEach(id => {
            const selectId = `q${id.replace(/\./g, '-')}`;
            const valueCell = document.getElementById(`${selectId}-value`);
            const selectElement = document.getElementById(selectId);
            if (!selectElement || !valueCell) return;
            const row = selectElement.closest('.form-row');
            if (!row) return;
            const cls = parseInt(valueCell.textContent, 10) === 7 ? 'highlight-green' : 'highlight-red';
            row.classList.add(cls);
            setTimeout(() => row.classList.remove('highlight-green', 'highlight-red'), 4000);
        });
    }

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

    // Rettigheter: organisasjonen kan ha flere. Air Operations har egen fane med
    // forlengelses-innhold; ovrige rettigheter faar en placeholder-fane.
    const AIROPS_RIGHT = 'Air Operations';
    let availableRights = [];

    function getSelectedRights() {
        const menu = document.getElementById('rights-menu');
        if (!menu) return [];
        return Array.from(menu.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    }

    function isAirOpsSelected() {
        return getSelectedRights().includes(AIROPS_RIGHT);
    }

    function slugifyRight(name) {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    // Synk org.navn-feltet: operatorliste naar Air Operations er valgt, ellers fritekst.
    function syncOrgNameInput() {
        const opSelect = document.getElementById('operator-select');
        const opInput = document.getElementById('organisation-name');
        const toggleBtn = document.getElementById('toggle-manual-btn');
        if (!opInput) return;

        if (isAirOpsSelected()) {
            opInput.placeholder = t('msat.orgNameManualPlaceholder');
            window.syncOperatorUI();
        } else {
            if (opSelect) opSelect.style.display = 'none';
            if (toggleBtn) toggleBtn.style.display = 'none';
            opInput.style.display = 'block';
            opInput.placeholder = t('msat.orgNamePlaceholder');
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
            if (isAirOpsSelected()) {
                opInput.value = e.target.value;
                opInput.dispatchEvent(new Event('change'));
                saveData();
            }
        });

        toggleBtn.addEventListener('click', () => {
            if (!isAirOpsSelected()) return;

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
        if (!isAirOpsSelected()) return;

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
                // Fritekst som ikke finnes i operatorlista (typisk skrevet inn FOER
                // Air Operations ble valgt) forkastes -> brukeren tvinges til aa
                // velge organisasjon fra nedtrekksmenyen.
                opInput.value = '';
                opSelect.value = '';
                opSelect.style.display = 'block';
                opInput.style.display = 'none';
                toggleBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                toggleBtn.style.backgroundColor = '#6c757d';
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

    async function fetchConfig() {
        try {
            scoringRules = await safeFetchJson('data/scoring.json');
            let currentMsatData = await safeFetchJson('data/msat_data.json');
            const orgTypes = await safeFetchJson('data/organisation_types.json');
            commentHelpData = await safeFetchJson('data/comment_help.json') || {};
            commentHelpDataEn = await safeFetchJson('data/comment_help.en.json') || {};
            msatDataNo = await safeFetchJson('data/msat_data.no.json');
            buildNoIndex();

            if (!scoringRules || !currentMsatData) {
                throw new Error("Mangler scoring.json eller msat_data.json");
            }

            buildRightsSelector(orgTypes || []);

            msatData = currentMsatData;

            buildForm(msatData);
            loadData();              // setter bl.a. hidden #organisation-type
            applyRightsFromValue();  // huker av rettigheter fra lagret verdi
            syncTabs();              // bygg faner ut fra valgte rettigheter
            syncOrgNameInput();
            window.syncOperatorUI();
            updateCalculations();

        } catch (error) {
            console.error('Feil ved lasting av konfigurasjon', error);
        }
    }

    // Ved spraakbytte: re-oversett statisk tekst og bygg HELE skjemaet paa nytt.
    // Svar beholdes via localStorage (loadData).
    window.addEventListener('languageChanged', () => {
        if (window.I18n) window.I18n.apply();
        fetchConfig();
    });

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
                    fieldData.push({ id: selectId, label: `${item.id} ${item.text}`, section: section.id, itemId: item.id, text: item.text });

                    const noItem = isNo() ? noItemById[item.id] : null;
                    const itemText = (noItem && noItem.text) || item.text;

                    const isCritical = criticalItemsIds.includes(item.id);
                    // Stjernen ligger INNE i teksten (uten mellomrom foer) saa den limes til
                    // siste ord og ikke havner alene paa en egen linje.
                    const starHtml = isCritical ? '<span class="critical-marker">*</span>' : '';

                    sectionContentHtml += `
                        <div class="form-row">
                            <div class="form-cell">
                                <span data-item-id="${item.id}" class="popup-opener">
                                    <strong>${item.id}</strong> ${itemText}${starHtml}
                                </span>
                            </div>
                            <div class="form-cell">
                                <div class="select-with-comment">
                                    <select id="${selectId}">
                                        <option value="">Select...</option>
                                        <option value="NA">Not Applicable</option>
                                        <option value="P">Present (1)</option>
                                        <option value="S">Suitable (2)</option>
                                        <option value="O">Operating (4)</option>
                                        <option value="E">Effective (7)</option>
                                    </select>
                                    <button type="button" class="item-comment-btn" data-target="${selectId}" aria-label="Comment"><i class="fa-solid fa-comment"></i></button>
                                </div>
                                <input type="hidden" id="${selectId}-comment">
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

        // Lyttere kun for seksjonsnedtrekkene (1-5). Statisk innhold (forlengelse,
        // operator) faar lyttere i init() slik at de ikke dobles ved ombygging.
        container.querySelectorAll('select').forEach(el => {
            el.addEventListener('change', updateCalculations);
            el.addEventListener('change', saveData);
        });
    }

    // ---- Rettigheter (multi-select) -------------------------------------------
    // Ikoner gjenbrukes i baade nedtrekkslista og fanene. LUC (Light UAS Operator
    // Certificate) bruker Material Symbols "drone_2" (samme drone-ikon som forsiden),
    // siden gratis Font Awesome mangler drone. Verdier med "mat:" er Material Symbols.
    const RIGHT_ICONS = {
        'Aerodromes': 'fa-tower-observation',
        'Air Operations': 'fa-plane',
        'Aircrew': 'fa-id-card',
        'ATC Training Org.': 'fa-tower-broadcast',
        'ATM/ANS': 'fa-satellite-dish',
        'CAMO': 'fa-screwdriver-wrench',
        'Design Org.': 'fa-compass-drafting',
        'LUC': 'mat:drone_2',
        'Part-145': 'fa-wrench',
        'Production Org.': 'fa-industry'
    };

    function rightIconHTML(name) {
        const ic = RIGHT_ICONS[name] || 'fa-certificate';
        if (ic.startsWith('mat:')) return `<span class="material-symbols-outlined">${ic.slice(4)}</span>`;
        return `<i class="fa-solid ${ic}"></i>`;
    }

    function buildRightsSelector(types) {
        availableRights = types.slice();
        const menu = document.getElementById('rights-menu');
        if (!menu) return;
        menu.innerHTML = '';
        types.forEach(type => {
            const cbId = 'right-cb-' + slugifyRight(type);
            const label = document.createElement('label');
            label.className = 'rights-option';
            label.setAttribute('role', 'menuitemcheckbox');
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.id = cbId;
            cb.value = type;
            const icon = document.createElement('span');
            icon.className = 'right-icon';
            icon.innerHTML = rightIconHTML(type);
            const span = document.createElement('span');
            span.textContent = type;
            label.appendChild(cb);
            label.appendChild(icon);
            label.appendChild(span);
            menu.appendChild(label);

            cb.addEventListener('change', () => {
                updateRightsDisplay();
                syncTabs();
                syncOrgNameInput();
                window.syncOperatorUI();
                updateCalculations();
                saveData();
            });
        });
    }

    // Speil valgte rettigheter til etiketten og til skjult #organisation-type
    // (sistnevnte er datakilden for lagring og CSV-kolonnen "Organisation type").
    function updateRightsDisplay() {
        const selected = getSelectedRights();
        const labelEl = document.getElementById('rights-label');
        const hidden = document.getElementById('organisation-type');
        if (hidden) hidden.value = selected.join(', ');
        if (labelEl) {
            if (selected.length) {
                labelEl.textContent = selected.join(', ');
                labelEl.classList.remove('placeholder');
            } else {
                labelEl.textContent = t('msat.rightsPlaceholder');
                labelEl.classList.add('placeholder');
            }
        }
    }

    // Huk av rettigheter ut fra verdien i skjult #organisation-type (satt av loadData/CSV).
    function applyRightsFromValue() {
        const hidden = document.getElementById('organisation-type');
        const menu = document.getElementById('rights-menu');
        if (!hidden || !menu) return;
        const values = (hidden.value || '').split(',').map(s => s.trim()).filter(Boolean);
        menu.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = values.includes(cb.value);
        });
        updateRightsDisplay();
    }

    // ---- Underfaner -----------------------------------------------------------
    function setActiveTab(key) {
        const tabBar = document.getElementById('tab-bar');
        const panels = document.getElementById('tab-panels');
        if (!tabBar || !panels) return;
        localStorage.setItem('msat_active_tab', key);
        tabBar.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === key));
        panels.querySelectorAll('.tab-panel').forEach(p => {
            const pk = p.id === 'panel-main' ? 'main' : p.dataset.tab;
            p.classList.toggle('active', pk === key);
        });
    }

    function syncTabs() {
        const tabBar = document.getElementById('tab-bar');
        const panels = document.getElementById('tab-panels');
        const holder = document.getElementById('tab-content-holder');
        const airopsContent = document.getElementById('airops-content');
        if (!tabBar || !panels) return;

        const selected = getSelectedRights();

        // Stjernene for kritiske punkter vises kun naar Air Operations er valgt.
        document.body.classList.toggle('airops-active', selected.includes(AIROPS_RIGHT));

        // 1) Bygg faneknappene paa nytt (hovedfane + en per rettighet).
        const tabs = [{ key: 'main', label: t('msat.tab.main'), iconHtml: '<i class="fa-solid fa-list"></i>' }];
        selected.forEach(r => tabs.push({ key: 'right-' + slugifyRight(r), label: r, iconHtml: rightIconHTML(r) }));
        const validKeys = new Set(tabs.map(tb => tb.key));

        tabBar.innerHTML = '';
        // Fanelinja og rammen vises alltid, ogsaa foer brukeren har valgt godkjenninger
        // (da staar bare hovedfanen "Felles" der).
        tabBar.style.display = 'flex';
        panels.classList.add('framed');
        tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tab-btn';
            btn.dataset.tab = tab.key;
            const icon = document.createElement('span');
            icon.className = 'tab-icon';
            icon.innerHTML = tab.iconHtml;
            btn.appendChild(icon);
            btn.appendChild(document.createTextNode(' ' + tab.label));
            btn.addEventListener('click', () => setActiveTab(tab.key));
            tabBar.appendChild(btn);
        });

        // 2) Fjern rettighets-paneler som ikke lenger er valgt (men bevar airops-content).
        Array.from(panels.querySelectorAll('.tab-panel')).forEach(p => {
            if (p.id === 'panel-main') return;
            if (!validKeys.has(p.dataset.tab)) {
                if (airopsContent && p.contains(airopsContent) && holder) holder.appendChild(airopsContent);
                p.remove();
            }
        });

        // 3) Opprett paneler for valgte rettigheter som mangler.
        selected.forEach(r => {
            const key = 'right-' + slugifyRight(r);
            let panel = panels.querySelector(`.tab-panel[data-tab="${key}"]`);
            if (!panel) {
                panel = document.createElement('div');
                panel.className = 'tab-panel';
                panel.id = 'panel-' + key;
                panel.dataset.tab = key;
                panels.appendChild(panel);
            }
            if (r === AIROPS_RIGHT) {
                if (airopsContent && !panel.contains(airopsContent)) panel.appendChild(airopsContent);
            } else {
                let ph = panel.querySelector('.tab-placeholder');
                if (!ph) {
                    ph = document.createElement('div');
                    ph.className = 'tab-placeholder';
                    panel.appendChild(ph);
                }
                ph.textContent = t('msat.tab.placeholder'); // re-oversettes ved spraakbytte
            }
        });

        // 4) Parker airops-content i lageret naar Air Operations ikke er valgt.
        if (!selected.includes(AIROPS_RIGHT) && airopsContent && holder && !holder.contains(airopsContent)) {
            holder.appendChild(airopsContent);
        }

        // 4b) Forlengelse-sjekklista vises i maaler-oversikten naar Air Operations er
        //     valgt; ellers parkeres den i lageret.
        const extBlock = document.getElementById('extension-block-container');
        const gauges = document.querySelector('.all-gauges-container');
        if (extBlock) {
            if (selected.includes(AIROPS_RIGHT) && gauges) {
                if (!gauges.contains(extBlock)) gauges.appendChild(extBlock);
            } else if (holder && !holder.contains(extBlock)) {
                holder.appendChild(extBlock);
            }
        }

        // 5) Velg en gyldig aktiv fane.
        let active = localStorage.getItem('msat_active_tab') || 'main';
        if (!validKeys.has(active)) active = 'main';
        setActiveTab(active);
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
            updateItemCommentIcon(field.id);
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

        // Fargeklasse på totalscoren etter kvalitet (høy score = bra i MSAT).
        // Egen klasse (total-score-*) som KUN brukes i utskrift – skjermen er uendret.
        const totalBlock = document.getElementById('gauge-block-total');
        if (totalBlock) {
            totalBlock.classList.remove('total-score-good', 'total-score-ok', 'total-score-weak', 'total-score-poor', 'total-score-none');
            let band = 'none';
            if (grandTotalCount > 0) {
                band = grandTotalAvg >= 5 ? 'good'
                     : grandTotalAvg >= 3.5 ? 'ok'
                     : grandTotalAvg >= 2 ? 'weak'
                     : 'poor';
            }
            totalBlock.classList.add('total-score-' + band);
        }

        if (isAirOpsSelected()) {
            const financialSelect = document.getElementById('q-financial-management');
            const level1Select = document.getElementById('q-level1-findings');
            if(financialSelect && level1Select) {
                const financialScore = scoringRules['extension-scores']?.financial?.[financialSelect.value] ?? null;
                const level1Score = scoringRules['extension-scores']?.level1?.[level1Select.value] ?? null;
                
                applyValueCellStyle(document.getElementById('q-financial-management-value'), financialScore);
                applyValueCellStyle(document.getElementById('q-level1-findings-value'), level1Score);

                const criticalItemsWith7 = countAtSeven(criticalItemsIds);
                const criticalItemsMet = (criticalItemsWith7 === criticalItemsIds.length);
                const financialMet = financialScore !== null && financialScore >= 4;
                const level1Met = level1Score !== null && level1Score === 7;

                const allConditionsMet = criticalItemsMet && financialMet && level1Met && allMinimumScoreMet;
                updateExtensionChecklist(financialMet, level1Met, allMinimumScoreMet, allConditionsMet);
            }
            extensionFields.forEach(f => updateItemCommentIcon(f.id));
        }

        saveData();
    }

    function updateExtensionChecklist(financialMet, level1Met, allMinimumMet, allConditionsMetUpdated) {
        const checklistContainer = document.getElementById('extension-checklist');
        const finalCommentEl = document.getElementById('extension-final-comment');
        if(!checklistContainer || !finalCommentEl) return;

        const getClass = (met) => met ? 'status-pass' : 'status-fail';
        const getIcon = (met) => met ? 'fa-circle-check' : 'fa-circle-xmark';

        // Tre linjer for de kritiske punktene, en per underkategori.
        const groupRows = criticalGroups.map(g => {
            const cnt = countAtSeven(g.ids);
            const met = cnt === g.ids.length;
            return `<div class="${getClass(met)}"><i class="fa-solid ${getIcon(met)}"></i><span><a href="#" class="critical-items-link critical-group-link" data-ids="${g.ids.join(',')}">${t(g.labelKey)}</a><span class="critical-marker">*</span> <span class="crit-count">(${cnt}/${g.ids.length})</span></span></div>`;
        }).join('');

        checklistContainer.innerHTML = `
            ${groupRows}
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
                <div class="popup-section"><strong>${t('msat.popup.whatToLookFor')}</strong><br>${whatToLookForHtml}</div>
                <div class="popup-actions">
                    <button type="button" id="popup-ok-button" class="popup-save-btn">${t('msat.popup.ok')}</button>
                </div>`;
            displayPopupCentered(popup);
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

    function showCriticalItemsPopup(targetElement, ids = criticalItemsIds) {
        const popup = document.getElementById('details-popup');
        let listHtml = ids.map(id => {
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
        const lang = (window.I18n && window.I18n.getLang) ? window.I18n.getLang() : 'en';
        const helpSource = (lang === 'no') ? commentHelpData : commentHelpDataEn;
        const fallbackText = (lang === 'no') ? "Ingen informasjon tilgjengelig." : "No information available.";
        // Engelsk fallback per felt dersom oversettelse mangler
        const text = helpSource[fieldKey] || commentHelpDataEn[fieldKey] || commentHelpData[fieldKey] || fallbackText;
        popup.innerHTML = `
            <button id="popup-close-button" aria-label="Close">&times;</button>
            <div class="popup-section">${text}</div>
        `;
        displayPopup(popup, targetElement);
    }

    function displayPopup(popup, targetElement) {
        popup.classList.remove('popup-centered'); // anker-posisjonerte popups skal ikke sentreres
        popup.style.display = 'block';
        const rect = targetElement.getBoundingClientRect();
        let top = rect.bottom + window.scrollY + 5;
        let left = rect.left + window.scrollX;

        if (left + popup.offsetWidth > window.innerWidth) left = window.innerWidth - popup.offsetWidth - 20; 
        if (top + popup.offsetHeight > window.innerHeight + window.scrollY) top = rect.top + window.scrollY - popup.offsetHeight - 5; 

        popup.style.top = `${top}px`;
        popup.style.left = `${left}px`;
    }

    // Sentrert visning midt paa skjermen (uavhengig av hvor punktet er i skjemaet).
    function displayPopupCentered(popup) {
        popup.classList.add('popup-centered');
        popup.style.top = '';
        popup.style.left = '';
        popup.style.display = 'block';
        const backdrop = document.getElementById('popup-backdrop');
        if (backdrop) backdrop.classList.add('visible');
    }

    function hidePopup() {
        const popup = document.getElementById('details-popup');
        popup.style.display = 'none';
        popup.classList.remove('popup-centered');
        const backdrop = document.getElementById('popup-backdrop');
        if (backdrop) backdrop.classList.remove('visible');
    }

    // ---- Begrunnelse per punkt (kommentar-snakkeboble) ------------------------
    // Krever et punkt begrunnelse? Ja naar det er gjort et valg, unntatt verdier som
    // er definert som "skipCommentValues" (f.eks. 6.2 "Nei" = ingen funn).
    function commentRequired(selectId) {
        const select = document.getElementById(selectId);
        if (!select || select.value === '') return false;
        const ext = extensionFields.find(e => e.id === selectId);
        if (ext && ext.skipCommentValues && ext.skipCommentValues.includes(select.value)) return false;
        return true;
    }

    // Tilstander: hvit/tom boble som standard, groenn naar begrunnelse er lagt inn,
    // oransje naar punktet krever begrunnelse men mangler den.
    function updateItemCommentIcon(selectId) {
        const btn = document.querySelector(`.item-comment-btn[data-target="${selectId}"]`);
        if (!btn) return;
        const hidden = document.getElementById(`${selectId}-comment`);
        const icon = btn.querySelector('i');
        const hasComment = !!(hidden && hidden.value.trim());

        btn.classList.remove('has-comment', 'comment-missing');
        if (hasComment) {
            btn.classList.add('has-comment');
            if (icon) icon.className = 'fa-solid fa-comment-dots';
            btn.title = t('msat.itemComment.edit');
        } else if (commentRequired(selectId)) {
            btn.classList.add('comment-missing');
            if (icon) icon.className = 'fa-solid fa-comment';
            btn.title = t('msat.itemComment.add');
        } else {
            if (icon) icon.className = 'fa-regular fa-comment';
            btn.title = t('msat.itemComment.add');
        }
    }

    // Antall punkter som krever begrunnelse, men mangler den (brukes som varsel).
    // Inkluderer forlengelse-punktene 6.1/6.2 naar Air Operations er valgt.
    function countMissingComments() {
        const items = isAirOpsSelected() ? fieldData.concat(extensionFields) : fieldData;
        return items.filter(f => {
            const hidden = document.getElementById(`${f.id}-comment`);
            return commentRequired(f.id) && !(hidden && hidden.value.trim());
        }).length;
    }

    // Overskrift for kommentar-popup: matrisepunkt (1-5) eller forlengelse-punkt (6.x).
    function getItemHeading(selectId) {
        const field = fieldData.find(f => f.id === selectId);
        if (field) {
            const noItem = isNo() ? noItemById[field.itemId] : null;
            const itemText = (noItem && noItem.text) || field.text || '';
            return `${field.itemId} ${itemText}`;
        }
        const ext = extensionFields.find(e => e.id === selectId);
        if (ext) return `${ext.itemId} ${t(ext.labelKey)}`;
        return '';
    }

    function showItemCommentPopup(targetElement, selectId) {
        const popup = document.getElementById('details-popup');
        const hidden = document.getElementById(`${selectId}-comment`);
        const heading = getItemHeading(selectId);

        popup.innerHTML = `
            <button id="popup-close-button" aria-label="Close">&times;</button>
            <h4>${heading}</h4>
            <div class="popup-section">
                <textarea id="item-comment-textarea" class="item-comment-textarea" rows="6" placeholder="${t('msat.itemComment.placeholder')}"></textarea>
            </div>
            <div class="popup-actions">
                <button type="button" id="item-comment-cancel" class="popup-cancel-btn">${t('msat.itemComment.cancel')}</button>
                <button type="button" id="item-comment-save" class="popup-save-btn">${t('msat.itemComment.save')}</button>
            </div>`;

        // Vises midt paa skjermen (konsistent uansett hvor i skjemaet punktet er).
        displayPopupCentered(popup);

        // Teksten skrives ikke til feltet foer brukeren trykker Lagre. Avbryt/lukk lar
        // den forrige verdien staa uendret (ingen commit).
        const ta = document.getElementById('item-comment-textarea');
        if (ta) {
            ta.value = hidden ? hidden.value : '';
            ta.focus();
        }
        const saveBtn = document.getElementById('item-comment-save');
        if (saveBtn) saveBtn.addEventListener('click', () => {
            if (hidden) hidden.value = ta.value;
            updateItemCommentIcon(selectId);
            saveData();
            hidePopup();
        });
        const cancelBtn = document.getElementById('item-comment-cancel');
        if (cancelBtn) cancelBtn.addEventListener('click', hidePopup);
    }

    const isSkippedField = (id) =>
        !id || id === 'msat-profile-selector' || id === 'operator-select' || id.startsWith('right-cb-');

    function saveData() {
        const dataToSave = {};
        document.querySelectorAll('input, select, textarea').forEach(el => {
            if (!isSkippedField(el.id)) {
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
                    if (el && !isSkippedField(id)) {
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
        const missing = countMissingComments();
        if (missing > 0 && !confirm(t('msat.dialog.missingCommentsPrefix') + missing + t('msat.dialog.missingCommentsSuffix'))) {
            return;
        }

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
        const isAirOps = isAirOpsSelected();

        const primaryHeaders = ['Organisation Name', 'Organisation type', 'Assessed By', 'Date', 'Empic ID', 'Policy Avg', 'Risk Avg', 'Assurance Avg', 'Promotion Avg', 'Additional Avg', 'Total Avg Score'];
        const detailHeaders = fieldData.map(field => [`${field.label} (Choice)`, `${field.label} (Score)`, `${field.label} (Comment)`]).flat();
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
            // Verdikten leses fra sluttkommentaren (robust mot antall sjekkliste-linjer).
            const extensionPossible = document.getElementById('extension-final-comment')?.classList.contains('final-pass') ? 'Yes' : 'No';

            const commentFields = [
                { id: 'comments-compliance', header: 'Comments (Compliance)' }, { id: 'comments-flightops', header: 'Comments (Flight Ops)' },
                { id: 'comments-safety', header: 'Comments (Safety Dept)' }, { id: 'comments-training', header: 'Comments (Training)' },
                { id: 'comments-planning', header: 'Comments (Planning & FTL)' }, { id: 'comments-reporting', header: 'Comments (Reporting)' },
                { id: 'comments-other', header: 'Comments (Other)' }
            ];
            const extensionHeaders = ['Extension Possible', ...commentFields.map(f => f.header), ...detailHeaders, '6.1 Financial management (Choice)', '6.1 Financial management (Score)', '6.1 Financial management (Comment)', '6.2 Level 1 findings (Choice)', '6.2 Level 1 findings (Score)', '6.2 Level 1 findings (Comment)'];
            allHeaders = primaryHeaders.concat(extensionHeaders);

            const commentData = commentFields.map(field => escapeCsvMultiline(document.getElementById(field.id)?.value));
            const extensionData = [
                escapeCsv(getSelectedText('q-financial-management')), document.getElementById('q-financial-management-value')?.textContent, escapeCsvMultiline(document.getElementById('q-financial-management-comment')?.value),
                escapeCsv(getSelectedText('q-level1-findings')), document.getElementById('q-level1-findings-value')?.textContent, escapeCsvMultiline(document.getElementById('q-level1-findings-comment')?.value)
            ];
            const detailData = fieldData.map(field => [escapeCsv(getSelectedText(field.id)), document.getElementById(field.id + '-value').textContent, escapeCsvMultiline(document.getElementById(field.id + '-comment')?.value)]).flat();
            
            allData = primaryData.concat([extensionPossible], commentData, detailData, extensionData);
        } else {
            allHeaders = primaryHeaders.concat(['Comments'], detailHeaders);
            const standardComment = escapeCsvMultiline(document.getElementById('comments')?.value);
            const detailData = fieldData.map(field => [escapeCsv(getSelectedText(field.id)), document.getElementById(field.id + '-value').textContent, escapeCsvMultiline(document.getElementById(field.id + '-comment')?.value)]).flat();
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

                // Gjenopprett rettigheter (sjekkbokser) og faner fra "Organisation type".
                applyRightsFromValue();
                syncTabs();

                fieldData.forEach(field => {
                    const select = document.getElementById(field.id);
                    if (select) {
                        const choiceValue = getData(`${field.label} (Choice)`);
                         if (choiceValue) {
                            const option = Array.from(select.options).find(opt => opt.text === choiceValue);
                            select.value = option ? option.value : "";
                         }
                    }
                    const cmt = document.getElementById(field.id + '-comment');
                    if (cmt) cmt.value = getData(`${field.label} (Comment)`);
                });

                if(isAirOpsSelected()) {
                    const finSelect = document.getElementById('q-financial-management');
                    const levSelect = document.getElementById('q-level1-findings');
                    if (finSelect) finSelect.value = Array.from(finSelect.options).find(opt => opt.text === getData('6.1 Financial management (Choice)'))?.value || "";
                    if (levSelect) levSelect.value = Array.from(levSelect.options).find(opt => opt.text === getData('6.2 Level 1 findings (Choice)'))?.value || "";

                    const finCmt = document.getElementById('q-financial-management-comment');
                    if (finCmt) finCmt.value = getData('6.1 Financial management (Comment)');
                    const levCmt = document.getElementById('q-level1-findings-comment');
                    if (levCmt) levCmt.value = getData('6.2 Level 1 findings (Comment)');

                    ['compliance', 'flightops', 'safety', 'training', 'planning', 'reporting', 'other'].forEach(field => {
                        const ta = document.getElementById(`comments-${field}`);
                        if(ta) ta.value = getData(`Comments (${field.charAt(0).toUpperCase() + field.slice(1).replace('ops','Ops').replace('dept','Dept')})`);
                    });
                }
                const standardTa = document.getElementById('comments');
                if (standardTa) standardTa.value = getData('Comments');

                syncOrgNameInput();
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

        await fetchConfig();

        document.querySelectorAll('input, textarea').forEach(el => {
             el.addEventListener('keyup', saveData);
             el.addEventListener('change', saveData);
        });

        // Statiske forlengelses-nedtrekk (alltid i DOM) faar lyttere her, en gang,
        // slik at de ikke dobles naar skjemaet bygges om (spraak/rettighetsendring).
        ['q-financial-management', 'q-level1-findings'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', updateCalculations);
                el.addEventListener('change', saveData);
            }
        });

        // Rettigheter-nedtrekk: aapne/lukke panelet og lukk ved klikk utenfor.
        const rightsToggle = document.getElementById('rights-toggle');
        const rightsMenu = document.getElementById('rights-menu');
        if (rightsToggle && rightsMenu) {
            rightsToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const willOpen = rightsMenu.hidden;
                rightsMenu.hidden = !willOpen;
                rightsToggle.setAttribute('aria-expanded', String(willOpen));
            });
            document.addEventListener('click', (e) => {
                if (!rightsMenu.hidden && !e.target.closest('#rights-select')) {
                    rightsMenu.hidden = true;
                    rightsToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }

        document.addEventListener('click', (e) => {
            const popup = document.getElementById('details-popup');
            if (!popup) return; 

            if (e.target.classList.contains('comment-help-icon')) {
                e.preventDefault();
                showCommentPopup(e.target, e.target.getAttribute('data-field'));
            }
            else if (e.target.closest('.critical-group-link')) {
                e.preventDefault();
                const link = e.target.closest('.critical-group-link');
                const ids = (link.getAttribute('data-ids') || '').split(',').filter(Boolean);
                showCriticalItemsPopup(link, ids); // infoboks for nettopp denne underkategorien
                highlightRows(ids);                // lys opp radene til gruppen
            } else if (e.target.closest('.item-comment-btn')) {
                e.preventDefault();
                const btn = e.target.closest('.item-comment-btn');
                showItemCommentPopup(btn, btn.dataset.target);
            } else if (e.target.closest('.popup-opener')) {
                showPopup(e.target.closest('.popup-opener'));
            } else if (e.target.id === 'extension-help-icon') {
                 showExtensionHelpPopup(e.target);
            } else if (e.target.id === 'popup-close-button' || e.target.id === 'popup-ok-button') {
                hidePopup();
            } else if (popup.style.display === 'block' && !popup.contains(e.target) && !e.target.closest('.popup-opener, .help-icon, .critical-items-link, .comment-help-icon, .item-comment-btn')) {
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