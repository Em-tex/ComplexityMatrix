document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'part145AssessmentData_v4';
    let scoringRules = {};
    
    const scoreFieldData = [
        { id: 'perf-level1-finding', section: 'performance', type: 'level1' },
        { id: 'perf-corrective-actions', section: 'performance' },
        { id: 'perf-ms-hazard-identification', section: 'performance' },
        { id: 'perf-ms-risk-management', section: 'performance' },
        { id: 'perf-ms-moc', section: 'performance' },
        { id: 'comp-eff-addressing-non-comp', section: 'complexity' },
        { id: 'comp-eff-closure-non-comp', section: 'complexity' },
        { id: 'comp-eff-addressing-hazards', section: 'complexity' },
        { id: 'comp-iso-45001', section: 'complexity' },
        { id: 'comp-iso-9001', section: 'complexity' },
        { id: 'comp-other-auth-approvals', section: 'complexity' },
        { id: 'comp-proc-changes-no-approval', section: 'complexity' },
        { id: 'comp-altmoc-procedure', section: 'complexity' },
        { id: 'comp-altmoc-number', section: 'complexity' },
        { id: 'comp-loc-base', section: 'complexity' },
        { id: 'comp-loc-line', section: 'complexity' },
        { id: 'comp-loc-workshop', section: 'complexity' },
        { id: 'comp-subcontract-number', section: 'complexity' },
        { id: 'comp-subcontract-multiple', section: 'complexity' },
        { id: 'comp-scope-aircraft', section: 'complexity' },
        { id: 'comp-scope-engines', section: 'complexity' },
        { id: 'comp-scope-components', section: 'complexity' },
        { id: 'comp-scope-ndt', section: 'complexity' },
        { id: 'comp-owner-high-vol', section: 'complexity' },
        { id: 'comp-owner-medium-vol', section: 'complexity' }
    ];
    
    const otherFieldIds = ['operator-navn', 'filled-by', 'date', 'comments', 'perf-level1-finding-choice', 'perf-level1-finding-number'];

    async function init() {
        try {
            const response = await fetch('data/scoring_part145_sum.json');
            scoringRules = await response.json();
        } catch (error) {
            console.error('Failed to load scoring rules:', error);
            return;
        }
        setupEventListeners();
        loadData();
    }

    function setupEventListeners() {
        [...scoreFieldData.map(f => f.id), ...otherFieldIds].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', updateCalculations);
                if (el.matches('input, textarea')) {
                    el.addEventListener('input', saveData);
                }
            }
        });
        
        const level1Choice = document.getElementById('perf-level1-finding-choice');
        const level1Number = document.getElementById('perf-level1-finding-number');
        if(level1Choice) {
            level1Choice.addEventListener('change', () => {
                level1Number.classList.toggle('hidden', level1Choice.value !== 'Yes');
            });
        }

        document.getElementById('clear-form-button').addEventListener('click', clearForm);
        document.getElementById('print-pdf-button').addEventListener('click', () => window.print());
        document.getElementById('download-csv-button').addEventListener('click', () => alert('CSV-eksport er ikke tilgjengelig.'));
        document.getElementById('load-csv-button').addEventListener('click', () => alert('CSV-import er ikke tilgjengelig.'));
    }

    function calculateFieldScore(field) {
        const element = document.getElementById(field.id);
        const rule = scoringRules[field.id];
        if (!rule || !element) return 0;
        
        if (field.type === 'level1') {
            const choice = document.getElementById('perf-level1-finding-choice').value;
            if (choice === 'No') return rule['No'];
            if (choice === 'Yes') {
                const count = parseInt(document.getElementById('perf-level1-finding-number').value, 10) || 1;
                return (count === 1) ? rule['One'] : rule['Multiple'];
            }
            return 0;
        }

        const value = element.value;
        if (value === '') return 0;

        if (rule.type === 'multiplier') {
            return (parseFloat(value) || 0) * rule.factor;
        }
        return rule[value] ?? 0;
    }
    
    function applyValueCellStyle(valueCell, score, section) {
        valueCell.className = 'form-cell calculated-value';
        if (section === 'performance') {
            if (score >= 6) valueCell.classList.add('bg-weak-green');
            else if (score >= 3) valueCell.classList.add('bg-weak-yellow');
            else valueCell.classList.add('bg-weak-red');
        } else {
            if (score >= 7) valueCell.classList.add('bg-weak-red');
            else if (score >= 3) valueCell.classList.add('bg-weak-yellow');
            else if (score > 0) valueCell.classList.add('bg-weak-green');
            else valueCell.classList.add('bg-default-gray');
        }
    }

    function updateCalculations() {
        let totals = { performance: 0, complexity: 0 };

        scoreFieldData.forEach(field => {
            const score = calculateFieldScore(field);
            totals[field.section] += score;
            const valueCell = document.getElementById(`${field.id}-value`);
            if (valueCell) {
                valueCell.textContent = (score % 1 !== 0) ? score.toFixed(1) : score;
                applyValueCellStyle(valueCell, score, field.section);
            }
        });

        updateGaugesAndSummaries(totals);
        saveData();
    }
    
    function updateGauge(prefix, value, maxValue, invertColors = false) {
        const needle = document.getElementById(`${prefix}-needle`);
        const gaugeBg = needle ? needle.closest('.gauge').querySelector('.gauge-bg') : null;
        if (!needle || !gaugeBg) return;

        gaugeBg.style.background = invertColors 
            ? 'conic-gradient(from 180deg at 50% 100%, #ff152c 5%, #fff025 50%, #009122 95%)'
            : 'conic-gradient(from 180deg at 50% 100%, #009122 5%, #fff025 50%, #ff152c 95%)';

        const percentage = maxValue > 0 ? value / maxValue : 0;
        const rotation = -90 + (percentage * 180);
        needle.style.transform = `translateX(-50%) rotate(${Math.min(90, Math.max(-90, rotation))}deg)`;
    }

    function updateGaugesAndSummaries(totals) {
        const grandTotal = totals.performance - totals.complexity;
        
        document.getElementById('performance-sum').textContent = totals.performance.toFixed(1);
        document.getElementById('complexity-sum').textContent = totals.complexity.toFixed(1);
        document.getElementById('total-gauge-sum-text').textContent = grandTotal.toFixed(1);
        
        updateGauge('performance', totals.performance, 32, true);
        updateGauge('complexity', totals.complexity, 50, false);
        updateGauge('total', grandTotal + 50, 82, true);
    }
    
    function saveData() {
        const data = {};
        [...scoreFieldData.map(f => f.id), ...otherFieldIds].forEach(id => {
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
        if (!document.getElementById('date').value) {
            document.getElementById('date').valueAsDate = new Date();
        }
        document.getElementById('perf-level1-finding-choice')?.dispatchEvent(new Event('change'));
        updateCalculations();
    }

    function clearForm() {
        if (confirm("Er du sikker på at du vil tømme skjemaet?")) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        }
    }

    init();
});