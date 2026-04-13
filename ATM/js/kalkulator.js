document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'atmComplexityData';

    const MAX_SCORES = {
        groupA: 46, // 8 + 10 + 8 + 10 + 10
        groupB: 32, // 8 + 8 + 8 + 8
        groupC: 29, // 10 + 9 + 10
        groupD: 18, // 9 + 9
        total: 125
    };

    const fieldData = [
        { id: 'A1', label: 'Types of Services Provided', section: 'groupA' },
        { id: 'A2', label: 'ATS Provision Level', section: 'groupA' },
        { id: 'A3', label: 'Traffic Volume (Movements)', section: 'groupA' },
        { id: 'A4', label: 'Traffic Mix & Airspace', section: 'groupA' },
        { id: 'A5', label: 'Geographic Spread', section: 'groupA' },
        { id: 'B1', label: 'Personnel (ATCO/ATSEP/MET)', section: 'groupB' },
        { id: 'B2', label: 'Subcontracting & Dependencies', section: 'groupB' },
        { id: 'B3', label: 'Interfaces & Coordination (LoAs)', section: 'groupB' },
        { id: 'B4', label: 'Rostering & Fatigue Management', section: 'groupB' },
        { id: 'C1', label: 'CNS System Automation', section: 'groupC' },
        { id: 'C2', label: 'Network & Cybersecurity (Part-IS)', section: 'groupC' },
        { id: 'C3', label: 'Remote Tower Operations', section: 'groupC' },
        { id: 'D1', label: 'Management of Change (MoC)', section: 'groupD' },
        { id: 'D2', label: 'Contingency & Resilience', section: 'groupD' }
    ];

    function calculateFieldScore(selectValue) {
        return parseInt(selectValue) || 0;
    }

    function applyValueCellStyle(valueCell, score) {
        valueCell.className = 'form-cell calculated-value';
        // Skala tilpasset for 1-10 poeng:
        if (score >= 8) valueCell.classList.add('bg-weak-red');
        else if (score >= 4) valueCell.classList.add('bg-weak-yellow');
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
        let totals = { groupA: 0, groupB: 0, groupC: 0, groupD: 0 };

        fieldData.forEach(field => {
            const select = document.getElementById(field.id);
            const valueCell = document.getElementById(field.id + '-value');
            if (select && valueCell) {
                const score = calculateFieldScore(select.value);
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

    function validateForm() {
        const errors = [];
        let isValid = true;
        document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

        const operatorNavnInput = document.getElementById('operator-navn');
        const filledByInput = document.getElementById('filled-by');

        if (!operatorNavnInput.value.trim()) {
            errors.push("Navn på tjenesteyter må fylles ut.");
            operatorNavnInput.classList.add('invalid');
            isValid = false;
        }
        if (!filledByInput.value.trim()) {
            errors.push("Fylt ut av må fylles ut.");
            filledByInput.classList.add('invalid');
            isValid = false;
        }

        fieldData.forEach(field => {
            const select = document.getElementById(field.id);
            if (select && select.value === "") {
                errors.push(`Vennligst gjør et valg for "${field.label}".`);
                select.classList.add('invalid');
                isValid = false;
            }
        });

        if (!isValid) {
            alert("Skjemaet er ikke fullstendig utfylt:\n\n" + errors.join('\n'));
        }
        return isValid;
    }

    function printPDF() {
        if (validateForm()) {
            window.print();
        }
    }

    function getSelectedText(selectId) {
        const selectElement = document.getElementById(selectId);
        if (selectElement && selectElement.selectedIndex >= 0 && selectElement.options[selectElement.selectedIndex]) {
            return selectElement.options[selectElement.selectedIndex].text;
        }
        return "";
    }

    function downloadCSV() {
        if (!validateForm()) { return; }
        const operatorNavn = document.getElementById('operator-navn').value || "Ukjent";
        const dateValue = document.getElementById('date').value || new Date().toISOString().slice(0, 10);
        
        const fileName = `${operatorNavn.replace(/ /g, "_")}_${dateValue}.dat`;

        const primaryHeaders = ['Enhet/Tjenesteyter', 'Fylt ut av', 'Dato', 'Group A Sum', 'Group B Sum', 'Group C Sum', 'Group D Sum', 'Totalsum', 'Kommentarer'];
        const detailHeaders = fieldData.map(field => [`${field.label} (Valg)`, `${field.label} (Verdi)`]).flat();
        const allHeaders = primaryHeaders.concat(detailHeaders);

        const comments = `"${document.getElementById('comments').value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        const primaryData = [
            `"${operatorNavn.replace(/"/g, '""')}"`,
            `"${document.getElementById('filled-by').value.replace(/"/g, '""')}"`,
            `"${dateValue}"`,
            document.getElementById('groupA-sum').textContent,
            document.getElementById('groupB-sum').textContent,
            document.getElementById('groupC-sum').textContent,
            document.getElementById('groupD-sum').textContent,
            document.getElementById('total-gauge-sum-text').textContent,
            comments
        ];
        const detailData = fieldData.map(field => {
            const selectedText = getSelectedText(field.id);
            const score = document.getElementById(field.id + '-value').textContent;
            return [`"${selectedText.replace(/"/g, '""')}"`, score];
        }).flat();

        const allData = primaryData.concat(detailData);
        const csvContent = allHeaders.join(';') + '\r\n' + allData.join(';');
        
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'application/octet-stream' });
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
                alert("Filen er tom eller ugyldig.");
                return;
            }

            const headers = lines[0].split(';').map(h => parseCsvField(h));
            const data = lines[1].split(';').map(d => parseCsvField(d));
            const headerMap = Object.fromEntries(headers.map((h, i) => [h, i]));

            document.getElementById('operator-navn').value = data[headerMap['Enhet/Tjenesteyter']] || '';
            document.getElementById('filled-by').value = data[headerMap['Fylt ut av']] || '';
            document.getElementById('date').value = data[headerMap['Dato']] || '';

            fieldData.forEach(field => {
                const select = document.getElementById(field.id);
                if (select) {
                    const choiceHeader = `${field.label} (Valg)`;
                    const choiceIndex = headerMap[choiceHeader];
                    if (choiceIndex !== undefined && data[choiceIndex] !== undefined) {
                        const valueToFind = data[choiceIndex];
                        const option = Array.from(select.options).find(opt => opt.text === valueToFind);
                        select.value = option ? option.value : "";
                    }
                }
            });

            const commentsIndex = headerMap['Kommentarer'];
            if (commentsIndex !== undefined) {
                document.getElementById('comments').value = data[commentsIndex] || '';
            }

            updateCalculations();
            alert("Data lastet inn!");
        };
        reader.readAsText(file, "UTF-8");
    }

    async function init() {
        // Prøver å laste operatørliste (hvis filen ikke finnes feiler den lydløst)
        try {
            const operatorsRes = await fetch('data/operators.json');
            if(operatorsRes.ok) {
                const operators = await operatorsRes.json();
                const datalist = document.getElementById('operator-list');
                operators.forEach(op => {
                    const option = document.createElement('option');
                    option.value = op;
                    datalist.appendChild(option);
                });
            }
        } catch (error) {
            console.log('Ingen operators.json funnet for ATM, fortsetter uten autofullfør.');
        }

        Object.keys(MAX_SCORES).forEach(key => {
            const sumEl = document.getElementById(`${key}-max-sum`);
            const gaugeEl = document.getElementById(`${key}-gauge-max-text`);
            if (sumEl) sumEl.textContent = MAX_SCORES[key];
            if (gaugeEl) gaugeEl.textContent = MAX_SCORES[key];
        });

        document.querySelectorAll('input[type="text"], input[type="date"], select, textarea').forEach(el => {
            el.addEventListener('change', updateCalculations);
            if (el.matches('input[type="text"], textarea')) {
                el.addEventListener('keyup', saveData);
            }
        });

        // Knytt opp funksjonene til felles_knapper (som lastes fra ../js/felles_knapper.js)
        setTimeout(() => {
            const clearBtn = document.getElementById('clear-form-button');
            const downBtn = document.getElementById('download-csv-button');
            const printBtn = document.getElementById('print-pdf-button');
            const loadBtn = document.getElementById('load-csv-button');
            const fileInp = document.getElementById('csv-file-input');

            if(clearBtn) clearBtn.addEventListener('click', clearForm);
            if(downBtn) downBtn.addEventListener('click', downloadCSV);
            if(printBtn) printBtn.addEventListener('click', printPDF);
            if(loadBtn && fileInp) {
                loadBtn.addEventListener('click', () => fileInp.click());
                fileInp.addEventListener('change', loadCsvFile);
            }
        }, 100);

        document.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('input', () => el.classList.remove('invalid'));
            el.addEventListener('change', () => el.classList.remove('invalid'));
        });

        // Drag and drop for CSV / DAT filer
        const dropZone = document.body;
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover-active'), false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover-active'), false);
        });

        dropZone.addEventListener('drop', e => {
            let dt = e.dataTransfer;
            let files = dt.files;
            if (files.length > 0) {
                const fileName = files[0].name.toLowerCase();
                if (fileName.endsWith('.csv') || fileName.endsWith('.txt') || fileName.endsWith('.dat')) {
                    loadCsvFile({ target: { files: files } }); 
                } else {
                    alert("Vennligst slipp kun .dat eller .csv filer.");
                }
            }
        }, false);

        loadData();
        if (!document.getElementById('date').value) {
            document.getElementById('date').valueAsDate = new Date();
        }

        updateCalculations();
    }

    init();
});