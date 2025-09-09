document.addEventListener('DOMContentLoaded', async () => {
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
        'generic-approval': { label: 'Alle godkjenninger (RNP, ETOPS, etc.)', section: 'approvals' }
    };

    const valueToDisplayTextMap = {
        "<10": "< 10", "11-50": "11 - 50", "51-200": "51 - 200", "200-500": "200 - 500", ">500": "> 500",
        "<50": "< 50", "51-100": "51 - 100", "101-300": "101 - 300", "301-500": "301 - 500", "501-1000": "501 - 1 000", ">1000": "> 1 000",
        "1-3": "1 - 3", "4-6": "4 - 6", "7-9": "7 - 9", "10-12": "10 - 12", ">12": "> 12",
        "0": "0", // Lagt til for konsistens
        "1-5": "1 - 5", "6-10": "6 - 10", "11-15": "11 - 15", "16-20": "16 - 20", ">20": "> 20",
        "4-5": "4 - 5", "6-8": "6 - 8", "9-10": "9 - 10", ">10": "> 10",
        "1-3": "1 - 3", // Duplikert for aircraft-over-40t og under-5.7t, men det er ok
        ">10-100": "> 10 - 100", ">100": "> 100", // Lagt til
        "<10k": "< 10 000", "10k-49k": "10 000 - 49 999", "50k-99k": "50 000 - 99 999", "100k-199k": "100 000 - 199 999", "200k-299k": "200 000 - 299 999", ">300k": "> 300 000"
    };
    
    try {
        const response = await fetch('data/scoring.json'); // Riktig sti her
        const scoringRules = await response.json();

        // Legger til operators.json for oversiktssiden også
        const operatorsResponse = await fetch('data/operators.json');
        const operators = await operatorsResponse.json();

        // Dette er for oversikt over operatører, hvis du ville ha det, men jeg har fjernet dette fra oversikt.html nå.
        // Hvis du vil vise dem, må du legge til en seksjon i oversikt.html
        // console.log("Operatører lastet:", operators); 

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
                
                // Bruk kartet for å finne pen tekst, ellers bruk verdien som den er
                const displayText = valueToDisplayTextMap[optionValue] || optionValue;
                let scoreDisplay = '';

                if (typeof score === 'object' && score.type === 'dependent') {
                    const dependentScores = Object.entries(score.scores)
                        .map(([val, pts]) => `${valueToDisplayTextMap[val] || val} (${pts}p)`)
                        .join(', ');
                    scoreDisplay = `Avh. av piloter: ${dependentScores}, ellers ${score.default}p`;
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
        document.body.innerHTML += '<p style="color: red;">Klarte ikke å laste poengoversikten. Sjekk konsollen for detaljer.</p>';
    }
});