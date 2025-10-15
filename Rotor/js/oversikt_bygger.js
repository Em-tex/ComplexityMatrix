document.addEventListener('DOMContentLoaded', async () => {
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
        'fms': { label: 'FMS', section: 'approvals' },
        'ato': { label: 'ATO', section: 'approvals' }
    };

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

    try {
        const response = await fetch('data/scoring.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const scoringRules = await response.json();

        for (const [id, details] of Object.entries(fieldIdToDetails)) {
            let rule = scoringRules[id]; 
            if (!rule && details.section === 'approvals') {
                rule = scoringRules['generic-approval'];
            }
            if (!rule) continue;

            const tableBody = document.getElementById(`${details.section}-body`);
            if (!tableBody) continue;
            
            let html = '';
            const options = Object.entries(rule);
            const rowCount = options.length;

            options.forEach(([optionValue, score], index) => {
                html += '<tr>';
                if (index === 0) {
                    html += `<td rowspan="${rowCount}">${details.label}</td>`;
                }
                const displayText = valueToDisplayTextMap[optionValue] || optionValue;
                let scoreDisplay = '';

                if (typeof score === 'object' && score.type === 'dependent') {
                    const dependentScores = Object.entries(score.scores)
                        .map(([val, pts]) => `${valueToDisplayTextMap[val] || val} (${pts}p)`)
                        .join('<br>');
                    scoreDisplay = `Avhengig av piloter:<br>${dependentScores}<br>Standard: ${score.default}p`;
                } else {
                    scoreDisplay = score;
                }
                html += `<td>${displayText}</td>`;
                html += `<td>${scoreDisplay}</td>`;
                html += '</tr>';
            });
            tableBody.innerHTML += html;
        }

    } catch (error) {
        console.error('Kunne ikke laste eller bygge oversiktstabell:', error);
        document.body.innerHTML = `<h1>Feil ved lasting</h1><p>Klarte ikke å laste poengoversikten. Sjekk at filen 'data/scoring.json' eksisterer og at stien er riktig. Detaljer: ${error.message}</p>`;
    }
});