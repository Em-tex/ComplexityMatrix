document.addEventListener('DOMContentLoaded', () => {
    // Funksjon for å hente data fra JSON-filer
    async function fetchData() {
        try {
            const [operatorsRes, scoringRes] = await Promise.all([
                fetch('../data/operators.json'),
                fetch('../data/scoring.json')
            ]);
            const operatorsData = await operatorsRes.json();
            const scoringRules = await scoringRes.json();
            return { operatorsData, scoringRules };
        } catch (error) {
            console.error("Klarte ikke å laste inn data:", error);
        }
    }

    // Funksjon for å lage en måler (gauge)
    function createGauge(elementId, maxValue, label, size = 'small') {
        const canvas = document.getElementById(elementId);
        if (!canvas) return;

        const gaugeOptions = {
            angle: 0.15,
            lineWidth: 0.3,
            radiusScale: size === 'large' ? 0.9 : 1.0,
            pointer: { length: 0.5, strokeWidth: 0.035, color: '#333' },
            limitMax: false,
            limitMin: false,
            colorStart: '#6FADCF',
            // Definerer fargestopp med tydelig rødfarge på slutten
            staticZones: [
               {strokeStyle: "#30B32D", min: 0, max: maxValue * 0.4},
               {strokeStyle: "#FFDD00", min: maxValue * 0.4, max: maxValue * 0.75},
               {strokeStyle: "#F03E3E", min: maxValue * 0.75, max: maxValue}
            ],
            strokeColor: '#E0E0E0',
            generateGradient: true,
            highDpiSupport: true,
        };
        
        const gauge = new Gauge(canvas).setOptions(gaugeOptions);
        gauge.maxValue = maxValue;
        gauge.setMinValue(0);
        gauge.animationSpeed = 32;
        gauge.setTextField(document.getElementById(label));
        return gauge;
    }
    
    // Funksjon for å bygge HTML-tabeller
    function buildTables(container, operator) {
        const resourcesHtml = `
            <table class="info-table">
                <thead><tr><th>Resources</th><th>Antall</th></tr></thead>
                <tbody>
                    <tr><td>Piloter</td><td>${operator.pilots.length}</td></tr>
                    <tr><td>Luftfartøy</td><td>${operator.aircraft.length}</td></tr>
                    <tr><td>Flyplasser</td><td>${operator.aerodromes.length}</td></tr>
                </tbody>
            </table>
        `;

        const operationsHtml = `
            <table class="info-table">
                <thead><tr><th>Operations</th><th>Status</th></tr></thead>
                <tbody>
                    ${Object.entries(operator.operations).map(([op, status]) => `
                        <tr><td>${op.replace(/_/g, ' ')}</td><td>${status ? 'Ja' : 'Nei'}</td></tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = resourcesHtml + operationsHtml;
    }


    // Hovedfunksjon for å bygge siden
    async function buildPage() {
        const { operatorsData, scoringRules } = await fetchData();
        const operator = operatorsData[0]; // Viser data for første operatør

        document.getElementById('operator-name').textContent = operator.name;
        
        // Bygg og sett inn tabellene FØRST
        const tablesContainer = document.getElementById('tables-container');
        buildTables(tablesContainer, operator);

        // --- Poengberegning ---
        const pilotsScore = Math.floor(operator.pilots.length / scoringRules.pilots.per) * scoringRules.pilots.points;
        const aircraftScore = Math.floor(operator.aircraft.length / scoringRules.aircraft.per) * scoringRules.aircraft.points;
        const aerodromesScore = Math.floor(operator.aerodromes.length / scoringRules.aerodromes.per) * scoringRules.aerodromes.points;
        const opsTypesScore = Object.values(operator.operations).filter(v => v === true).length * scoringRules.operations.per_type;
        const totalScore = pilotsScore + aircraftScore + aerodromesScore + opsTypesScore;

        // --- Oppdater tekst og målere ---
        document.getElementById('pilots-score').textContent = `${pilotsScore} poeng`;
        // Endret tekst til engelsk og med nøyaktig beregning
        document.getElementById('pilots-explanation').textContent = `Calculated as ${scoringRules.pilots.points} point(s) for every ${scoringRules.pilots.per} pilot(s).`;
        
        document.getElementById('aircraft-score').textContent = `${aircraftScore} poeng`;
        document.getElementById('aircraft-explanation').textContent = `${scoringRules.aircraft.points} poeng per ${scoringRules.aircraft.per} luftfartøy.`;

        document.getElementById('aerodromes-score').textContent = `${aerodromesScore} poeng`;
        document.getElementById('aerodromes-explanation').textContent = `${scoringRules.aerodromes.points} poeng per ${scoringRules.aerodromes.per} flyplass.`;

        document.getElementById('ops-types-score').textContent = `${opsTypesScore} poeng`;
        document.getElementById('ops-types-explanation').textContent = `${scoringRules.operations.per_type} poeng per operasjonstype.`;

        document.getElementById('total-score').textContent = totalScore;
        
        // --- Initialiser målere ---
        const maxTotal = 100; // Juster maks-verdi for totalen etter behov
        const maxIndividual = maxTotal / 4; // Setter maks for de små til 1/4 av totalen

        const pilotsGauge = createGauge('pilots-gauge', maxIndividual);
        pilotsGauge.set(pilotsScore);

        const aircraftGauge = createGauge('aircraft-gauge', maxIndividual);
        aircraftGauge.set(aircraftScore);

        const aerodromesGauge = createGauge('aerodromes-gauge', maxIndividual);
        aerodromesGauge.set(aerodromesScore);

        const opsTypesGauge = createGauge('ops-types-gauge', maxIndividual);
        opsTypesGauge.set(opsTypesScore);

        const totalGauge = createGauge('total-gauge', maxTotal, 'total-score', 'large');
        totalGauge.set(totalScore);
    }

    buildPage();
});