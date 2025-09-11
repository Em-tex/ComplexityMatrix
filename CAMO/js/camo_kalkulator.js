document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'camoAssessment_v14_final';
    const allInputIds = [
        'org-name', 'org-ref', 'date', 'comments', 
        'A1a-perf', 'A1b-perf', 'A2a-perf', 'A2b-perf', 'A2c-perf', 'A3-choice', 'A3-number', 'A4-perf', 'A5-perf', 'A5-date', 'A6-perf', 
        'B1a-perf', 'B1b-perf', 'B2i-perf', 'B2ii-perf', 'B3-perf', 
        'B4a-comp', 'B4a-perf', 'B4b-comp', 'B4c-comp', 
        'B5-comp', 'B5-perf', 'B6-comp', 'B6-perf', 
        'B7a-comp', 'B7a-perf', 'B7b-comp', 'B7b-perf', 'B7c-comp', 'B7c-perf', 'B7d-comp', 'B7d-perf',
        'B8a-comp', 'B8a-perf', 'B8b-comp', 'B8b-perf',
        'B9-comp', 'B9-perf', 
        'B10-comp', 'B10a-comp', 'B10a-perf'
    ];
    
    const performanceGroups = {
        A1: ['A1a-perf', 'A1b-perf'],
        A2: ['A2a-perf', 'A2b-perf', 'A2c-perf'],
        A3: ['A3-choice'], A4: ['A4-perf'], A5: ['A5-perf'], A6: ['A6-perf'],
        B1: ['B1a-perf', 'B1b-perf'],
        B2: ['B2i-perf', 'B2ii-perf'],
        B3: ['B3-perf'], B4: ['B4a-perf'], B5: ['B5-perf'], B6: ['B6-perf'],
        B7: ['B7a-perf', 'B7b-perf', 'B7c-perf', 'B7d-perf'],
        B8: ['B8a-perf', 'B8b-perf'],
        B9: ['B9-perf'], B10: ['B10a-perf']
    };
    
    const perfThresholds = { E: 5.5, O: 3.6, S: 2.2, P: 0 };
    const compThresholds = { H: 19, M: 12, L: 9, "Non-complex": 7 };
    const performanceLevelMap = { P: 'Present', S: 'Suitable', O: 'Operational', E: 'Effective' };
    const complexityLevelMap = { H: 'High', M: 'Medium', L: 'Low', "Non-complex": 'Non-complex' };
    const criticalityMatrix = { P:{"Non-complex":"critical", L:"critical", M:"critical", H:"critical"}, S:{"Non-complex":"attention req.", L:"attention req.", M:"critical", H:"critical"}, O:{"Non-complex":"normal", L:"normal", M:"normal", H:"normal"}, E:{"Non-complex":"low", L:"low", M:"low", H:"low"} };
    const planMatrix = { critical:{"Non-complex":"immediate action", L:"immediate action", M:"immediate action", H:"immediate action"}, "attention req.":{"Non-complex":"Focused scope", L:"Focused scope", M:"Focused scope", H:"Focused scope"}, normal:{"Non-complex":"basic", L:"basic", M:"basic+", H:"basic+"}, low:{"Non-complex":"basic", L:"basic", M:"basic", H:"basic+"} };
    const activitiesBase = { "immediate action": 0, "Focused scope": 6, "basic+": 4, "basic": 4, "basic-e": 3, "basic-e+": 4 };

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

    function calculate() {
        // --- PERFORMANCE CALCULATION ---
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
                 if(count !== null) {
                    if (count <= 9) groupScores.push(7);
                    else if (count <= 14) groupScores.push(4);
                    else if (count <= 24) groupScores.push(2);
                    else groupScores.push(1);
                 }
            } else {
                performanceGroups[groupKey].forEach(id => {
                    const score = getElValue(id);
                    if (score !== null) groupScores.push(score);
                });
            }
            
            const avg = groupScores.length > 0 ? groupScores.reduce((a,b) => a+b,0) / groupScores.length : null;
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
        
        // --- COMPLEXITY CALCULATION ---
        let complexitySum = 0;
        if(getElValue('B4a-comp') === 1) complexitySum += (getElValue('B4b-comp') ?? 0);
        complexitySum += getElValue('B5-comp') ?? 0;
        complexitySum += getElValue('B6-comp') ?? 0;
        complexitySum += getElValue('B7a-comp') ?? 0;
        complexitySum += getElValue('B7b-comp') ?? 0;
        complexitySum += getElValue('B7c-comp') ?? 0;
        complexitySum += (getElValue('B7d-comp') ?? 0) * 0.2;
        complexitySum += (getElValue('B8a-comp') ?? 0);
        complexitySum += getElValue('B8b-comp') ?? 0;
        complexitySum += getElValue('B9-comp') ?? 0;
        if(getElValue('B10-comp') === 1) complexitySum += getElValue('B10a-comp') ?? 0;
        
        let compLevel = 'H';
        if (complexitySum <= compThresholds["Non-complex"]) compLevel = 'Non-complex';
        else if (complexitySum <= compThresholds.L) compLevel = 'L';
        else if (complexitySum <= compThresholds.M) compLevel = 'M';

        // --- FINAL RESULTS ---
        const criticality = criticalityMatrix[perfLevel][compLevel];
        const surveillancePeriod = (criticality !== 'low' && perfLevel !== 'E') ? "No extension" : "Extension possible";
        const basePlan = planMatrix[criticality][compLevel];
        const additionalInspections = Math.max(0, (getElValue('B5-comp') ?? 0) - 1) + (getElValue('B6-comp') ?? 0);
        const totalActivities = (activitiesBase[basePlan] ?? 0) + additionalInspections;
        
        // --- UPDATE UI ---
        const resPerf = document.getElementById('res-perf-level');
        const resComp = document.getElementById('res-comp-level');
        const resCrit = document.getElementById('res-criticality');
        const resPeriod = document.getElementById('res-period');

        resPerf.textContent = `${performanceLevelMap[perfLevel]} (${formatNumber(performanceAverage)})`;
        resPerf.className = `result-value perf-${perfLevel}`;
        resComp.textContent = `${complexityLevelMap[compLevel]} (${formatNumber(complexitySum)})`;
        resComp.className = `result-value comp-${compLevel.replace(/\s/g, '')}`;
        resCrit.textContent = criticality;
        resCrit.className = `result-value crit-${criticality.replace(/\s/g, '')}`;
        resPeriod.textContent = surveillancePeriod;
        resPeriod.className = `result-value period-${surveillancePeriod === 'Extension possible' ? 'ok' : 'no'}`;

        document.getElementById('summary-text-activities').textContent = `Establish a Surveillance programme containing at least ${totalActivities} planned activies.`;
        
        document.querySelectorAll('.matrix-table td').forEach(cell => cell.classList.remove('highlight'));
        const critCellId = `crit-${perfLevel}-${compLevel.replace(/\s/g, '')}`;
        const planCellId = `plan-${criticality.replace(/\s/g, '')}-${compLevel.replace(/\s/g, '')}`;
        const critCell = document.getElementById(critCellId);
        const planCell = document.getElementById(planCellId);
        if(critCell) critCell.classList.add('highlight');
        if(planCell) planCell.classList.add('highlight');
    }

    function setupEventListeners() {
        allInputIds.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.addEventListener('input', () => { calculate(); saveData(); });
                el.addEventListener('change', () => { calculate(); saveData(); });
            }
        });
        
        const level1Choice = document.getElementById('A3-choice');
        if(level1Choice) {
            level1Choice.addEventListener('change', () => {
                document.getElementById('A3-number').classList.toggle('hidden', level1Choice.value !== 'Yes');
            });
        }
        document.getElementById('clear-form-button').addEventListener('click', clearForm);
    }
    
    function saveData() {
        const data = {};
        allInputIds.forEach(id => { const el = document.getElementById(id); if(el) data[id] = el.value; });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function loadData() {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (data) {
            allInputIds.forEach(id => {
                const el = document.getElementById(id);
                if (el && data[id] !== undefined) el.value = data[id];
            });
        }
        if (!document.getElementById('date').value) document.getElementById('date').valueAsDate = new Date();
        const level1Choice = document.getElementById('A3-choice');
        if(level1Choice) document.getElementById('A3-number').classList.toggle('hidden', level1Choice.value !== 'Yes');
        calculate();
    }

    function clearForm() {
        if (confirm("Are you sure you want to clear the form?")) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        }
    }

    loadData();
    setupEventListeners();
});