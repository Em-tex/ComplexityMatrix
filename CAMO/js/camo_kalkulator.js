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
    
    const complexitySourceIds = [
        'B4a-comp', 'B4b-comp', 'B4c-comp', 'B5-comp', 'B6-comp',
        'B7a-comp', 'B7b-comp', 'B7c-comp', 'B7d-comp',
        'B8a-comp', 'B8b-comp', 'B9-comp', 'B10-comp', 'B10a-comp'
    ];
    const complexityMultipliers = { 'B7d-comp': 0.2 };

    const perfThresholds = { E: 5.5, O: 3.6, S: 2.2, P: 0 };
    const compThresholds = { H: 19, M: 12, L: 9, "Non-complex": 7 };
    const performanceLevelMap = { P: 'Present', S: 'Suitable', O: 'Operational', E: 'Effective' };
    const complexityLevelMap = { H: 'High', M: 'Medium', L: 'Low', "Non-complex": 'Non-complex' };
    const criticalityMatrix = { P:{"Non-complex":"critical", L:"critical", M:"critical", H:"critical"}, S:{"Non-complex":"attention req.", L:"attention req.", M:"critical", H:"critical"}, O:{"Non-complex":"normal", L:"normal", M:"normal", H:"normal"}, E:{"Non-complex":"low", L:"low", M:"low", H:"low"} };
    const planMatrix = { critical:{"Non-complex":"immediate action", L:"immediate action", M:"immediate action", H:"immediate action"}, "attention req.":{"Non-complex":"Focused scope", L:"Focused scope", M:"Focused scope", H:"Focused scope"}, normal:{"Non-complex":"basic", L:"basic", M:"basic+", H:"basic+"}, low:{"Non-complex":"basic", L:"basic", M:"basic", H:"basic+"} };
    const planDetails = {
        basic: { name: "Basic", audit: "x", splitscope: "", annual: "x", ammeeting: "x", focused: "", unannounced: "" },
        "basic+": { name: "Basic+", audit: "x", splitscope: "x", annual: "x", ammeeting: "x", focused: "", unannounced: "" },
        focusedscope: { name: "Focused scope", audit: "x", splitscope: "x", annual: "x", ammeeting: "x", focused: "x", unannounced: "x" },
        immediateaction: { name: "Immediate action", audit: "-", splitscope: "-", annual: "-", ammeeting: "-", focused: "-", unannounced: "-" },
        basice: { name: "Basic-e", audit: "x", splitscope: "", annual: "x", ammeeting: "x", focused: "x", unannounced: "" },
        basiceplus: { name: "Basic-e+", audit: "x", splitscope: "x", annual: "x", ammeeting: "x", focused: "x", unannounced: "" }
    };

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
        complexitySourceIds.forEach(id => {
            let score = getElValue(id) ?? 0;
            if(id === 'B10a-comp' && getElValue('B10-comp') === 0) score = 0;
            const multiplier = complexityMultipliers[id] || 1;
            complexitySum += score * multiplier;
        });
        
        let compLevel = 'H';
        if (complexitySum <= compThresholds["Non-complex"]) compLevel = 'Non-complex';
        else if (complexitySum <= compThresholds.L) compLevel = 'L';
        else if (complexitySum <= compThresholds.M) compLevel = 'M';

        // --- FINAL RESULTS ---
        const criticality = criticalityMatrix[perfLevel][compLevel];
        const surveillancePeriod = (criticality !== 'low' && perfLevel !== 'E') ? "No extension" : "Extension possible";
        const basePlan = planMatrix[criticality][compLevel];
        
        let totalActivities = 0;
        const planKey = basePlan ? basePlan.replace(/\s/g, '').replace('+', 'plus') : null;
        const currentPlanDetails = planKey ? planDetails[planKey] : null;
        if(currentPlanDetails) {
            totalActivities = Object.values(currentPlanDetails).filter(v => v === 'x').length;
            if (currentPlanDetails.annual === 'x') totalActivities++;
        }
        const additionalInspections = Math.max(0, (getElValue('B5-comp') ?? 0) - 1) + (getElValue('B6-comp') ?? 0);
        totalActivities += additionalInspections;
        
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
        
        const summaryContainer = document.getElementById('plan-summary-text');
        if (currentPlanDetails && basePlan !== "immediate action") {
            summaryContainer.innerHTML = `<h3>${currentPlanDetails.name}</h3><ul></ul>`;
            const ul = summaryContainer.querySelector('ul');
            Object.entries(planDetails.basic).forEach(([key, value]) => {
                if (currentPlanDetails[key] === 'x') {
                    const li = document.createElement('li');
                    li.textContent = `- ${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}`; // Format camelCase
                    ul.appendChild(li);
                }
            });
            const totalLi = document.createElement('li');
            totalLi.className = 'total';
            totalLi.textContent = `Number of activities per planning cycle: ${totalActivities}`;
            ul.appendChild(totalLi);
        } else if (basePlan === "immediate action") {
            summaryContainer.innerHTML = `<h3>Immediate Action Required</h3>`;
        } else {
            summaryContainer.textContent = 'Complete the form to see the recommendation.';
        }
        
        document.querySelectorAll('.matrix-table td, #oversight-plan-details-table tr').forEach(el => el.classList.remove('highlight', 'highlight-row'));
        const critCellId = `crit-${perfLevel}-${compLevel.replace(/\s/g, '')}`;
        const planRowId = `plan-row-${planKey}`;
        const critCell = document.getElementById(critCellId);
        const planRow = document.getElementById(planRowId);
        if(critCell) critCell.classList.add('highlight');
        if(planRow) planRow.classList.add('highlight-row');
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
        document.getElementById('matrix-toggler').addEventListener('click', (e) => {
            const content = document.getElementById('matrix-content');
            const isVisible = content.style.display === 'grid';
            content.style.display = isVisible ? 'none' : 'grid';
            e.target.textContent = isVisible ? '► Show Detailed Matrices' : '▼ Hide Detailed Matrices';
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
        if (confirm("Are you sure you want to clear the form?")) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        }
    }

    loadData();
    setupEventListeners();
});