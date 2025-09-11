document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'part145Assessment_v2'; // Updated version key

    const allInputIds = [
        'org-name', 'org-ref', 'filled-by', 'date', 'comments',
        'A1a-perf', 'A1b-perf',
        'A2a-perf', 'A2b-perf', 'A2c-perf',
        'A3-choice', 'A3-number',
        'A4-perf',
        'A5-perf', 'A5-date',
        'A6-perf',
        'B1a-perf', 'B1b-perf',
        'B2a-i-perf', 'B2a-ii-perf', 'B2a-iii-perf',
        'B2a-iv-label', 'B2a-iv-perf', 'B2a-v-label', 'B2a-v-perf',
        'B2b-i-label', 'B2b-i-perf', 'B2b-ii-label', 'B2b-ii-perf',
        'B2b-iii-label', 'B2b-iii-perf', 'B2b-iv-label', 'B2b-iv-perf',
        'B3-perf',
        'B4a-comp', 'B4a-perf', 'B4b-comp', 'B4c-comp',
        'B5a-comp', 'B5a-perf', 'B5b-comp', 'B5b-perf', 'B5c-comp', 'B5c-perf', 'B5d-comp', 'B5d-perf',
        'B6-comp', 'B6-perf',
        'B7a-vol', 'B7a-perf', 'B7b-vol', 'B7b-perf', 'B7c-vol', 'B7c-perf', 'B7d-vol', 'B7d-perf',
        'B8a-comp', 'B8a-perf', 'B8b-comp', 'B8b-perf',
        'B9-comp', 'B9-perf',
        'B10-comp', 'B10a-comp', 'B10a-perf'
    ];
    
    const performanceGroups = {
        A1: ['A1a-perf', 'A1b-perf'],
        A2: ['A2a-perf', 'A2b-perf', 'A2c-perf'],
        A3: ['A3-choice'],
        A4: ['A4-perf'],
        A5: ['A5-perf'],
        A6: ['A6-perf'],
        B1: ['B1a-perf', 'B1b-perf'],
        B2: [
            'B2a-i-perf', 'B2a-ii-perf', 'B2a-iii-perf', 'B2a-iv-perf', 'B2a-v-perf',
            'B2b-i-perf', 'B2b-ii-perf', 'B2b-iii-perf', 'B2b-iv-perf'
        ],
        B3: ['B3-perf'],
        B4: ['B4a-perf'],
        B5: ['B5a-perf', 'B5b-perf', 'B5c-perf', 'B5d-perf'],
        B6: ['B6-perf'],
        B7: ['B7a-perf', 'B7b-perf', 'B7c-perf', 'B7d-perf'],
        B8: ['B8a-perf', 'B8b-perf'],
        B9: ['B9-perf'],
        B10: ['B10a-perf']
    };
    
    const complexitySourceIds = [
        'B4a-comp', 'B4b-comp', 'B4c-comp',
        'B5a-comp', 'B5b-comp', 'B5c-comp', 'B5d-comp',
        'B6-comp',
        'B7a-vol', 'B7b-vol', 'B7c-vol', 'B7d-vol',
        'B8a-comp', 'B8b-comp',
        'B9-comp',
        'B10-comp', 'B10a-comp'
    ];

    const perfThresholds = { E: 5.5, O: 3.6, S: 2.2, P: 0 };
    const compThresholds = { H: 19, M: 12, L: 9, "Non-complex": 7 };
    const performanceLevelMap = { P: 'Present', S: 'Suitable', O: 'Operational', E: 'Effective' };
    const complexityLevelMap = { H: 'High', M: 'Medium', L: 'Low', "Non-complex": 'Non-complex' };
    const criticalityMatrix = { P:{"Non-complex":"critical", L:"critical", M:"critical", H:"critical"}, S:{"Non-complex":"attention req", L:"attention req", M:"critical", H:"critical"}, O:{"Non-complex":"normal", L:"normal", M:"normal", H:"normal"}, E:{"Non-complex":"low", L:"low", M:"low", H:"low"} };
    const planMatrix = { critical:{"Non-complex":"immediate action", L:"immediate action", M:"immediate action", H:"immediate action"}, "attention req":{"Non-complex":"Focused scope", L:"Focused scope", M:"Focused scope", H:"Focused scope"}, normal:{"Non-complex":"basic", L:"basic", M:"basic+", H:"basic+"}, low:{"Non-complex":"basic", L:"basic", M:"basic", H:"basic+"} };

    function getElValue(id) {
        const el = document.getElementById(id);
        if (!el || el.value === '' || el.value === 'N/A') return null;
        return parseFloat(el.value);
    }
    
    function formatNumber(num) {
        if (num === null || isNaN(num)) return '-';
        if (num % 1 === 0) return num.toString();
        return num.toFixed(2);
    }

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function getElementText(element) {
        if (!element) return '';
        if (element.tagName === 'SELECT') {
            return element.options[element.selectedIndex]?.text.split('(')[0].trim() || '';
        }
        return element.value;
    }

    function calculate() {
        const allPerformanceScores = [];
        Object.keys(performanceGroups).forEach(groupKey => {
            let groupScores = [];
            
            if (groupKey === 'A3') {
                const choice = document.getElementById('A3-choice').value;
                if (choice === 'No') groupScores.push(7);
                else if (choice === 'Yes') {
                    const count = getElValue('A3-number') || 1;
                    groupScores.push(count >= 2 ? 1 : 2);
                }
            } else if (groupKey === 'A6') {
                const count = getElValue('A6-perf');
                if (count !== null) {
                    if (count <= 4) groupScores.push(7);
                    else if (count <= 9) groupScores.push(4);
                    else if (count <= 14) groupScores.push(2);
                    else groupScores.push(1);
                }
            } else {
                performanceGroups[groupKey].forEach(id => {
                    const score = getElValue(id);
                    if (score !== null) groupScores.push(score);
                });
            }
            
            const avg = groupScores.length > 0 ? groupScores.reduce((a, b) => a + b, 0) / groupScores.length : null;
            if (avg !== null) allPerformanceScores.push(avg);
            
            const avgCell = document.getElementById(`${groupKey}-avg`);
            if (avgCell) {
                avgCell.textContent = formatNumber(avg);
                avgCell.className = 'input-score';
                if (avg !== null) {
                    if (avg > 6) avgCell.classList.add('score-dark-green');
                    else if (avg >= 3.5) avgCell.classList.add('score-light-green');
                    else if (avg >= 2) avgCell.classList.add('score-yellow');
                    else avgCell.classList.add('score-red');
                }
            }
        });

        const performanceAverage = allPerformanceScores.length > 0 ? allPerformanceScores.reduce((a, b) => a + b, 0) / allPerformanceScores.length : 0;
        let perfLevel = 'P';
        if (performanceAverage >= perfThresholds.E) perfLevel = 'E';
        else if (performanceAverage >= perfThresholds.O) perfLevel = 'O';
        else if (performanceAverage >= perfThresholds.S) perfLevel = 'S';
        
        let baseComplexitySum = 0;
        complexitySourceIds.forEach(id => {
            let score = getElValue(id) ?? 0;
            if(id === 'B10a-comp' && getElValue('B10-comp') === 0) score = 0;
            if (!id.startsWith('B7') || !id.endsWith('-vol')) {
                 baseComplexitySum += score;
            }
        });

        const volumeFactors = ['B7a-vol', 'B7b-vol', 'B7c-vol', 'B7d-vol']
            .map(getElValue)
            .filter(v => v !== null);

        const averageVolumeFactor = volumeFactors.length > 0 ? volumeFactors.reduce((a, b) => a + b, 0) / volumeFactors.length : 1;
        const complexitySum = baseComplexitySum * averageVolumeFactor;

        let compLevel = 'H';
        if (complexitySum <= compThresholds["Non-complex"]) compLevel = 'Non-complex';
        else if (complexitySum <= compThresholds.L) compLevel = 'L';
        else if (complexitySum <= compThresholds.M) compLevel = 'M';

        const criticality = criticalityMatrix[perfLevel][compLevel];
        const surveillancePeriod = (criticality !== 'low' && perfLevel !== 'E') ? "No extension" : "Extension possible";
        const basePlan = planMatrix[criticality][compLevel];
        
        document.getElementById('res-perf-level').textContent = `${performanceLevelMap[perfLevel]} (${formatNumber(performanceAverage)})`;
        document.getElementById('res-perf-level').className = `result-value perf-${perfLevel}`;
        document.getElementById('res-comp-level').textContent = `${complexityLevelMap[compLevel]} (${formatNumber(complexitySum)})`;
        document.getElementById('res-comp-level').className = `result-value comp-${compLevel.replace(/\s/g, '')}`;
        document.getElementById('res-criticality').textContent = capitalize(criticality.replace(' req', ' Req'));
        document.getElementById('res-criticality').className = `result-value crit-${criticality.replace(/\s/g, '')}`;
        document.getElementById('res-period').textContent = surveillancePeriod;
        document.getElementById('res-period').className = `result-value period-${surveillancePeriod === 'Extension possible' ? 'ok' : 'no'}`;
        document.getElementById('res-oversight-plan').textContent = capitalize(basePlan);
        
        document.querySelectorAll('.matrix-table td').forEach(cell => cell.classList.remove('highlight'));
        document.getElementById(`crit-${perfLevel}-${compLevel.replace(/\s/g, '')}`)?.classList.add('highlight');
        document.getElementById(`plan-${criticality.replace(/\s/g, '')}-${compLevel.replace(/\s/g, '')}`)?.classList.add('highlight');

        document.querySelectorAll('#oversight-plan-details-table tbody tr').forEach(row => row.classList.remove('highlight-row'));
        const planKey = basePlan ? basePlan.replace(/\s/g, '').replace('+', 'plus') : null;
        if(planKey) document.getElementById(`plan-row-${planKey}`)?.classList.add('highlight-row');
    }

    function downloadCSV() {
        let csvContent = "data:text/csv;charset=utf-8,";
        const rows = [
            ["Category", "Value"],
            ["Organization", document.getElementById('org-name').value],
            ["Approval Ref", document.getElementById('org-ref').value],
            ["Filled out by", document.getElementById('filled-by').value],
            ["Date", document.getElementById('date').value],
            [],
            ["--- RESULTS ---"],
            ["Performance Level", document.getElementById('res-perf-level').textContent],
            ["Complexity Level", document.getElementById('res-comp-level').textContent],
            ["Criticality", document.getElementById('res-criticality').textContent],
            ["Oversight Plan", document.getElementById('res-oversight-plan').textContent],
            [],
            ["--- INPUT DATA ---"],
            ["Criteria", "Complexity Input", "Performance Input"]
        ];

        document.querySelectorAll('.input-row.sub-row, .input-row.main-row[id*="-avg"]').forEach(row => {
            const labelEl = row.querySelector('.input-label');
            if (!labelEl) return;

            let labelText = Array.from(labelEl.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .join(' ');
                
            const labelInput = labelEl.querySelector('input[type="text"]');
            if (labelInput && labelInput.value) {
                labelText += ` ${labelInput.value}`;
            }
            labelText = labelText.trim();
            const label = '"' + labelText.replace(/"/g, '""') + '"';

            const compEl = row.querySelector('[id$="-comp"], [id$="-vol"]');
            const perfEl = row.querySelector('[id$="-perf"], [id$="-choice"]');
            
            const compValue = compEl ? getElementText(compEl) : '';
            const perfValue = perfEl ? getElementText(perfEl) : '';

            if (labelText) {
                 rows.push([label, compValue, perfValue]);
            }
        });

        rows.push([]);
        rows.push(["Comments", `"${document.getElementById('comments').value.replace(/"/g, '""')}"`]);

        csvContent += rows.map(e => e.join(";")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const orgName = document.getElementById('org-name').value.replace(/ /g, "_") || 'assessment';
        link.setAttribute("download", `${orgName}_part145_assessment.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function setupEventListeners() {
        allInputIds.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                const update = () => { calculate(); saveData(); };
                el.addEventListener('input', update);
                el.addEventListener('change', update);
            }
        });
        
        document.getElementById('A3-choice')?.addEventListener('change', (e) => {
            document.getElementById('A3-number').classList.toggle('hidden', e.target.value !== 'Yes');
        });
        document.getElementById('clear-form-button').addEventListener('click', clearForm);
        document.getElementById('print-pdf-button').addEventListener('click', () => window.print());
        document.getElementById('download-csv-button').addEventListener('click', downloadCSV);
        document.getElementById('matrix-toggler')?.addEventListener('click', (e) => {
            const content = document.getElementById('matrix-content');
            const isVisible = content.style.display === 'block';
            content.style.display = isVisible ? 'none' : 'block';
            e.target.textContent = isVisible ? '► Show Detailed Matrices & Oversight Plan' : '▼ Hide Detailed Matrices & Oversight Plan';
        });
    }
    
    function saveData() {
        const data = {};
        allInputIds.forEach(id => { const el = document.getElementById(id); if(el) data[id] = el.value; });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function loadData() {
        let data = {};
        try { data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { console.error("Could not parse stored data"); }
        allInputIds.forEach(id => {
            const el = document.getElementById(id);
            if (el && data[id] !== undefined) el.value = data[id];
        });
        if (!document.getElementById('date').value) document.getElementById('date').valueAsDate = new Date();
        const level1Choice = document.getElementById('A3-choice');
        if(level1Choice) document.getElementById('A3-number').classList.toggle('hidden', level1Choice.value !== 'Yes');
        calculate();
    }

    function clearForm() {
        if (confirm("Are you sure you want to clear the form? All entered data will be lost.")) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        }
    }

    loadData();
    setupEventListeners();
});