document.addEventListener('DOMContentLoaded', async () => {
    const t = (k) => (window.I18n ? window.I18n.t(k) : k);

    const fieldIdToDetails = {
        // Resources
        'antall-baser': { section: 'resources' },
        'antall-piloter': { section: 'resources' },
        'pilot-employment': { section: 'resources' },
        'ledende-personell-roller': { section: 'resources' },
        'krav-eksamen': { section: 'resources' },
        'manualverk': { section: 'resources' },
        // Fleet
        'tyngste-fartoy': { section: 'fleet' },
        'antall-fartoy': { section: 'fleet' },
        'antall-typer': { section: 'fleet' },
        'c2link': { section: 'fleet' },
        'modifiserte-fartoy': { section: 'fleet' },
        'test-development': { section: 'fleet' },
        // Operations
        'synsvidde': { section: 'operations' },
        'flyhoyde': { section: 'operations' },
        'operasjonsmiljo': { section: 'operations' },
        'flytimer': { section: 'operations' },
        'antall-oats-luc': { section: 'operations' },
        'redusert-grc': { section: 'operations' },
        'omrade': { section: 'operations' },
        'sail': { section: 'operations' },
        'annen-risiko': { section: 'operations' },
        // Performance
        'bekymringsmeldinger': { section: 'performance' },
        'veiledningsbehov': { section: 'performance' },
        'mangler-oat-empic': { section: 'performance' },
        'tid-siste-tilsyn': { section: 'performance' },
        'niva1-avvik': { section: 'performance' },
        'niva2-avvik': { section: 'performance' },
        'frist-lukking': { section: 'performance' },
        'sms-tilsyn': { section: 'performance' },
        'tid-forstegangsgodkjenning': { section: 'performance' }
    };

    // id -> i18n-nøkkel for kriterietekst (samme tekst som hovedskjemaet).
    const labelKeys = {
        'antall-baser': 'uas.cAntallBaser', 'antall-piloter': 'uas.cAntallPiloter',
        'pilot-employment': 'uas.cPilotEmployment', 'ledende-personell-roller': 'uas.cLedendeRoller',
        'krav-eksamen': 'uas.cKravEksamen', 'manualverk': 'uas.cManualverk',
        'tyngste-fartoy': 'uas.cTyngsteFartoy', 'antall-fartoy': 'uas.cAntallFartoy',
        'antall-typer': 'uas.cAntallTyper', 'c2link': 'uas.cC2link',
        'modifiserte-fartoy': 'uas.cModifiserte', 'test-development': 'uas.cTestDevelopment',
        'synsvidde': 'uas.cSynsvidde', 'flyhoyde': 'uas.cFlyhoyde',
        'operasjonsmiljo': 'uas.cOperasjonsmiljo', 'flytimer': 'uas.cFlytimer',
        'antall-oats-luc': 'uas.ovOatLuc', 'redusert-grc': 'uas.cRedusertGrc',
        'omrade': 'uas.cOmrade', 'sail': 'uas.cSail', 'annen-risiko': 'uas.cAnnenRisiko',
        'bekymringsmeldinger': 'uas.cBekymringsmeldinger', 'veiledningsbehov': 'uas.cVeiledningsbehov',
        'mangler-oat-empic': 'uas.cManglerEmpic', 'tid-siste-tilsyn': 'uas.ovTimeLastAudit',
        'niva1-avvik': 'uas.cNiva1', 'niva2-avvik': 'uas.cNiva2',
        'frist-lukking': 'uas.cFristLukking', 'sms-tilsyn': 'uas.cSms',
        'tid-forstegangsgodkjenning': 'uas.ovTimeInitial'
    };

    // Oversettbare valg-verdier -> i18n-nøkkel (vist tekst). Verdier som ikke
    // finnes her (tall, enheter, koder, SMS-nivåer) vises via engelsk fallback.
    const valueToKey = {
        'kun-hovedbase': 'uas.baseMainOnly', '3-eller-mindre': 'uas.base3orLess', '4-eller-mer': 'uas.base4orMore',
        '10-eller-mindre': 'uas.pilot10orLess', '10-20': 'uas.pilot10to20', '20-eller-flere': 'uas.pilot20orMore',
        'ansatt-hos-operator': 'uas.empOperator', 'annet-selskap': 'uas.empOther',
        'Nei': 'uas.optNo', 'Ja': 'uas.optYes',
        'laget-selv': 'uas.manSelf', 'kjopt': 'uas.manPurchased',
        'Direkte': 'uas.c2Direct', 'Ingen': 'uas.c2None',
        'Presist': 'uas.areaPrecise', 'Generisk': 'uas.areaGeneric',
        'BVLOS-observer': 'uas.bvlosObs', 'BVLOS-no-observer': 'uas.bvlosNoObs',
        'under-400': 'uas.altUnder400', 'over-400': 'uas.altOver400', 'fareomrade': 'uas.altDanger',
        'Spredtbefolket': 'uas.envSparse', 'Befolket': 'uas.envPopulated',
        'afis-flyplass': 'uas.envAfis', 'ctr-flyplass': 'uas.envCtr',
        'minus-1-2': 'uas.grcMinus12', 'minus-3-mer': 'uas.grcMinus3',
        'under-100': 'uas.fhUnder100', 'over-100': 'uas.fhOver100', 'over-1000': 'uas.fhOver1000',
        'Noe': 'uas.optSome', 'Betydelig': 'uas.optSignificant', 'Middels': 'uas.optMedium',
        'Alvorlig': 'uas.repSevere', 'Lite': 'uas.guideLittle', 'Stort': 'uas.guideHigh',
        '12-eller-mer': 'uas.niva2More', 'Overholdt': 'uas.deadlineMet', 'Overskredet': 'uas.deadlineExceeded',
        'under-1ar': 'uas.timeUnder1', '1-2ar': 'uas.time1to2', '2-3ar': 'uas.time2to3', 'over-3ar': 'uas.timeOver3'
    };

    // Engelsk fallback for verdier uten egen oversettelse (tall/enheter/koder).
    const valueToDisplayTextMap = {
        '<250g': '< 250 g', '250g-2kg': '250 g - 2 kg', '2-4kg': '2 - 4 kg', '4-25kg': '4 - 25 kg', '25-250kg': '25 - 250 kg', '>250kg': '> 250 kg',
        '1-5': '1 - 5', '6-15': '6 - 15', '16-50': '16 - 50', 'over-50': '> 50',
        '2-3': '2 - 3', 'over-3': '> 3',
        '0-3': '0 - 3', '4-7': '4 - 7', '8-11': '8 - 11',
        '3-4': '3-4', 'over-5': '>5'
    };

    const displayFor = (optionValue) =>
        (valueToKey[optionValue] ? t(valueToKey[optionValue]) : (valueToDisplayTextMap[optionValue] || optionValue));

    let scoringRules = null;

    function buildTables() {
        if (!scoringRules) return;
        ['resources', 'fleet', 'operations', 'performance'].forEach(sec => {
            const body = document.getElementById(`${sec}-body`);
            if (body) body.innerHTML = '';
        });

        for (const [id, details] of Object.entries(fieldIdToDetails)) {
            const rule = scoringRules[id];
            if (!rule) continue;

            const tableBody = document.getElementById(`${details.section}-body`);
            if (!tableBody) continue;

            const label = labelKeys[id] ? t(labelKeys[id]) : id;
            let html = '';
            const options = Object.entries(rule);
            const rowCount = options.length;

            options.forEach(([optionValue, score], index) => {
                html += '<tr>';
                if (index === 0) {
                    html += `<td rowspan="${rowCount}">${label}</td>`;
                }
                let scoreDisplay;
                if (typeof score === 'object' && score.type === 'additive-dependent') {
                    scoreDisplay = `${score.baseValue} + ${t('uas.ovDependent')}`;
                } else {
                    scoreDisplay = score;
                }
                html += `<td>${displayFor(optionValue)}</td>`;
                html += `<td>${scoreDisplay}</td>`;
                html += '</tr>';
            });
            tableBody.innerHTML += html;
        }
    }

    try {
        const response = await fetch('data/scoring.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        scoringRules = await response.json();
        buildTables();
        window.addEventListener('languageChanged', buildTables);
    } catch (error) {
        console.error('Could not load or build the scoring details table:', error);
        document.body.innerHTML = `<h1>${t('uas.ovLoadErrorTitle')}</h1><p>${t('uas.ovLoadErrorBody').replace('{msg}', error.message)}</p>`;
    }
});
