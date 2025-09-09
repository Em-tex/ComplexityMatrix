document.addEventListener('DOMContentLoaded', async () => {
    // --- Globale konstanter og variabler ---
    const STORAGE_KEY = 'fixedWingComplexityData';
    let scoringRules = {};

    const MAX_SCORES = {
        resources: 21, fleet: 25, operations: 29, approvals: 14, total: 89
    };

    const fieldData = [
        { id: 'staff-employed', label: 'Total Number of staff employed for the operation', section: 'resources' },
        { id: 'pilots-employed', label: 'Number of pilots employed', section: 'resources' },
        { id: 'cabin-crew', label: 'Cabin crew carried', section: 'resources' },
        { id: 'leading-personnel-roles', label: 'Leading personell has several roles', section: 'resources' },
        { id: 'types-operated', label: 'Number of types operated', section: 'fleet' },
        { id: 'aircraft-over-40t', label: 'Number of aircraft operated over 40 000 kg', section: 'fleet' },
        { id: 'aircraft-5.7-40t', label: 'Number of aircraft operated between 5 700 kg & 40 000 kg', section: 'fleet' },
        { id: 'aircraft-under-5.7t', label: 'Number of aircraft operated under 5 700 kg', section: 'fleet' },
        { id: 'sectors-per-annum', label: 'Sectors per annum', section: 'operations' },
        { id: 'type-of-operation', label: 'Type of Operation', section: 'operations' },
        { id: 'aircraft-leasing', label: 'Aircraft leasing', section: 'operations' },
        { id: 'airports-based', label: 'Number of airports where aircraft and/or crews are permanently based', section: 'operations' },
        { id: 'group-airline', label: 'Group Airline', section: 'operations' },
        { id: 'cargo-carriage', label: 'Cargo Carriage', section: 'operations' },
        { id: 'rnp-ar-apch', label: 'RNP AR APCH', section: 'approvals' }, { id: 'mnps-nat-hla', label: 'MNPS/ NAT-HLA', section: 'approvals' },
        { id: 'rvsm', label: 'RVSM', section: 'approvals' }, { id: 'lv-takeoff', label: 'Low Visibility operations (TAKEOFF)', section: 'approvals' },
        { id: 'lv-landing', label: 'Low Visibility operations (LANDING)', section: 'approvals' }, { id: 'etops', label: 'ETOPS', section: 'approvals' },
        { id: 'dangerous-goods', label: 'Dangerous Goods', section: 'approvals' }, { id: 'single-engine-imc', label: 'Single-Engined Turbine IMC', section: 'approvals' },
        { id: 'efb', label: 'Electronic Flight Bag', section: 'approvals' }, { id: 'isolated-aerodromes', label: 'Isolated Aerodromes', section: 'approvals' },
        { id: 'steep-approach', label: 'Steep Approach', section: 'approvals' }, { id: 'atqp', label: 'ATQP', section: 'approvals' },
        { id: 'frm', label: 'Fatigue Risk Management', section: 'approvals' }, { id: 'ato-lite', label: 'ATO Lite', section: 'approvals' }
    ];

    // --- Kjernefunksjoner ---
    function calculateFieldScore(fieldId, selectValue, pilotsValue) {
        const isApproval = fieldData.find(f => f.id === fieldId)?.section === 'approvals';
        if (isApproval) {
            return scoringRules['generic-approval']?.[selectValue] ?? 0;
        }

        if (!scoringRules[fieldId] || !selectValue) return 0;
        
        const rule = scoringRules[fieldId][selectValue];
        if (typeof rule === 'object' && rule.type === 'dependent') {
            return rule.scores[pilotsValue] ?? rule.default;
        }
        return rule ?? 0;
    }

    function applyValueCellStyle(valueCell, score) {
        valueCell.className = 'form-cell calculated-value';
        if (score >= 4) valueCell.classList.add('bg-weak-red');
        else if (score >= 2) valueCell.classList.add('bg-weak-yellow');
        else if (score > 0) valueCell.classList.add('bg-weak-green');
        else valueCell.classList.add('bg-default-gray');
    }

    function updateGauge(prefix, value, maxValue) {
        const needle = document.getElementById(prefix + '-needle');
        if (!needle) return;
        const percentage = maxValue > 0 ? value / maxValue : 0;
        const rotation = -90 + (percentage * 180);
        needle.style.transform = `translateX(-50%) rotate(${Math.min(90, Math.max(-90, rotation))}deg)`;
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

    // --- Funksjoner for lagring, lasting, knapper etc. ---
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
            alert('FEIL: Kunne ikke laste inn datafiler (scoring/operators). Siden kan ikke fungere.');
            return;
        }

        Object.keys(MAX_SCORES).forEach(key => {
            const sumEl = document.getElementById(`${key}-max-sum`);
            const gaugeEl = document.getElementById(`${key}-gauge-max-text`);
            if (sumEl) sumEl.textContent = MAX_SCORES[key];
            if (gaugeEl) gaugeEl.textContent = MAX_SCORES[key];
        });
        
        document.querySelectorAll('input, select, textarea').forEach(el => {
            el.addEventListener('change', updateCalculations);
            el.addEventListener('keyup', saveData);
        });

        document.getElementById('clear-form-button').addEventListener('click', clearForm);
        // Add other button listeners here if they are re-introduced

        loadData();
        if (!document.getElementById('date').value) {
            document.getElementById('date').valueAsDate = new Date();
        }

        updateCalculations();
    }

    init();
});