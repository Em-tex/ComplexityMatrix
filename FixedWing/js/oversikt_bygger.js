document.addEventListener('DOMContentLoaded', async () => {
    // Denne listen kobler ID fra JSON til en lesbar tittel og riktig seksjon
    const fieldIdToDetails = {
        'staff-employed': { label: 'Total Number of staff employed', section: 'resources' },
        'pilots-employed': { label: 'Number of pilots employed', section: 'resources' },
        'cabin-crew': { label: 'Cabin crew carried', section: 'resources' },
        'leading-personnel-roles': { label: 'Leading personell has several roles', section: 'resources' },
        'types-operated': { label: 'Number of types operated', section: 'fleet' },
        'aircraft-over-40t': { label: 'Number of aircraft operated > 40000kg', section: 'fleet' },
        'aircraft-5.7-40t': { label: 'Number of aircraft between 5700kg & 40000kg', section: 'fleet' },
        'aircraft-under-5.7t': { label: 'Number of aircraft < 5700kg', section: 'fleet' },
        'sectors-per-annum': { label: 'Sectors per annum', section: 'operations' },
        'type-of-operation': { label: 'Type of Operation', section: 'operations' },
        'aircraft-leasing': { label: 'Aircraft leasing', section: 'operations' },
        'airports-based': { label: 'Number of airports (permanent base)', section: 'operations' },
        'group-airline': { label: 'Group Airline', section: 'operations' },
        'cargo-carriage': { label: 'Cargo Carriage', section: 'operations' },
        'generic-approval': { label: 'Alle godkjenninger (RNP, ETOPS, etc.)', section: 'approvals' }
    };
    
    try {
        const response = await fetch('../data/scoring.json');
        const scoringRules = await response.json();

        for (const [id, details] of Object.entries(fieldIdToDetails)) {
            const rule = scoringRules[id];
            if (!rule) continue;

            const tableBody = document.getElementById(`${details.section}-body`);
            if (!tableBody) continue;
            
            let html = '';
            const options = Object.entries(rule);
            const rowCount = options.length;

            options.forEach(([optionText, score], index) => {
                html += '<tr>';

                // Legg til kriterie-celle med rowspan kun på første rad
                if (index === 0) {
                    html += `<td rowspan="${rowCount}">${details.label}</td>`;
                }

                let scoreDisplay = '';
                // Håndter den spesielle avhengighetsregelen
                if (typeof score === 'object' && score.type === 'dependent') {
                    const dependentScores = Object.entries(score.scores)
                        .map(([val, pts]) => `${val} (${pts}p)`)
                        .join(', ');
                    scoreDisplay = `Avh. av piloter: ${dependentScores}, ellers ${score.default}p`;
                } else {
                    scoreDisplay = score;
                }

                html += `<td>${optionText}</td>`;
                html += `<td>${scoreDisplay}</td>`;
                html += '</tr>';
            });
            tableBody.innerHTML += html;
        }

    } catch (error) {
        console.error('Kunne ikke laste eller bygge oversiktstabell:', error);
        document.body.innerHTML += '<p style="color: red;">Klarte ikke å laste poengoversikten.</p>';
    }
});