document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'camoAssessment_v6';

    const performanceFields = [
        'perf-hazard-identification', 'perf-hazard-management', 'perf-moc',
        'perf-changes-no-approval', 'perf-changes-after-approval',
        'perf-level1-finding', 'perf-corrective-actions'
    ];
    const complexityFields = [
        'comp-eff-addressing-non-comp', 'comp-eff-closure-non-comp', 'comp-eff-addressing-hazards',
        'comp-iso-45001', 'comp-iso-9001', 'comp-other-auth-approvals',
        'comp-proc-changes-no-approval', 'comp-altmoc-procedure', 'comp-altmoc-number',
        'comp-loc-line-perm', 'comp-loc-base', 'comp-loc-line-non-perm', 'comp-loc-workshop',
        'comp-subcontract-number', 'comp-subcontract-multiple', 'comp-ac-large-aeroplanes',
        'comp-ac-large-helicopters', 'comp-owner-high-vol', 'comp-owner-medium-vol'
    ];
    const otherFields = ['operator-navn', 'filled-by', 'date', 'comments', 'perf-level1-finding-choice', 'perf-level1-finding-number'];

    const criticalityMatrix = { 'E': { 'L': 1, 'M': 2, 'H': 3 }, 'O': { 'L': 2, 'M': 3, 'H': 4 }, 'S': { 'L': 3, 'M': 4, 'H': 5 }, 'P': { 'L': 4, 'M': 5, 'H': 5 } };
    const oversightPlanningMatrix = { 5: { 'H': "Immediate action needed" }, 4: { 'H': "On-site audit" }, 3: { 'H': "On-site audit" }, 2: { 'H': "Desktop audit" }, 1: { 'H': "Desktop audit" }, 5: { 'M': "Immediate action needed" }, 4: { 'M': "On-site audit" }, 3: { 'M': "Desktop audit" }, 2: { 'M': "Desktop audit" }, 1: { 'M': "24 mth planning cycle" }, 5: { 'L': "Immediate action needed" }, 4: { 'L': "On-site audit" }, 3: { 'L': "Desktop audit" }, 2: { 'L': "24 mth planning cycle" }, 1: { 'L': "24 mth planning cycle" }};
    const performanceLevelMap = { 'P': 'Present', 'S': 'Suitable', 'O': 'Operational', 'E': 'Effective' };
    const complexityLevelMap = { 'L': 'Low', 'M': 'Medium', 'H': 'High' };
    
    function getScore(fieldId) {
        const el = document.getElementById(fieldId);
        if (!el || el.value === '') return { value: null, isCalculated: false };

        if (fieldId === 'perf-level1-finding') {
            const choice = document.getElementById('perf-level1-finding-choice').value;
            if (choice === 'No') return { value: 7, isCalculated: true };
            if (choice === 'Yes') {
                const count = parseInt(document.getElementById('perf-level1-finding-number').value, 10) || 1;
                return { value: (count === 1) ? 2 : 1, isCalculated: true };
            }
            return { value: null, isCalculated: false };
        }
        
        if (fieldId === 'perf-corrective-actions') {
            return { value: (el.value === 'Yes' ? 7 : 1), isCalculated: true };
        }

        const multipliers = { 'comp-other-auth-approvals': 5, 'comp-altmoc-number': 2, 'comp-loc-line-perm': 1.2, 'comp-loc-base': 0.7, 'comp-loc-line-non-perm': 1.0, 'comp-loc-workshop': 1.2, 'comp-subcontract-number': 1.0, 'comp-owner-high-vol': 3, 'comp-owner-medium-vol': 2 };
        if (multipliers[fieldId]) {
            return { value: (parseFloat(el.value) || 0) * multipliers[fieldId], isCalculated: true };
        }

        return { value: parseFloat(el.value), isCalculated: true };
    }

    function updateCalculations() {
        // --- Performance Calculation ---
        const performanceScores = performanceFields.map(id => getScore(id).value).filter(v => v !== null);
        const performanceAverage = performanceScores.length > 0 ? performanceScores.reduce((a, b) => a + b, 0) / performanceScores.length : 0;
        let perfLevelCode;
        if (performanceAverage >= 7) perfLevelCode = 'E';
        else if (performanceAverage >= 4) perfLevelCode = 'O';
        else if (performanceAverage >= 2) perfLevelCode = 'S';
        else perfLevelCode = 'P';

        // --- Complexity Calculation ---
        const complexitySum = complexityFields.map(id => getScore(id).value).filter(v => v !== null).reduce((a, b) => a + b, 0);
        let compLevelCode;
        if (complexitySum >= 30) compLevelCode = 'H';
        else if (complexitySum >= 15) compLevelCode = 'M';
        else compLevelCode = 'L';

        // --- Final Calculation ---
        const criticality = criticalityMatrix[perfLevelCode]?.[compLevelCode] ?? '-';
        const actionPlan = oversightPlanningMatrix[criticality]?.[compLevelCode] ?? 'Complete the form to see the recommendation.';

        // --- Update UI ---
        const allFieldsFilled = (performanceScores.length === performanceFields.length) && (complexityFields.map(id => getScore(id).value).filter(v => v !== null).length === complexityFields.length);
        
        document.getElementById('result-performance-level').textContent = allFieldsFilled ? `${performanceLevelMap[perfLevelCode]} (${performanceAverage.toFixed(2)})` : '-';
        document.getElementById('result-performance-level').className = `result-value level-${perfLevelCode}`;
        
        document.getElementById('result-complexity-score').textContent = complexitySum.toFixed(1);

        document.getElementById('result-complexity-level').textContent = allFieldsFilled ? complexityLevelMap[compLevelCode] : '-';
        document.getElementById('result-complexity-level').className = `result-value level-${compLevelCode}`;

        document.getElementById('result-criticality').textContent = allFieldsFilled ? criticality : '-';
        document.getElementById('result-criticality').className = `result-value level-${criticality}`;

        document.getElementById('result-action-plan').textContent = allFieldsFilled ? actionPlan : 'Complete the form to see the recommendation.';

        // Update individual value cells and colors
        [...performanceFields, ...complexityFields].forEach(id => {
            const { value, isCalculated } = getScore(id);
            const valueCell = document.getElementById(`${id}-value`);
            if (valueCell) {
                valueCell.textContent = isCalculated ? (value % 1 !== 0 ? value.toFixed(1) : value) : '-';
                valueCell.className = 'form-cell calculated-value';
                if (isCalculated) {
                    if (id.startsWith('perf-')) {
                        if (value >= 6) valueCell.classList.add('bg-weak-green');
                        else if (value >= 3) valueCell.classList.add('bg-weak-yellow');
                        else valueCell.classList.add('bg-weak-red');
                    } else {
                        if (value >= 7) valueCell.classList.add('bg-weak-red');
                        else if (value >= 3) valueCell.classList.add('bg-weak-yellow');
                        else if (value > 0) valueCell.classList.add('bg-weak-green');
                    }
                }
            }
        });
        saveData();
    }
    
    function saveData() {
        const data = {};
        [...performanceFields, ...complexityFields, ...otherFields, 'perf-level1-finding-choice'].forEach(id => {
            const el = document.getElementById(id);
            if(el) data[id] = el.value;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function loadData() {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (data) {
            Object.keys(data).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = data[id];
            });
        }
        if (!document.getElementById('date').value) document.getElementById('date').valueAsDate = new Date();
        document.getElementById('perf-level1-finding-choice')?.dispatchEvent(new Event('change'));
        updateCalculations();
    }

    function clearForm() {
        if (confirm("Are you sure you want to clear the form?")) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        }
    }

    // --- Initial setup ---
    [...performanceFields, ...complexityFields, ...otherFields, 'perf-level1-finding-choice'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', updateCalculations);
            el.addEventListener('input', updateCalculations);
        }
    });
    document.getElementById('clear-form-button').addEventListener('click', clearForm);
    document.getElementById('print-pdf-button').addEventListener('click', () => window.print());
    document.getElementById('save-result-button').addEventListener('click', () => alert('Save function not yet implemented.'));
    
    loadData();
});