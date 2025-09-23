document.addEventListener('DOMContentLoaded', async () => {
    // Definerer alle kriterier for ATO
    const fieldIdToDetails = {
        // Resources
        'staff-employed': { label: 'Number of staff for the operation (FTE)', section: 'resources' },
        'instructors-total': { label: 'Number of instructors (full-time, part-time, contract)', section: 'resources' },
        'instructors-part-time': { label: 'Number of part-time instructors on contract', section: 'resources' },
        // Operations
        'number-of-bases': { label: 'Number of bases (main and secondary)', section: 'operations' },
        'bases-outside-norway': { label: 'Secondary base(s) outside Norway', section: 'operations' },
        'ifr-operation': { label: 'IFR operation', section: 'operations' },
        'ncc-operation': { label: 'NCC operation', section: 'operations' },
        'spa-operation': { label: 'SPA operation', section: 'operations' },
        'holds-aoc': { label: 'Operator also holds an AOC', section: 'operations' },
        'own-camo': { label: 'ATO has its own CAMO', section: 'operations' },
        'leasing-from-aoc': { label: 'Leasing aircraft from an AOC', section: 'operations' },
        // Fleet
        'number-of-types': { label: 'Number of different types operated by ATO', section: 'fleet' },
        'me-helicopters': { label: 'Number of ME helicopters', section: 'fleet' },
        'se-helicopters': { label: 'Number of SE helicopters', section: 'fleet' },
        'leased-helicopters': { label: 'Number of leased helicopters', section: 'fleet' },
        // Approvals
        'integrated-courses': { label: 'Integrated courses', section: 'approvals' },
        'fcl-courses': { label: 'Number of approved FCL courses', section: 'approvals' },
        'certificate-courses': { label: 'Number of courses for certificate issuance', section: 'approvals' },
        'type-rating-courses': { label: 'Number of type rating courses', section: 'approvals' },
        'instructor-courses': { label: 'Number of instructor courses', section: 'approvals' },
        'theory-ppl': { label: 'Theory course for PPL certificate', section: 'approvals' },
        'theory-cpl-atpl-ir': { label: 'Theory course for CPL/ATPL/IR', section: 'approvals' },
        // Performance
        'risk-management': { label: '(1) Effective identification and management of own risk', section: 'performance' },
        'change-management': { label: '(2) System for change management', section: 'performance' },
        'level-1-findings': { label: '(3) Level 1 findings in the last 24 months', section: 'performance' },
        'findings-handling': { label: '(4) Ability to manage findings within given deadlines', section: 'performance' },
        'general-performance': { label: 'General performance of ATO management system', section: 'performance' },
        'economy': { label: 'Economy', section: 'performance' }
    };
    
    // Map for å vise penere tekst for visse verdier
    const valueToDisplayTextMap = {
        "<10": "< 10", "11-20": "11 - 20", "21-30": "21 - 30", ">30": "> 30",
        "<5": "< 5", "6-10": "6 - 10", "11-25": "11 - 25", ">26": "> 26",
        ">11": "> 11", "2-4": "2 - 4", ">4": "> 4", "1-2": "1 - 2", ">2": "> 2",
        "<2": "< 2", "2-3": "2 - 3", "3-4": "3 - 4",
        "<4": "< 4", "4-6": "4 - 6", "7-9": "7 - 9", "10-12": "10 - 12", "13-15": "13 - 15", ">15": "> 15",
        "<3": "< 3", "5-6": "5 - 6", ">6": "> 6"
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
                html += `<td>${displayText}</td>`;
                html += `<td>${score}</td>`;
                html += '</tr>';
            });
            tableBody.innerHTML += html;
        }

    } catch (error) {
        console.error('Could not load or build the overview table:', error);
        document.body.innerHTML = `<h1>Error Loading Data</h1><p>Could not load the scoring overview. Check that 'data/ato_scoring.json' exists. Details: ${error.message}</p>`;
    }
});