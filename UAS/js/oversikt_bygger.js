document.addEventListener('DOMContentLoaded', async () => {
    const fieldIdToDetails = {
        // Resources
        'antall-baser': { label: 'Antall baser', section: 'resources' },
        'antall-piloter': { label: 'Antall piloter', section: 'resources' },
        'ansvarsfordeling': { label: 'Ansvarsfordeling', section: 'resources' },
        'krav-eksamen': { label: 'Krav til eksamen', section: 'resources' },
        'kjopt-om': { label: 'Kjøpt OM?', section: 'resources' },
        'sms-org': { label: 'SMS (Organisasjon)', section: 'resources' },
        // Fleet
        'fartoyvekt': { label: 'Fartøyvekt', section: 'fleet' },
        'c2link': { label: 'C2 link', section: 'fleet' },
        'eksternt-vedlikehold': { label: 'Eksternt vedlikehold', section: 'fleet' },
        // Operations
        'synsvidde': { label: 'Synsvidde', section: 'operations' },
        'flyhoyde': { label: 'Flyhøyde', section: 'operations' },
        'operasjonsmiljo': { label: 'Operasjonsmiljø', section: 'operations' },
        'redusert-grc': { label: 'Redusert GRC', section: 'operations' },
        'omrade': { label: 'Område', section: 'operations' },
        'sail': { label: 'SAIL', section: 'operations' },
        'annen-risiko': { label: 'Annen økt risiko', section: 'operations' },
        // Performance
        'flytimer': { label: 'Flytimer i året', section: 'performance' },
        'bekymringsmeldinger': { label: 'Bekymringsmeldinger', section: 'performance' },
        'veiledningsbehov': { label: 'Veiledningsbehov', section: 'performance' },
        'niva1-avvik': { label: 'Direkte nivå 1 avvik', section: 'performance' },
        'niva2-avvik': { label: 'Antall nivå 2 avvik', section: 'performance' },
        'frist-lukking': { label: 'Frist for lukking', section: 'performance' },
        'sms-tilsyn': { label: 'SMS (Tilsyn)', section: 'performance' },
        'siste-kontakt': { label: 'Tid siden siste kontakt/revisjon', section: 'performance' },
        'empic-data': { label: 'Manglende data i EMPIC', section: 'performance' },
        'oat-mangler': { label: 'Mangler i OAT', section: 'performance' }
    };

    const valueToDisplayTextMap = {
        'under-4kg': 'Under 4 kg', '4-25kg': '4 - 25 kg', 'over-25kg': 'Over 25 kg',
        'BVLOS-observer': 'BVLOS med observatør', 'BVLOS-no-observer': 'BVLOS uten observatør',
        'Ingen': 'Ingen (automasjon/autonomi)',
        'under-400': 'Under 400\'', 'over-400': 'Over 400\'', 'fareomrade': 'I fareområde',
        'minus-1-2': '-1 eller -2', 'minus-3-mer': '-3 eller mer',
        '1-2': 'I - II', '3-4': 'III - IV', '5-6': 'V - VI',
        'ingen': 'Ingen', '3-eller-mindre': '3 eller mindre', '4-eller-mer': '4 eller mer',
        '10-eller-mindre': '10 eller mindre', '10-20': '10 - 20', '20-eller-flere': '20 eller flere',
        'ok': 'OK', 'flere-roller': 'Flere roller på én person',
        'under-100': 'Under 100', 'over-100': 'Over 100', 'over-1000': 'Over 1 000',
        '0-3': '0 - 3', '4-7': '4 - 7', 'over-7': 'Over 7',
        'under-12mnd': 'Under 12 måneder', 'over-12mnd': 'Mer enn 12 måneder', 'over-18mnd': 'Mer enn 18 måneder'
    };

    try {
        const response = await fetch('data/scoring.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const scoringRules = await response.json();

        for (const [id, details] of Object.entries(fieldIdToDetails)) {
            let rule = scoringRules[id];
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

                if (typeof score === 'object' && score.type === 'custom-dependent') {
                    scoreDisplay = `1 + (Poeng for 'Antall baser' + Poeng for 'Antall piloter') / 2`;
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
        document.body.innerHTML = `<h1>Feil ved lasting</h1><p>Klarte ikke å laste poengoversikten. Sjekk at filen 'data/scoring.json' eksisterer. Detaljer: ${error.message}</p>`;
    }
});