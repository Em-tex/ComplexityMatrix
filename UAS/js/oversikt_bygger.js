document.addEventListener('DOMContentLoaded', async () => {
    const fieldIdToDetails = {
        // Resources
        'antall-baser': { label: 'Number of bases', section: 'resources' },
        'antall-piloter': { label: 'Number of pilots', section: 'resources' },
        'ledende-personell-roller': { label: 'Leading personnel has multiple roles', section: 'resources' },
        'krav-eksamen': { label: 'Exam requirements', section: 'resources' },
        'manualverk': { label: 'Manuals', section: 'resources' },
        // Fleet
        'tyngste-fartoy': { label: 'Heaviest aircraft', section: 'fleet' },
        'antall-fartoy': { label: 'Number of aircraft', section: 'fleet' },
        'antall-typer': { label: 'Number of different aircraft types', section: 'fleet' },
        'c2link': { label: 'C2 link', section: 'fleet' },
        'modifiserte-fartoy': { label: 'Modified aircraft', section: 'fleet' },
        // Operations
        'synsvidde': { label: 'Line of sight', section: 'operations' },
        'flyhoyde': { label: 'Flight altitude', section: 'operations' },
        'operasjonsmiljo': { label: 'Operational environment', section: 'operations' },
        'redusert-grc': { label: 'Reduced GRC', section: 'operations' },
        'omrade': { label: 'Area', section: 'operations' },
        'sail': { label: 'SAIL', section: 'operations' },
        'annen-risiko': { label: 'Other increased risk', section: 'operations' },
        // Performance
        'flytimer': { label: 'Annual flight hours', section: 'performance' },
        'bekymringsmeldinger': { label: 'Reports of concern', section: 'performance' },
        'veiledningsbehov': { label: 'Need for guidance', section: 'performance' },
        'mangler-oat-empic': { label: 'Missing data in OAT or EMPIC', section: 'performance' },
        'tid-siste-tilsyn': { label: 'Time since last audit', section: 'performance' },
        'niva1-avvik': { label: 'Direct level 1 finding', section: 'performance' },
        'niva2-avvik': { label: 'Number of level 2 findings', section: 'performance' },
        'frist-lukking': { label: 'Deadline for closure', section: 'performance' },
        'sms-tilsyn': { label: 'SMS', section: 'performance' },
        'tid-forstegangsgodkjenning': { label: 'Time since initial approval', section: 'performance' }
    };

    const valueToDisplayTextMap = {
        '<250g': '< 250 g', '250g-2kg': '250 g - 2 kg', '2-4kg': '2 - 4 kg', '4-25kg': '4 - 25 kg', '25-250kg': '25 - 250 kg', '>250kg': '> 250 kg',
        'BVLOS-observer': 'BVLOS with observer', 'BVLOS-no-observer': 'BVLOS without observer',
        'Ingen': 'None (automation/autonomy)', 'Direkte': 'Direct',
        'under-400': "Under 400'", 'over-400': "Over 400'", 'fareomrade': 'In hazardous area',
        'Spredtbefolket': 'Sparsely populated', 'Befolket': 'Populated', 'Flyplass': 'Airport',
        'minus-1-2': '-1 or -2', 'minus-3-mer': '-3 or more',
        'Presist': 'Precise', 'Generisk': 'Generic',
        'Noe': 'Some', 'Betydelig': 'Significant', 'Nei': 'No', 'Ja': 'Yes',
        'kun-hovedbase': 'Main base only', '3-eller-mindre': '3 or less', '4-eller-mer': '4 or more',
        '10-eller-mindre': '10 or less', '10-20': '10 - 20', '20-eller-flere': '20 or more',
        'laget-selv': 'Self-authored', 'kjopt': 'Purchased',
        '1-5': '1 - 5', '6-15': '6 - 15', '16-50': '16 - 50', 'over-50': '> 50',
        '2-3': '2 - 3', 'over-3': '> 3',
        'under-100': 'Under 100', 'over-100': 'Over 100', 'over-1000': 'Over 1,000',
        'Ingen': 'None', 'Middels': 'Medium', 'Alvorlig': 'Severe',
        'Lite': 'Little', 'Stort': 'High',
        'under-1ar': 'Under 1 year', '1-2ar': '1 - 2 years', '2-3ar': '2 - 3 years', 'over-3ar': 'Over 3 years', 'over-2ar': 'Over 2 years',
        '0-3': '0 - 3', '4-7': '4 - 7', '8-11': '8 - 11', 'over-11': 'Over 11',
        'Overholdt': 'Met', 'Overskredet': 'Exceeded'
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

                if (typeof score === 'object' && score.type === 'additive-dependent') {
                    scoreDisplay = `1 + (Score for Pilots) + (Score for Bases)`;
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
        console.error('Could not load or build the scoring details table:', error);
        document.body.innerHTML = `<h1>Error Loading</h1><p>Could not load scoring details. Please check that 'data/scoring.json' exists. Details: ${error.message}</p>`;
    }
});