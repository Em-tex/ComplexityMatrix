document.addEventListener('DOMContentLoaded', async () => {
    const operatorInput = document.getElementById('operator-navn');
    const operatorList = document.getElementById('operator-list');
    const filledByInput = document.getElementById('filled-by');
    const dateInput = document.getElementById('date');
    const downloadCsvButton = document.getElementById('download-csv-button');
    const printPdfButton = document.getElementById('print-pdf-button');
    const clearFormButton = document.getElementById('clear-form-button');
    const loadCsvButton = document.getElementById('load-csv-button');
    const csvFileInput = document.getElementById('csv-file-input');
    const formInputs = document.querySelectorAll('.section-content select');

    let scoringRules = {}; // Lagrer poengberegningsreglene fra JSON
    let maxScores = {}; // Maksimum poeng for hver kategori
    let sections = {
        'resources': ['staff-employed', 'pilots-employed', 'cabin-crew', 'leading-personnel-roles'],
        'fleet': ['types-operated', 'aircraft-over-40t', 'aircraft-5.7-40t', 'aircraft-under-5.7t'],
        'operations': ['sectors-per-annum', 'type-of-operation', 'aircraft-leasing', 'airports-based', 'group-airline', 'cargo-carriage'],
        'approvals': ['rnp-ar-apch', 'mnps-nat-hla', 'rvsm', 'lv-takeoff', 'lv-landing', 'etops', 'dangerous-goods', 'single-engine-imc', 'efb', 'isolated-aerodromes', 'steep-approach', 'atqp', 'frm', 'ato-lite']
    };

    // Funksjon for å hente data
    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Kunne ikke laste data fra ${url}:`, error);
            return null;
        }
    }

    // Laster poengberegningsreglene og maks poeng
    async function loadScoringRules() {
        scoringRules = await fetchData('data/scoring.json');
        maxScores = await fetchData('data/max_scores.json');
        if (!scoringRules || !maxScores) {
            alert('Kunne ikke laste poengberegningsregler eller maks poeng. Sjekk konsollen for detaljer.');
        } else {
            calculateMaxSectionScores(); // Må beregnes på nytt ved lasting
            updateAllGauges(); // Oppdaterer gaugene med korrekte maksverdier
        }
    }

    // Hjelpefunksjon for å hente poeng for et valg
    function getScore(fieldId, selectedValue, pilotsEmployedValue) {
        if (!scoringRules[fieldId] || !selectedValue) return 0;

        const rule = scoringRules[fieldId][selectedValue];
        if (typeof rule === 'object' && rule.type === 'dependent') {
            // Logikk for avhengige poeng
            if (pilotsEmployedValue === '<50') return rule.scores['<50'] || rule.default;
            if (pilotsEmployedValue === '51-100') return rule.scores['51-100'] || rule.default;
            if (pilotsEmployedValue === '101-300') return rule.scores['101-300'] || rule.default;
            if (pilotsEmployedValue === '301-500') return rule.scores['301-500'] || rule.default;
            if (pilotsEmployedValue === '501-1000') return rule.scores['501-1000'] || rule.default;
            if (pilotsEmployedValue === '>1000') return rule.scores['>1000'] || rule.default;
            return rule.default;
        }
        return rule || 0;
    }

    // Beregner summen for en seksjon
    function calculateSectionSum(sectionName) {
        let sum = 0;
        const pilotsEmployedValue = document.getElementById('pilots-employed')?.value;

        sections[sectionName].forEach(fieldId => {
            const selectElement = document.getElementById(fieldId);
            if (selectElement) {
                const score = getScore(fieldId, selectElement.value, pilotsEmployedValue);
                document.getElementById(`${fieldId}-value`).textContent = score;
                sum += score;
            }
        });
        return sum;
    }

    // Beregner maks poeng for hver seksjon basert på scoringRules
    function calculateMaxSectionScores() {
        if (!scoringRules || !maxScores) return;

        let totalMax = 0;
        for (const sectionName in sections) {
            let sectionMax = 0;
            sections[sectionName].forEach(fieldId => {
                if (maxScores[fieldId] !== undefined) {
                    sectionMax += maxScores[fieldId];
                }
            });
            document.getElementById(`${sectionName}-max-sum`).textContent = sectionMax;
            totalMax += sectionMax;
        }
        document.getElementById('grand-max-total-display').textContent = totalMax;
        document.getElementById('total-gauge-max-text').textContent = totalMax;
    }

    // Oppdaterer gaugenålen og verdien
    function updateGauge(gaugeId, needleId, valueId, currentScore, maxScore) {
        const needle = document.getElementById(needleId);
        const valueDisplay = document.getElementById(valueId);

        if (!needle || !valueDisplay || maxScore === 0) {
            // Sett til startposisjon hvis ugyldig eller maks er 0
            if (needle) needle.style.transform = 'translateX(-50%) rotate(-90deg)';
            if (valueDisplay) valueDisplay.textContent = currentScore;
            return;
        }

        const percentage = currentScore / maxScore;
        const rotation = -90 + (percentage * 180); // Fra -90 (0%) til +90 (100%)
        needle.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
        valueDisplay.textContent = currentScore;
    }

    // Hovedfunksjon for å oppdatere alt
    function updateScores() {
        let grandTotal = 0;
        const pilotsEmployedValue = document.getElementById('pilots-employed')?.value;

        // Først beregn alle individuelle felter, da 'pilots-employed' kan påvirke 'leading-personnel-roles'
        for (const sectionName in sections) {
            sections[sectionName].forEach(fieldId => {
                const selectElement = document.getElementById(fieldId);
                if (selectElement) {
                    const score = getScore(fieldId, selectElement.value, pilotsEmployedValue);
                    document.getElementById(`${fieldId}-value`).textContent = score;
                }
            });
        }

        // Deretter oppsummer seksjonene og totalen
        for (const sectionName in sections) {
            let sectionSum = 0;
            sections[sectionName].forEach(fieldId => {
                const valueElement = document.getElementById(`${fieldId}-value`);
                if (valueElement) {
                    sectionSum += parseInt(valueElement.textContent) || 0;
                }
            });
            document.getElementById(`${sectionName}-sum`).textContent = sectionSum;
            grandTotal += sectionSum;

            const maxSectionScore = parseInt(document.getElementById(`${sectionName}-max-sum`).textContent) || 0;
            updateGauge(
                `gauge-block-${sectionName}`,
                `${sectionName}-needle`,
                `${sectionName}-gauge-value`,
                sectionSum,
                maxSectionScore
            );
        }

        document.getElementById('grand-total-display').textContent = grandTotal;
        document.getElementById('total-gauge-sum-text').textContent = grandTotal;

        const totalMaxScore = parseInt(document.getElementById('total-gauge-max-text').textContent) || 0;
        updateGauge(
            'gauge-block-total',
            'total-needle',
            'total-gauge-value',
            grandTotal,
            totalMaxScore
        );

        saveState();
    }

    function updateAllGauges() {
        for (const sectionName in sections) {
            const sectionSum = parseInt(document.getElementById(`${sectionName}-sum`).textContent) || 0;
            const maxSectionScore = parseInt(document.getElementById(`${sectionName}-max-sum`).textContent) || 0;
            updateGauge(
                `gauge-block-${sectionName}`,
                `${sectionName}-needle`,
                `${sectionName}-gauge-value`,
                sectionSum,
                maxSectionScore
            );
        }
        const grandTotal = parseInt(document.getElementById('grand-total-display').textContent) || 0;
        const totalMaxScore = parseInt(document.getElementById('total-gauge-max-text').textContent) || 0;
        updateGauge(
            'gauge-block-total',
            'total-needle',
            'total-gauge-value',
            grandTotal,
            totalMaxScore
        );
    }


    // Laster operatørdata fra lokal JSON-fil
    async function loadOperators() {
        const operators = await fetchData('data/operators.json');
        if (operators) {
            operatorList.innerHTML = ''; // Tømmer eksisterende
            operators.forEach(op => {
                const option = document.createElement('option');
                option.value = op.name;
                operatorList.appendChild(option);
            });
        }
    }

    // Lagrer skjemaets tilstand i localStorage
    function saveState() {
        const state = {
            operator: operatorInput.value,
            filledBy: filledByInput.value,
            date: dateInput.value,
            comments: document.getElementById('comments').value,
            selections: {}
        };
        formInputs.forEach(select => {
            state.selections[select.id] = select.value;
        });
        localStorage.setItem('fixedWingFormState', JSON.stringify(state));
    }

    // Laster skjemaets tilstand fra localStorage
    function loadState() {
        const savedState = localStorage.getItem('fixedWingFormState');
        if (savedState) {
            const state = JSON.parse(savedState);
            operatorInput.value = state.operator || '';
            filledByInput.value = state.filledBy || '';
            dateInput.value = state.date || '';
            document.getElementById('comments').value = state.comments || '';
            for (const id in state.selections) {
                const select = document.getElementById(id);
                if (select) {
                    select.value = state.selections[id];
                    // Trigger change for å oppdatere utseende og kalkulering
                    select.dispatchEvent(new Event('change'));
                }
            }
        } else {
             // Hvis ingen lagret tilstand, sett startverdier og tving en update
            formInputs.forEach(select => {
                if (select.options.length > 0) {
                     // Sett første option som ikke er placeholder, eller tom streng
                    select.value = select.querySelector('option[value=""]').value;
                }
            });
            updateScores(); // Utfør en initial kalkulering
        }
        updateScores(); // Sørg for at alle verdier og gauger er oppdatert etter lasting
    }


    // Tømmer skjemaet
    function clearForm() {
        operatorInput.value = '';
        filledByInput.value = '';
        dateInput.value = '';
        document.getElementById('comments').value = '';
        formInputs.forEach(select => {
            select.value = ''; // Setter tilbake til placeholder
            select.dispatchEvent(new Event('change')); // Trigger change for å oppdatere
        });
        localStorage.removeItem('fixedWingFormState'); // Fjern lagret tilstand
        updateScores();
        // Tilbakestill til default farge for alle score-celler
        document.querySelectorAll('.calculated-value').forEach(cell => {
            cell.classList.remove('bg-weak-red', 'bg-weak-yellow', 'bg-weak-green');
            cell.classList.add('bg-default-gray');
        });
    }

    // Laster inn CSV-data
    function loadCsvData(data) {
        // Antar CSV-data er på formatet: "felt-id","verdi"
        const lines = data.split('\n');
        const state = {
            selections: {}
        };
        lines.forEach(line => {
            const parts = line.split(',');
            if (parts.length === 2) {
                const id = parts[0].trim();
                const value = parts[1].trim();
                if (id === 'operator-navn') operatorInput.value = value;
                else if (id === 'filled-by') filledByInput.value = value;
                else if (id === 'date') dateInput.value = value;
                else if (id === 'comments') document.getElementById('comments').value = value;
                else {
                    const select = document.getElementById(id);
                    if (select) {
                        select.value = value;
                        state.selections[id] = value;
                    }
                }
            }
        });
        // Oppdater skjemaet og kalkuler
        for (const id in state.selections) {
            const select = document.getElementById(id);
            if (select) select.dispatchEvent(new Event('change'));
        }
        updateScores();
        saveState(); // Lagre den nye tilstanden
    }

    // Event listeners
    operatorInput.addEventListener('input', saveState);
    filledByInput.addEventListener('input', saveState);
    dateInput.addEventListener('change', saveState); // Endret til 'change' for dato
    document.getElementById('comments').addEventListener('input', saveState);

    formInputs.forEach(select => {
        select.addEventListener('change', () => {
            updateScores();
            // Sett farge basert på den nye verdien
            const score = parseInt(document.getElementById(`${select.id}-value`).textContent);
            const cell = document.getElementById(`${select.id}-value`);
            cell.classList.remove('bg-default-gray', 'bg-weak-red', 'bg-weak-yellow', 'bg-weak-green');
            if (score >= 4) {
                cell.classList.add('bg-weak-red');
            } else if (score >= 2) {
                cell.classList.add('bg-weak-yellow');
            } else {
                cell.classList.add('bg-weak-green');
            }
        });
        // Initial farge setting ved lasting av siden
        const score = parseInt(document.getElementById(`${select.id}-value`).textContent);
        const cell = document.getElementById(`${select.id}-value`);
        cell.classList.remove('bg-weak-red', 'bg-weak-yellow', 'bg-weak-green'); // Fjern alle først
        if (score >= 4) {
            cell.classList.add('bg-weak-red');
        } else if (score >= 2) {
            cell.classList.add('bg-weak-yellow');
        } else {
            cell.classList.add('bg-weak-green');
        }
    });

    downloadCsvButton.addEventListener('click', () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "field_id,value\n";
        csvContent += `operator-navn,"${operatorInput.value}"\n`;
        csvContent += `filled-by,"${filledByInput.value}"\n`;
        csvContent += `date,"${dateInput.value}"\n`;
        csvContent += `comments,"${document.getElementById('comments').value.replace(/"/g, '""')}"\n`; // Escape quotes

        formInputs.forEach(select => {
            csvContent += `${select.id},"${select.value}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `fixed_wing_complexity_${operatorInput.value || 'data'}_${dateInput.value || new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    printPdfButton.addEventListener('click', () => {
        window.print();
    });

    clearFormButton.addEventListener('click', clearForm);

    loadCsvButton.addEventListener('click', () => {
        csvFileInput.click(); // Åpner filvelgeren
    });

    csvFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                loadCsvData(e.target.result);
            };
            reader.readAsText(file);
        }
    });


    // Initialisering
    await loadScoringRules();
    loadOperators();
    loadState();
});