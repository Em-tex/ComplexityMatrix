document.addEventListener('DOMContentLoaded', async () => {
    const t = (k) => (window.I18n ? window.I18n.t(k) : k);
    // Feltlisten SKAL speile hovedskjemaet (rotor.html / kalkulator.js fieldData)
    // – hovedskjemaet er fasit for innhold og poengberegning. Samme id-er, samme
    // rekkefølge, samme engelske label (CSV-fasit). Score-radene hentes fra
    // data/scoring.json. Felter uten regel i scoring.json får ingen rad (de gir
    // også 0 i skjemaet – se README/handover om scoring.json-avvik).
    const fieldIdToDetails = {
        // Resources
        'staff-employed': { label: 'Number of staff employed for the operation', section: 'resources' },
        'pilots-employed': { label: 'Number of pilots employed', section: 'resources' },
        'technical-crew': { label: 'Technical Crew Carried', section: 'resources' },
        'leading-personnel-roles': { label: 'Leading personnel has several roles', section: 'resources' },
        // Fleet
        'types-operated': { label: 'Number of types operated', section: 'fleet' },
        'multi-engine-offshore': { label: 'Number of Multi-engined helicopters operating offshore', section: 'fleet' },
        'multi-engine-onshore': { label: 'Number of Multi-engined helicopters operating onshore', section: 'fleet' },
        'single-engine-helicopters': { label: 'Number of single engine helicopters operated', section: 'fleet' },
        'ac-leasing': { label: 'A/C Leasing', section: 'fleet' },
        'special-modification': { label: 'Helicopters with special modification', section: 'fleet' },
        // Operations
        'number-operation-types': { label: 'Number of Operation types', section: 'operations' },
        'operation-complexity': { label: 'Operation Complexity', section: 'operations' },
        'bases-permanently': { label: 'Number of bases where aircraft and/or crews are permanently based', section: 'operations' },
        'subcontractors': { label: 'Number of Subcontractors', section: 'operations' },
        'ifr-imc-operation': { label: 'IFR/VFR operation', section: 'operations' },
        'single-pilot': { label: 'Singlepilot operation', section: 'operations' },
        'certificate': { label: 'Certificate', section: 'operations' },
        'hr-spo': { label: 'HR SPO', section: 'operations' },
        'group-airline': { label: 'Group Airline', section: 'operations' },
        'derogations': { label: 'Number of derogations', section: 'operations' },
        // Approvals
        'rnp-03': { label: 'RNP 0.3', section: 'approvals' },
        'lv-takeoff': { label: 'Low Visibility operations (TAKEOFF)', section: 'approvals' },
        'lv-landing': { label: 'Low Visibility Operations (LANDING)', section: 'approvals' },
        'dangerous-goods': { label: 'Dangerous Goods', section: 'approvals' },
        'cat-pol-h-305': { label: 'CAT.POL.H.305', section: 'approvals' },
        'nvis': { label: 'NVIS', section: 'approvals' },
        'hho': { label: 'HHO', section: 'approvals' },
        'hems': { label: 'HEMS', section: 'approvals' },
        'hofo': { label: 'HOFO', section: 'approvals' },
        'sar': { label: 'SAR', section: 'approvals' },
        'police-operations': { label: 'Police operations', section: 'approvals' },
        'efb-approval': { label: 'EFB Approval', section: 'approvals' },
        'frms': { label: 'FRMS', section: 'approvals' },
        'ato': { label: 'ATO', section: 'approvals' }
    };

    // id -> i18n-nøkkel (samme som hovedskjemaet). Engelsk label beholdes som
    // fallback/CSV-fasit; visningen oversettes.
    const labelKeys = {
        'staff-employed': 'rotor.staffEmployed', 'pilots-employed': 'rotor.pilotsEmployed',
        'technical-crew': 'rotor.technicalCrew', 'leading-personnel-roles': 'rotor.leadingRoles',
        'types-operated': 'rotor.typesOperated', 'multi-engine-offshore': 'rotor.multiOffshore',
        'multi-engine-onshore': 'rotor.multiOnshore', 'single-engine-helicopters': 'rotor.singleEngine',
        'ac-leasing': 'rotor.acLeasing', 'special-modification': 'rotor.specialMod',
        'number-operation-types': 'rotor.numberOperationTypes', 'operation-complexity': 'rotor.operationComplexity',
        'bases-permanently': 'rotor.basesPermanently', 'subcontractors': 'rotor.subcontractors',
        'ifr-imc-operation': 'rotor.ifrVfr', 'single-pilot': 'rotor.singlePilot',
        'certificate': 'rotor.certificate', 'hr-spo': 'rotor.hrSpo', 'group-airline': 'rotor.groupAirline',
        'derogations': 'rotor.derogations', 'rnp-03': 'rotor.rnp03', 'lv-takeoff': 'rotor.lvTakeoff',
        'lv-landing': 'rotor.lvLanding', 'dangerous-goods': 'rotor.dangerousGoods',
        'cat-pol-h-305': 'rotor.catPolH305', 'nvis': 'rotor.nvis', 'hho': 'rotor.hho', 'hems': 'rotor.hems',
        'hofo': 'rotor.hofo', 'sar': 'rotor.sar', 'police-operations': 'rotor.policeOperations',
        'efb-approval': 'rotor.efbApproval', 'frms': 'rotor.frms', 'ato': 'rotor.ato'
    };
    const labelFor = (id, fallback) => (labelKeys[id] ? t(labelKeys[id]) : fallback);

    const valueToDisplayTextMap = {
        "<20": "< 20", "21-50": "21-50", "51-200": "51-200", "200-500": "200-500", ">500": "> 500",
        "<10": "< 10", "11-30": "11-30", "31-100": "31-100", "101-200": "101-200", ">201": "> 201",
        "2-3": "2-3", "4-6": "4-6", ">6": "> 6",
        "1-5": "1-5", "6-10": "6-10", "11-15": "11-15", "16-20": "16-20", ">20": "> 20",
        "11-20": "11-20", "20-50": "20-50", ">50": "> 50", /* Added for subcontractors */
        "2-5": "2-5", ">5": "> 5",
        ">2": "> 2",
        ">3": "> 3"
    };

    let scoringRules = null;

    function buildTables() {
        if (!scoringRules) return;
        ['resources', 'fleet', 'operations', 'approvals'].forEach(sec => {
            const body = document.getElementById(`${sec}-body`);
            if (body) body.innerHTML = '';
        });

        for (const [id, details] of Object.entries(fieldIdToDetails)) {
            const tableBody = document.getElementById(`${details.section}-body`);
            if (!tableBody) continue;

            let rule = scoringRules[id];
            if (!rule && details.section === 'approvals') {
                rule = scoringRules['generic-approval'];
            }
            // Vis ALLE hovedskjema-felter. Mangler regel i scoring.json -> tydelig
            // markering i stedet for å droppe raden (holder oversikten i samsvar
            // med hovedskjemaet). 6 Rotor-felter mangler regel – se handover.
            if (!rule) {
                tableBody.innerHTML += `<tr><td>${labelFor(id, details.label)}</td><td>—</td><td>${t('rotor.noScoringRule')}</td></tr>`;
                continue;
            }

            let html = '';
            const options = Object.entries(rule);
            const rowCount = options.length;

            options.forEach(([optionValue, score], index) => {
                html += '<tr>';
                if (index === 0) {
                    html += `<td rowspan="${rowCount}">${labelFor(id, details.label)}</td>`;
                }
                const displayText = valueToDisplayTextMap[optionValue] || optionValue;
                let scoreDisplay = '';

                if (typeof score === 'object' && score.type === 'dependent') {
                    const dependentScores = Object.entries(score.scores)
                        .map(([val, pts]) => `${valueToDisplayTextMap[val] || val} (${pts}p)`)
                        .join('<br>');
                    scoreDisplay = `${t('rotor.dependentOnPilots')}<br>${dependentScores}<br>${t('rotor.standardLabel')}: ${score.default}p`;
                } else {
                    scoreDisplay = score;
                }
                html += `<td>${displayText}</td>`;
                html += `<td>${scoreDisplay}</td>`;
                html += '</tr>';
            });
            tableBody.innerHTML += html;
        }
    }

    try {
        const response = await fetch('data/scoring.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        scoringRules = await response.json();
        buildTables();
        window.addEventListener('languageChanged', buildTables);
    } catch (error) {
        console.error('Kunne ikke laste eller bygge oversiktstabell:', error);
        document.body.innerHTML = `<h1>${t('rotor.loadErrorTitle')}</h1><p>${t('rotor.loadErrorBody').replace('{msg}', error.message)}</p>`;
    }
});