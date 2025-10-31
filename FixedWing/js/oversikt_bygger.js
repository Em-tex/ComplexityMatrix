document.addEventListener('DOMContentLoaded', async () => {
    const fieldIdToDetails = {
        // Resources
        'staff-employed': { label: 'Total Number of staff employed for the operation', section: 'resources' },
        'pilots-employed': { label: 'Number of pilots employed', section: 'resources' },
        'cabin-crew': { label: 'Cabin crew carried', section: 'resources' },
        'leading-personnel-roles': { label: 'Leading personel has several roles', section: 'resources' },
        // Fleet
        'types-operated': { label: 'Number of types operated', section: 'fleet' },
        'aircraft-mops-over-19': { label: 'Number of aircraft with MOPSC of MORE than 19 seats', section: 'fleet' },
        'aircraft-mops-under-19': { label: 'Number of aircraft with MOPSC of 19 seats or LESS', section: 'fleet' },
        'special-modification': { label: 'Aircraft with Special Modification', section: 'fleet' },
        // Operations
        'operation-types': { label: 'Number of Operation types', section: 'operations' },
        'operation-complexity': { label: 'Operation Complexity', section: 'operations' },
        'special-operation': { label: 'Number of special Operation (NOT SPA)', section: 'operations' },
        'derogations': { label: 'Number of derogations', section: 'operations' },
        'airports-based': { label: 'Number of airports where aircraft and/or crews are permanently based', section: 'operations' },
        'subcontractors': { label: 'Number of Subcontractors', section: 'operations' },
        'acmi': { label: 'ACMI', section: 'operations' },
        'certificate': { label: 'Certificate', section: 'operations' },
        'hr-spo': { label: 'HR SPO', section: 'operations' },
        // Approvals
        'rnp-ar-apch': { label: 'RNP AR APCH', section: 'approvals' },
        'mnps-nat-hla': { label: 'MNPS/ NAT-HLA', section: 'approvals' },
        'rvsm': { label: 'RVSM', section: 'approvals' },
        'lv-takeoff': { label: 'Low Visibility operations (TAKEOFF)', section: 'approvals' },
        'lv-landing': { label: 'Low Visibility operations (LANDING)', section: 'approvals' },
        'etops': { label: 'ETOPS', section: 'approvals' },
        'dangerous-goods': { label: 'Dangerous Goods', section: 'approvals' },
        'single-engine-imc': { label: 'Single-Engined Turbine IMC', section: 'approvals' },
        'efb': { label: 'Electronic Flight Bag', section: 'approvals' },
        'isolated-aerodromes': { label: 'Isolated Aerodromes', section: 'approvals' },
        'steep-approach': { label: 'Steep Approach', section: 'approvals' },
        'frms': { label: 'FRMS', section: 'approvals' },
        'crew-training': { label: 'Crew Training', section: 'approvals' },
        'cca-training': { label: 'CCA training', section: 'approvals' }
    };

    const valueToDisplayTextMap = {
        "<20": "< 20", "21-50": "21-50", "51-200": "51-200", "200-500": "200-500", ">500": "> 500",
        "<50": "< 50", "51-100": "51-100", "101-300": "101-300", "301-500": "301-500", "501-1000": "501 - 1000", ">1000": "> 1000",
        "2-3": "2-3", "4-6": "4-6", ">6": "> 6",
        "1-3": "1-3", "4-5": "4-5", "6-8": "6-8", "9-10": "9-10", ">10": "> 10",
        "1-5": "1-5", "6-10": "6-10", "11-15": "11-15", "16-20": "16-20", ">20": "> 20",
        "11-20": "11-20", "20-50": "20-50", ">50": "> 50",
        ">3": "> 3",
        "High risk SPO": "High risk SPO"
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