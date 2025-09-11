document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'msatData';
    let scoringRules = {};

    const GAUGE_MAX_VALUE = 7; // Max possible score for any item

    const fieldData = [
        // Section 1: Policy
        { id: 'q1-1-1-signed', label: '1.1.1 The safety policy is signed by the Accountable Manager.', section: 'policy' },
        { id: 'q1-1-1-reviewed', label: '1.1.1 The safety policy is periodically reviewed.', section: 'policy' },
        { id: 'q1-1-2-resources', label: '1.1.2 The safety policy includes a statement about provision of necessary resources.', section: 'policy' },
        { id: 'q1-1-3-communicated', label: '1.1.3 The safety policy is communicated throughout the organisation.', section: 'policy' },
        { id: 'q1-1-4-culture', label: '1.1.4 The safety policy reflects organizational commitment and promotes a positive safety culture.', section: 'policy' },
        { id: 'q1-1-5-justculture', label: '1.1.5 The safety policy indicates unacceptable behaviours and conditions for disciplinary action (Just Culture).', section: 'policy' },
        { id: 'q1-1-6-monitoring', label: '1.1.6 Safety objectives form the basis for safety performance monitoring.', section: 'policy' },
        { id: 'q1-1-6-effectiveness', label: '1.1.6 Safety objectives reflect commitment to maintain or improve SMS effectiveness.', section: 'policy' },
        { id: 'q1-1-6-communicated', label: '1.1.6 Safety objectives are communicated throughout the organisation.', section: 'policy' },
        { id: 'q1-1-6-reviewed', label: '1.1.6 Safety objectives are periodically reviewed.', section: 'policy' },
        { id: 'q1-2-1-am', label: '1.2.1 The Accountable Manager is identified and accountable for the SMS.', section: 'policy' },
        { id: 'q1-2-2-lines', label: '1.2.2 Lines of safety accountability are clearly defined.', section: 'policy' },
        { id: 'q1-2-2-resp', label: '1.2.2 Responsibilities of all management and employees are identified.', section: 'policy' },
        { id: 'q1-2-2-doc', label: '1.2.2 Safety accountability, responsibilities, and authorities are documented and communicated.', section: 'policy' },
        { id: 'q1-2-2-levels', label: '1.2.2 Levels of management with authority for safety risk tolerability are defined.', section: 'policy' },
        { id: 'q1-3-1-sm', label: '1.3.1 A safety manager is appointed and responsible for the SMS.', section: 'policy' },
        { id: 'q1-3-2-key', label: '1.3.2 Key personnel are appointed for complex organisation(s).', section: 'policy' },
        { id: 'q1-4-0-erp', label: '1.4.0 Emergency Response Plan (ERP) is established and coordinated.', section: 'policy' },
        { id: 'q1-5-1-polobj', label: '1.5.1 SMS manual describes safety policy and objectives.', section: 'policy' },
        { id: 'q1-5-1-req', label: '1.5.1 SMS manual describes SMS requirements.', section: 'policy' },
        { id: 'q1-5-1-proc', label: '1.5.1 SMS manual describes SMS processes and procedures.', section: 'policy' },
        { id: 'q1-5-1-acc', label: '1.5.1 SMS manual describes accountability, responsibilities and authorities.', section: 'policy' },
        { id: 'q1-5-2-records', label: '1.5.2 SMS operational records are developed and maintained.', section: 'policy' },
        // Section 2: Risk
        { id: 'q2-1-1-hazid', label: '2.1.1 A process to identify hazards is developed and maintained (reactive and proactive).', section: 'risk' },
        { id: 'q2-1-2-occrep', label: '2.1.2 Occurrence reporting procedures are established (iaw. Reg (EU) 376/2014).', section: 'risk' },
        { id: 'q2-2-analysis', label: '2.2 A process for safety risk analysis, assessment and control is developed and maintained.', section: 'risk' },
        { id: 'q2-2-control', label: '2.2 A process for safety risk control associated with identified hazards is developed and maintained.', section: 'risk' },
        // Section 3: Assurance
        { id: 'q3-1-1-verify', label: '3.1.1 Means to verify safety performance and validate effectiveness of risk controls are developed and maintained.', section: 'assurance' },
        { id: 'q3-1-2-indicators', label: '3.1.2 Safety performance is verified against performance indicators and targets.', section: 'assurance' },
        { id: 'q3-2-1-moc', label: '3.2.1 A process to identify and manage safety risks from changes is developed and maintained.', section: 'assurance' },
        { id: 'q3-3-1-improvement', label: '3.3.1 SMS processes are monitored and assessed to continuously improve overall effectiveness.', section: 'assurance' },
        // Section 4: Promotion
        { id: 'q4-1-1-training', label: '4.1.1 A safety training programme ensures personnel are trained and competent for their SMS duties.', section: 'promotion' },
        { id: 'q4-1-2-competence', label: '4.1.2 A process evaluates individual competence and takes remedial action when necessary.', section: 'promotion' },
        { id: 'q4-1-2-trainers', label: '4.1.2 The competence of trainers is defined, assessed, and remediated when necessary.', section: 'promotion' },
        { id: 'q4-2-1-aware', label: '4.2.1 Formal means for safety communication ensures personnel are aware of the SMS.', section: 'promotion' },
        { id: 'q4-2-1-critical', label: '4.2.1 Formal means for safety communication conveys safety-critical information.', section: 'promotion' },
        { id: 'q4-2-1-actions', label: '4.2.1 Formal means for safety communication explains why actions are taken to improve safety.', section: 'promotion' },
        { id: 'q4-2-1-procedures', label: '4.2.1 Formal means for safety communication explains why safety procedures are introduced or changed.', section: 'promotion' },
        // Section 5: Additional
        { id: 'q5-1-1-interface', label: '5.1.1 Interface management with other organisations is considered.', section: 'additional' },
        { id: 'q5-2-1-compliance', label: '5.2.1 Responsibilities and accountability for ensuring compliance are defined.', section: 'additional' },
        { id: 'q5-2-2-monitoring', label: '5.2.2 Responsibilities and accountabilities for compliance monitoring are defined.', section: 'additional' },
        { id: 'q5-2-3-programme', label: '5.2.3 A compliance monitoring programme is established.', section: 'additional' },
        { id: 'q5-2-4-outcomes', label: '5.2.4 Compliance monitoring outcomes (e.g., audit results) are followed up.', section: 'additional' },
    ];
    
    function calculateFieldScore(fieldId, selectValue) {
        if (!selectValue || selectValue === "NA") return null;

        // NEW: Special scoring for signed policy question
        if (fieldId === 'q1-1-1-signed' && selectValue === 'N') {
            return 1;
        }
        
        return scoringRules['generic-score']?.[selectValue] ?? 0;
    }

    function applyValueCellStyle(valueCell, score) {
        valueCell.className = 'form-cell calculated-value';
        if (score === null) {
            valueCell.classList.add('bg-default-gray');
            valueCell.textContent = 'N/A';
            return;
        }
        valueCell.textContent = score;
        if (score >= 7) valueCell.classList.add('bg-weak-green');      // Effective
        else if (score >= 4) valueCell.classList.add('bg-weak-yellow'); // Operating
        else if (score >= 2) valueCell.classList.add('bg-weak-orange'); // Suitable
        else if (score >= 0) valueCell.classList.add('bg-weak-red');    // Present / No
    }
    
    function updateGauge(prefix, value, maxValue) {
        const needle = document.getElementById(prefix + '-needle');
        if (!needle) return;
        const percentage = maxValue > 0 ? value / maxValue : 0;
        const rotation = -90 + (percentage * 180);
        needle.style.transform = `translateX(-50%) rotate(${Math.min(90, Math.max(-90, rotation))}deg)`;
    }
    
    function getRecommendationText(score) {
        if (score >= 5.5) return "The organisation's management system is considered to be at an Effective level. Extension of cycle could be considered (max 48 months).";
        if (score >= 3) return "The organisation's management system is considered to be at an Operating level. Extension of cycle could be considered (max 36 months). Pay attention to elements scoring less than 4.";
        if (score >= 2) return "The organisation's management system is considered to be at a Suitable level. Pay attention to elements scoring less than 4. Consider follow up surveillance, issuance of findings and planning cycle less than 24 months.";
        return "The organisation's management system is considered to be at a Present level. Consider suspension, issuance of findings and planning cycle less than 24 months.";
    }

    function updateCalculations() {
        let sums = { policy: 0, risk: 0, assurance: 0, promotion: 0, additional: 0 };
        let counts = { policy: 0, risk: 0, assurance: 0, promotion: 0, additional: 0 };
        
        fieldData.forEach(field => {
            const select = document.getElementById(field.id);
            const valueCell = document.getElementById(field.id + '-value');
            if (select && valueCell) {
                const score = calculateFieldScore(field.id, select.value);
                applyValueCellStyle(valueCell, score);
                if (score !== null) {
                    sums[field.section] += score;
                    counts[field.section]++;
                }
            }
        });

        let grandTotalSum = 0;
        let grandTotalCount = 0;

        for (const section in sums) {
            const avg = counts[section] > 0 ? sums[section] / counts[section] : 0;
            document.getElementById(`${section}-avg`).textContent = avg.toFixed(1);
            updateGauge(section, avg, GAUGE_MAX_VALUE);
            grandTotalSum += sums[section];
            grandTotalCount += counts[section];
        }

        const grandTotalAvg = grandTotalCount > 0 ? grandTotalSum / grandTotalCount : 0;
        document.getElementById('total-gauge-avg-text').textContent = grandTotalAvg.toFixed(1);
        updateGauge('total', grandTotalAvg, GAUGE_MAX_VALUE);

        // NEW: Logic to show/hide recommendation text
        const commentEl = document.getElementById('total-score-comment');
        if (grandTotalCount > 0) {
            commentEl.textContent = getRecommendationText(grandTotalAvg);
        } else {
            commentEl.textContent = ''; // Clear text if form is empty
        }
        
        saveData();
    }

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
        if (confirm("Are you sure you want to clear the form? All saved data will be deleted.")) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        }
    }

    function printPDF() {
        window.print();
    }
    
    function getSelectedText(selectId) {
        const selectElement = document.getElementById(selectId);
        if (selectElement && selectElement.selectedIndex >= 0 && selectElement.options[selectElement.selectedIndex]) {
            return selectElement.options[selectElement.selectedIndex].text;
        }
        return "";
    }
    
    function downloadCSV() {
        const orgName = document.getElementById('organisation-name').value || "UnknownOrganisation";
        const dateValue = document.getElementById('assessment-date').value || new Date().toISOString().slice(0, 10);
        const fileName = `MSAT_${orgName.replace(/ /g, "_")}_${dateValue}.csv`;

        const primaryHeaders = ['Organisation Name', 'Assessed By', 'Date', 'Empic ID', 'Total Avg Score', 'Comments'];
        const detailHeaders = fieldData.map(field => [`${field.label} (Choice)`, `${field.label} (Score)`]).flat();
        const allHeaders = primaryHeaders.concat(detailHeaders);
        
        const comments = `"${document.getElementById('comments').value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        const primaryData = [
            `"${orgName.replace(/"/g, '""')}"`,
            `"${document.getElementById('assessed-by').value.replace(/"/g, '""')}"`,
            `"${dateValue}"`,
            `"${document.getElementById('empic-id').value.replace(/"/g, '""')}"`,
            document.getElementById('total-gauge-avg-text').textContent,
            comments
        ];
        const detailData = fieldData.map(field => {
            const selectedText = getSelectedText(field.id);
            const scoreText = document.getElementById(field.id + '-value').textContent;
            return [`"${selectedText.replace(/"/g, '""')}"`, scoreText];
        }).flat();
        
        const allData = primaryData.concat(detailData);
        const csvContent = allHeaders.join(';') + '\r\n' + allData.join(';');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    function parseCsvField(field) {
        field = field ? field.trim() : '';
        if (field.startsWith('"') && field.endsWith('"')) {
            field = field.substring(1, field.length - 1).replace(/""/g, '"');
        }
        return field;
    }

    function loadCsvFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const lines = e.target.result.split(/\r?\n/);
            if (lines.length < 2) {
                alert("CSV file is empty or invalid.");
                return;
            }

            const headers = lines[0].split(';').map(h => parseCsvField(h));
            const data = lines[1].split(';').map(d => parseCsvField(d));
            const headerMap = Object.fromEntries(headers.map((h, i) => [h, i]));

            document.getElementById('organisation-name').value = data[headerMap['Organisation Name']] || '';
            document.getElementById('assessed-by').value = data[headerMap['Assessed By']] || '';
            document.getElementById('assessment-date').value = data[headerMap['Date']] || '';
            document.getElementById('empic-id').value = data[headerMap['Empic ID']] || '';
            
            fieldData.forEach(field => {
                const select = document.getElementById(field.id);
                if (select) {
                    const choiceHeader = `${field.label} (Choice)`;
                    const choiceIndex = headerMap[choiceHeader];
                    if (choiceIndex !== undefined && data[choiceIndex] !== undefined) {
                        const valueToFind = data[choiceIndex];
                        const option = Array.from(select.options).find(opt => opt.text === valueToFind);
                        select.value = option ? option.value : "";
                    }
                }
            });

            const commentsIndex = headerMap['Comments'];
            if (commentsIndex !== undefined) {
                document.getElementById('comments').value = data[commentsIndex] || '';
            }
            
            updateCalculations();
            alert("CSV file loaded successfully!");
        };
        reader.readAsText(file, "UTF-8");
    }

    async function init() {
        try {
            const scoringRes = await fetch('data/scoring.json');
            scoringRules = await scoringRes.json();
        } catch (error) {
            console.error('Failed to load data file (scoring.json):', error);
            alert('ERROR: Could not load data file (scoring.json). The page cannot function.');
            return;
        }

        document.querySelectorAll('input[type="text"], input[type="date"], select, textarea').forEach(el => {
            el.addEventListener('change', updateCalculations);
            if (el.matches('input[type="text"], textarea')) {
                el.addEventListener('keyup', saveData);
            }
        });
        
        document.getElementById('clear-form-button').addEventListener('click', clearForm);
        document.getElementById('download-csv-button').addEventListener('click', downloadCSV);
        document.getElementById('print-pdf-button').addEventListener('click', printPDF);
        
        const loadCsvButton = document.getElementById('load-csv-button');
        const csvFileInput = document.getElementById('csv-file-input');
        loadCsvButton.addEventListener('click', () => csvFileInput.click());
        csvFileInput.addEventListener('change', loadCsvFile);

        loadData();
        if (!document.getElementById('assessment-date').value) {
            document.getElementById('assessment-date').valueAsDate = new Date();
        }

        updateCalculations();
    }

    init();
});