document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'part145AssessmentData';
    let scoringRules = {};

    const MAX_SCORES = {
        performance: 32,
        complexity: null, // Udefinert max pga. antallsfelt
    };

    const fieldData = [
        { id: 'perf-level1-finding', section: 'performance' },
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

    async function init() {
        try {
            const response = await fetch('data/scoring_part145.json');
            scoringRules = await response.json();
        } catch (error) {
            console.error('Failed to load scoring rules for Part-145:', error);
            alert('FEIL: Kunne ikke laste poengregler.');
            return;
        }

        setupEventListeners();
        loadData();
        updateCalculations();
    }
    
    // Resten av funksjonene (setupEventListeners, calculateFieldScore, updateCalculations, etc.)
    // er identiske med de i camo_kalkulator.js. Du kan kopiere dem direkte inn her.

    function setupEventListeners() {
        fieldData.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                element.addEventListener('change', updateCalculations);
                if (element.type === 'number') {
                    element.addEventListener('input', updateCalculations);
                }
            }
        });
        document.getElementById('clear-form-button').addEventListener('click', clearForm);
        document.getElementById('download-csv-button').addEventListener('click', () => alert('CSV-eksport er ikke implementert ennå.'));
        document.getElementById('load-csv-button').addEventListener('click', () => alert('CSV-import er ikke implementert ennå.'));
        document.getElementById('print-pdf-button').addEventListener('click', () => window.print());
    }

    function calculateFieldScore(fieldId, value) {
        if (!scoringRules[fieldId] || value === '') return 0;
        const rule = scoringRules[fieldId];
        if (rule.type === 'multiplier') {
            return (parseFloat(value) || 0) * rule.factor;
        }
        return rule[value] ?? 0;
    }
    
    function updateCalculations() {
        let totals = { performance: 0, complexity: 0 };
        fieldData.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                const score = calculateFieldScore(field.id, element.value);
                totals[field.section] += score;
                const valueCell = document.getElementById(`${field.id}-value`);
                if (valueCell) {
                    valueCell.textContent = (score % 1 !== 0) ? score.toFixed(1) : score;
                }
            }
        });
        updateGaugesAndSummaries(totals);
        saveData();
    }

    function updateGaugesAndSummaries(totals) {
        const grandTotal = totals.performance + totals.complexity;
        document.getElementById('performance-sum').textContent = totals.performance.toFixed(1);
        document.getElementById('complexity-sum').textContent = totals.complexity.toFixed(1);
        document.getElementById('total-gauge-sum-text').textContent = grandTotal.toFixed(1);
        updateGauge('performance', totals.performance, MAX_SCORES.performance);
        updateGauge('complexity', totals.complexity, 100);
        updateGauge('total', grandTotal, 150);
    }

    function updateGauge(prefix, value, maxValue) {
        const needle = document.getElementById(`${prefix}-needle`);
        if (!needle) return;
        const percentage = maxValue > 0 ? value / maxValue : 0;
        const rotation = -90 + (percentage * 180);
        needle.style.transform = `translateX(-50%) rotate(${Math.min(90, Math.max(-90, rotation))}deg)`;
    }
    
    function saveData() {
        const data = {};
        fieldData.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) data[field.id] = element.value;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function loadData() {
        const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (savedData) {
            fieldData.forEach(field => {
                const element = document.getElementById(field.id);
                if (element && savedData[field.id]) {
                    element.value = savedData[field.id];
                }
            });
        }
    }

    function clearForm() {
        if (confirm("Er du sikker på at du vil tømme skjemaet?")) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        }
    }

    init();
});