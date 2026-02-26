document.addEventListener('DOMContentLoaded', async () => {
    const fieldIdToDetails = {
        // Resources
        'staff-fte': { label: 'Number of staff for the operation (FTE)', section: 'resources' },
        'employed-instructors': { label: 'Number of employed instructors', section: 'resources' },
        'contract-instructors': { label: 'Number of part-time instructors on contract', section: 'resources' },
        'complex-organisation': { label: 'Complex organisation (declared)', section: 'resources' },
        'leading-personnel-roles': { label: 'Leading personnel has several roles', section: 'resources' },
        // Operations
        'ifr-operation': { label: 'IFR operation', section: 'operations' },
        'nco-operation': { label: 'NCO', section: 'operations' },
        'ncc-operation': { label: 'NCC', section: 'operations' },
        'spa-spo-operation': { label: 'SPA or SPO', section: 'operations' },
        'holds-aoc': { label: 'Operator also holds an AOC', section: 'operations' },
        'own-camo': { label: 'ATO has its own CAMO', section: 'operations' },
        'has-fstd-org': { label: 'Organisation also has an FSTD organisation', section: 'operations' },
        'subcontractors': { label: 'Number of subcontractors', section: 'operations' },
        // Fleet
        'number-of-types': { label: 'Number of different types or classes (models) operated by ATO', section: 'fleet' },
        'me-aircraft': { label: 'Number of ME aircraft', section: 'fleet' },
        'se-aircraft': { label: 'Number of SE aircraft', section: 'fleet' },
        'leased-from-aoc': { label: 'Leased aircraft from AOC outside own organisation', section: 'fleet' },
        'privately-leased': { label: 'Privatly leased aircraft', section: 'fleet' },
        'number-of-fstds': { label: 'Number of FSTDs used for training', section: 'fleet' },
        // Approvals
        'integrated-courses': { label: 'Integrated courses', section: 'approvals' },
        'fcl-courses': { label: 'Number of approved FCL courses', section: 'approvals' },
        'theory-lapl-ppl': { label: 'Stand alone theory course for LAPL/ PPL', section: 'approvals' },
        'theory-cpl-atpl-ir': { label: 'Stand alone theory course for CPL/ATPL/IR', section: 'approvals' },
        'number-of-bases': { label: 'Number of bases (main and secondary)', section: 'approvals' },
        'bases-outside-norway': { label: 'Secondary base(s) outside Norway', section: 'approvals' },
        'part-is': { label: 'Part-IS', section: 'approvals' }
    };
    
    const valueToDisplayTextMap = {
        "< 5": "< 5", "5-19": "5 - 19", "> 20": "> 20",
        "6-19": "6 - 19", "6-10": "6 - 10", "> 11": "> 11",
        "1-3": "1 - 3", "4-10": "4 - 10", "> 10": "> 10",
        "1-2": "1 - 2", "3-4": "3 - 4", "> 4": "> 4",
        "< 4": "< 4", "5-10": "5 - 10",
        "1-4": "1 - 4", "> 5": "> 5",
        "< 2": "< 2", "3-6": "3 - 6", "7-10": "7 - 10", "10-12": "10 - 12", "> 12": "> 12",
        "2-4": "2 - 4"
    };

    try {
        const response = await fetch('data/ato_scoring.json');
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
                let scoreDisplay = score;
                
                if (typeof score === 'object' && score.type === 'dependent') {
                     const dependentScores = Object.entries(score.scores)
                        .map(([val, pts]) => `${valueToDisplayTextMap[val] || val} (${pts}p)`)
                        .join('<br>');
                    scoreDisplay = `Avhengig av 'Number of employed instructors':<br>${dependentScores}<br>Standard: ${score.default}p`;
                }

                html += `<td>${displayText}</td>`;
                html += `<td>${scoreDisplay}</td>`;
                html += '</tr>';
            });
            tableBody.innerHTML += html;
        }

    } catch (error) {
        console.error('Could not load or build the overview table:', error);
        document.body.innerHTML = `<h1>Error Loading Data</h1><p>Could not load the scoring overview. Check that 'data/ato_scoring.json' exists. Details: ${error.message}</p>`;
    }
});