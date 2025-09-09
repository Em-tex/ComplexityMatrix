document.addEventListener('DOMContentLoaded', async () => {
    // Denne listen kobler ID fra JSON til en lesbar tittel og riktig seksjon
    const fieldIdToDetails = {
        'staff-employed': { label: 'Total Number of staff employed', section: 'resources' },
        'pilots-employed': { label: 'Number of pilots employed', section: 'resources' },
        'cabin-crew': { label: 'Cabin crew carried', section: 'resources' },
        'leading-personnel-roles': { label: 'Leading personell has several roles', section: 'resources' },
        'types-operated': { label: 'Number of types operated', section: 'fleet' },
        'aircraft-over-40t': { label: 'Number of aircraft operated > 40 000 kg', section: 'fleet' },
        'aircraft-5.7-40t': { label: 'Number of aircraft between 5 700 kg & 40 000 kg', section: 'fleet' },
        'aircraft-under-5.7t': { label: 'Number of aircraft < 5 700 kg', section: 'fleet' },
        'sectors-per-annum': { label: 'Sectors per annum', section: 'operations' },
        'type-of-operation': { label: 'Type of Operation', section: 'operations' },
        'aircraft-leasing': { label: 'Aircraft leasing', section: 'operations' },
        'airports-based': { label: 'Number of airports (permanent base)', section: 'operations' },
        'group-airline': { label: 'Group Airline', section: 'operations' },
        'cargo-carriage': { label: 'Cargo Carriage', section: 'operations' },
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
        'atqp': { label: 'ATQP', section: 'approvals' },
        'frm': { label: 'Fatigue Risk Management', section: 'approvals' },
        'ato-lite': { label: 'ATO Lite', section: 'approvals' }
    };

    // Kart for å oversette tekniske verdier til pen tekst
    const valueToDisplayTextMap = {
        "<10": "< 10", "11-50": "11 - 50", "51-200": "51 - 200", "200-500": "200 - 500", ">500": "> 500",
        "<50": "< 50", "51-100": "51 - 100", "101-300": "101 - 300", "301-500": "301 - 500", "501-1000": "501 - 1 000", ">1000": "> 1 000",
        "1-3": "1 - 3", "4-6": "4 - 6", "7-9": "7 - 9", "10-12": "10 - 12", ">12": "> 12",
        "0": "0", "1-5": "1 - 5", "6-10": "6 - 10", "11-15": "11 - 15", "16-20": "16 - 20", ">20": "> 20",
        "4-5": "4 - 5", "6-8": "6 - 8", "9-10": "9 - 10", ">10": "> 10",
        ">10-100": "> 10 - 100", ">100": "> 100",
        "<10k": "< 10 000", "10k-49k": "10 000 - 49 999", "50k-99k": "50 000 - 99 999", "100k-199k": "100 000 - 199 999", "200k-299k": "200 000 - 299 999", ">300k": "> 300 000",
        "A-A": "A-A (Scheduled, Ad-Hoc)",
        "A-B Restricted": "A-B (Restricted)",
        "Ad-Hoc S/H": "Ad-Hoc (Short Haul)",
        "Schd S/H or Ad-Hoc L/H": "Scheduled (Short Haul) or Ad-Hoc (Long Haul)",
        "Schd L/H": "Scheduled (Long Haul)",
        "Yes, dry/wet": "Yes (Dry/Wet)",
        "Both dry and wet leasing": "Both Dry and Wet Leasing",
        "Nil": "Nil (No Dangerous Goods)",
        "BStd": "Basic Standard",
        "UStd": "Unclassified Standard",
        "NStd": "Non-Standard"
    };

    try {
        const response = await fetch('data/scoring.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const scoringRules = await response.json();

        for (const [id, details] of Object.entries(fieldIdToDetails)) {
            const rule = scoringRules[id];
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
                    // Forbedret linjeoppdeling og formatering
                    const dependentScores = Object.entries(score.scores)
                        .map(([val, pts]) => `${valueToDisplayTextMap[val] || val} (${pts}p)`)
                        .join(',\n'); // Bruker \n for linjeskift
                    scoreDisplay = `Avh. av piloter:\n${dependentScores},\nellers ${score.default}p`;
                    scoreDisplay = scoreDisplay.replace(/\n/g, '<br>'); // Konverter \n til <br> for HTML
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