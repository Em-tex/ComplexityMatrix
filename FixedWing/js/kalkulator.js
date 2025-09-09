document.addEventListener('DOMContentLoaded', async () => {
    // --- Globale konstanter og variabler ---
    const STORAGE_KEY = 'fixedWingComplexityData';
    let scoringRules = {};

    // Hardkodet for stabilitet. Ingen ekstern fil trengs.
    const MAX_SCORES = {
        resources: 21,
        fleet: 25,
        operations: 29,
        approvals: 14,
        total: 89
    };

    const fieldData = [
        { id: 'staff-employed', section: 'resources' }, { id: 'pilots-employed', section: 'resources' },
        { id: 'cabin-crew', section: 'resources' }, { id: 'leading-personnel-roles', section: 'resources' },
        { id: 'types-operated', section: 'fleet' }, { id: 'aircraft-over-40t', section: 'fleet' },
        { id: 'aircraft-5.7-40t', section: 'fleet' }, { id: 'aircraft-under-5.7t', section: 'fleet' },
        { id: 'sectors-per-annum', section: 'operations' }, { id: 'type-of-operation', section: 'operations' },
        { id: 'aircraft-leasing', section: 'operations' }, { id: 'airports-based', section: 'operations' },
        { id: 'group-airline', section: 'operations' }, { id: 'cargo-carriage', section: 'operations' },
        { id: 'rnp-ar-apch', section: 'approvals' }, { id: 'mnps-nat-hla', section: 'approvals' },
        { id: 'rvsm', section: 'approvals' }, { id: 'lv-takeoff', section: 'approvals' },
        { id: 'lv-landing', section: 'approvals' }, { id: 'etops', section: 'approvals' },
        { id: 'dangerous-goods', section: 'approvals' }, { id: 'single-engine-imc', section: 'approvals' },
        { id: 'efb', section: 'approvals' }, { id: 'isolated-aerodromes', section: 'approvals' },
        { id: 'steep-approach', section: 'approvals' }, { id: 'atqp', section: 'approvals' },
        { id: 'frm', section: 'approvals' }, { id: 'ato-lite', section: 'approvals' }
    ];

    // --- Kjernefunksjoner for beregning ---

    function calculateFieldScore(fieldId, selectValue, pilotsValue) {
        if (!scoringRules[fieldId] || !selectValue) return 0;

        const rule = scoringRules[fieldId][selectValue];

        if (typeof rule === 'object' && rule.type === 'dependent') {
            if (!pilotsValue) return rule.default;
            return rule.scores[pilotsValue] ?? rule.default;
        }
        return rule ?? 0;
    }

    function applyValueCellStyle(valueCell, score) {
        valueCell.className = 'form-cell calculated-value'; // Reset
        if (score >= 4) {
            valueCell.classList.add('bg-weak-red');
        } else if (score >= 2) {
            valueCell.classList.add('bg-weak-yellow');
        } else if (score > 0) {
            valueCell.classList.add('bg-weak-green');
        } else {
            valueCell.classList.add('bg-default-gray');
        }
    }

    function updateGauge(prefix, value, maxValue) {
        const needle = document.getElementById(prefix + '-needle');
        if (!needle) return;
        const percentage = maxValue > 0 ? value / maxValue : 0;
        const rotation = -90 + (percentage * 180);
        needle.style.transform = `translateX(-50%) rotate(${Math.min(90, Math.max(-90, rotation))}deg)`;
        document.getElementById(`${prefix}-gauge-value`).textContent = value;
    }

    function updateCalculations() {
        let totals = { resources: 0, fleet: 0, operations: 0, approvals: 0 };
        const pilotsValue = document.getElementById('pilots-employed').value;

        fieldData.forEach(field => {
            const select = document.getElementById(field.id);
            const valueCell = document.getElementById(field.id + '-value');
            if (select && valueCell) {
                const score = calculateFieldScore(field.id, select.value, pilotsValue);
                valueCell.textContent = score;
                applyValueCellStyle(valueCell, score);
                totals[field.section] += score;
            }
        });

        let grandTotal = 0;
        for (const section in totals) {
            document.getElementById(`${section}-sum`).textContent = totals[section];
            updateGauge(section, totals[section], MAX_SCORES[section]);
            grandTotal += totals[section];
        }
        
        document.getElementById('total-gauge-sum-text').textContent = grandTotal;
        updateGauge('total', grandTotal, MAX_SCORES.total);

        saveData();
    }

    // --- Funksjoner for lagring og lasting ---
    function saveData() {
        const dataToSave = {};
        document.querySelectorAll('input[type="text"], input[type="date"], select, textarea').forEach(el => {
            if (el.id) dataToSave[el.id] = el.value;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }

    function loadData() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const data = JSON.parse(savedData);
            for (const id in data) {
                const el = document.getElementById(id);
                if (el) el.value = data[id];
            }
        }
    }
    
    function clearForm() {
        if (confirm("Er du sikker på at du vil tømme skjemaet? All lagret data vil bli slettet.")) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        }
    }

    // --- Initialisering ---
    async function init() {
        try {
            const [scoringRes, operatorsRes] = await Promise.all([
                fetch('data/scoring.json'),
                fetch('data/operators.json')
            ]);
            scoringRules = await scoringRes.json();
            const operators = await operatorsRes.json();
            
            const datalist = document.getElementById('operator-list');
            operators.forEach(op => {
                const option = document.createElement('option');
                option.value = op;
                datalist.appendChild(option);
            });

        } catch (error) {
            console.error('Klarte ikke å laste inn nødvendige datafiler:', error);
            alert('FEIL: Kunne ikke laste inn datafiler (scoring/operators).');
            return;
        }

        // Sett maksverdier i HTML
        document.getElementById('grand-max-total-display').textContent = MAX_SCORES.total;
        document.getElementById('resources-max-sum').textContent = MAX_SCORES.resources;
        document.getElementById('fleet-max-sum').textContent = MAX_SCORES.fleet;
        document.getElementById('operations-max-sum').textContent = MAX_SCORES.operations;
        document.getElementById('approvals-max-sum').textContent = MAX_SCORES.approvals;
        document.getElementById('total-gauge-max-text').textContent = MAX_SCORES.total;

        // Fest alle event listeners
        document.querySelectorAll('input, select, textarea').forEach(el => {
            el.addEventListener('change', updateCalculations);
        });

        document.getElementById('clear-form-button').addEventListener('click', clearForm);
        // ... fest andre knappe-listeners her hvis du har dem

        // Last inn lagret data og sett dato hvis tom
        loadData();
        if (!document.getElementById('date').value) {
            document.getElementById('date').valueAsDate = new Date();
        }

        // Utfør første beregning
        updateCalculations();
    }

    init();
});