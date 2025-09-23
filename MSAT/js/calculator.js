document.addEventListener('DOMContentLoaded', async () => {
    const STORAGE_KEY = 'msatData';
    let scoringRules = {};
    let msatData = {};
    let fieldData = []; // This will be populated from msat_data.json

    const GAUGE_MAX_VALUE = 7; // Max possible score for any item

    function buildForm(data) {
        const container = document.getElementById('main-container');
        container.innerHTML = ''; 

        const column1 = document.createElement('div');
        column1.className = 'column';
        const column2 = document.createElement('div');
        column2.className = 'column';
        
        data.sections.forEach((section) => {
            const sectionEl = document.createElement('div');
            sectionEl.className = 'section';
            sectionEl.id = `section-${section.id}`;
            
            let sectionContentHtml = `<div class="section-header"><i class="fa-solid ${section.icon}"></i><span>${section.number}. ${section.title}</span></div>
                                      <div class="section-content">
                                          <div class="header-row"><div class="header-cell">Criteria</div><div class="header-cell">Selection</div><div class="header-cell">Score</div></div>`;
            
            section.subsections.forEach(subsection => {
                subsection.items.forEach(item => {
                    const selectId = `q${item.id.replace(/\./g, '-')}`;
                    
                    fieldData.push({ id: selectId, label: `${item.id} ${item.text}`, section: section.id });
                    
                    sectionContentHtml += `
                        <div class="form-row">
                            <div class="form-cell"><strong data-item-id="${item.id}" class="popup-opener">${item.id}</strong> ${item.text}</div>
                            <div class="form-cell">
                                <select id="${selectId}">
                                    <option value="">Select...</option>
                                    <option value="NA">Not Applicable</option>
                                    <option value="P">Present (1)</option>
                                    <option value="S">Suitable (2)</option>
                                    <option value="O">Operating (4)</option>
                                    <option value="E">Effective (7)</option>
                                </select>
                            </div>
                            <div class="form-cell calculated-value" id="${selectId}-value">0</div>
                        </div>`;
                });
            });
            
            sectionContentHtml += '</div>';
            sectionEl.innerHTML = sectionContentHtml;
            
            // UPDATED: New column layout
            if (["1", "2"].includes(section.number)) {
                column1.appendChild(sectionEl);
            } else {
                column2.appendChild(sectionEl);
            }
        });
        
        container.appendChild(column1);
        container.appendChild(column2);
    }
    
    function showPopup(targetElement) {
        const itemId = targetElement.getAttribute('data-item-id');
        const popup = document.getElementById('details-popup');
        
        let itemData = null;
        for (const section of msatData.sections) {
            for (const subsection of section.subsections) {
                const found = subsection.items.find(i => i.id === itemId);
                if (found) {
                    itemData = found;
                    break;
                }
            }
            if (itemData) break;
        }

        if (itemData) {
            let whatToLookForHtml = '';
            if (Array.isArray(itemData.details.whatToLookFor)) {
                whatToLookForHtml = '• ' + itemData.details.whatToLookFor.join('<br>• ');
            } else {
                whatToLookForHtml = itemData.details.whatToLookFor;
            }

            popup.innerHTML = `
                <button id="popup-close-button" aria-label="Close">&times;</button>
                <h4>${itemData.id} ${itemData.text}</h4>
                <div class="popup-section"><strong>Present:</strong> ${itemData.details.Present}</div>
                <div class="popup-section"><strong>Suitable:</strong> ${itemData.details.Suitable}</div>
                <div class="popup-section"><strong>Operating:</strong> ${itemData.details.Operating}</div>
                <div class="popup-section"><strong>Effective:</strong> ${itemData.details.Effective}</div>
                <hr>
                <div class="popup-section"><strong>What to look for:</strong><br>${whatToLookForHtml}</div>
            `;
            popup.style.display = 'block';
            
            const rect = targetElement.getBoundingClientRect();
            let top = rect.bottom + window.scrollY + 5;
            let left = rect.left + window.scrollX;

            popup.style.top = `${top}px`;
            popup.style.left = `${left}px`;

            if (left + popup.offsetWidth > window.innerWidth) {
                popup.style.left = `${window.innerWidth - popup.offsetWidth - 20}px`;
            }
             if (top + popup.offsetHeight > window.innerHeight + window.scrollY) {
                popup.style.top = `${rect.top + window.scrollY - popup.offsetHeight - 5}px`;
            }
        }
    }
    
    function hidePopup() {
        document.getElementById('details-popup').style.display = 'none';
    }

    function calculateFieldScore(selectValue) {
        return scoringRules['generic-score']?.[selectValue] ?? null;
    }

    function applyValueCellStyle(valueCell, score) {
        valueCell.className = 'form-cell calculated-value';
        if (score === null) {
            valueCell.classList.add('bg-default-gray');
            valueCell.textContent = 'N/A';
            return;
        }
        valueCell.textContent = score;
        if (score >= 7) valueCell.classList.add('bg-weak-green');
        else if (score >= 4) valueCell.classList.add('bg-weak-yellow');
        else if (score >= 2) valueCell.classList.add('bg-weak-orange');
        else if (score >= 0) valueCell.classList.add('bg-weak-red');
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
                const score = calculateFieldScore(select.value);
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
        
        const commentEl = document.getElementById('total-score-comment');
        if (grandTotalCount > 0) {
            commentEl.textContent = getRecommendationText(grandTotalAvg);
        } else {
            commentEl.textContent = '';
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
        const dateValue = document.getElementById('assessment-date').value;
        
        let formattedDate = "";
        try {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const year = today.getFullYear();
            formattedDate = `${day}-${month}-${year}`;
            
            if (dateValue) {
                const date = new Date(dateValue);
                const inputDay = String(date.getDate()).padStart(2, '0');
                const inputMonth = String(date.getMonth() + 1).padStart(2, '0');
                const inputYear = date.getFullYear();
                formattedDate = `${inputDay}-${inputMonth}-${inputYear}`;
            }
        } catch (e) {
             const today = new Date();
             formattedDate = today.toLocaleDateString('no-NO'); // Fallback to local format
        }

        const fileName = `${orgName} - MSAT - ${formattedDate}.csv`;

        const primaryHeaders = [
            'Organisation Name', 'Assessed By', 'Date', 'Empic ID',
            'Policy Avg', 'Risk Avg', 'Assurance Avg', 'Promotion Avg', 'Additional Avg',
            'Total Avg Score', 'Comments'
        ];
        const detailHeaders = fieldData.map(field => [`${field.label} (Choice)`, `${field.label} (Score)`]).flat();
        const allHeaders = primaryHeaders.concat(detailHeaders);
        
        const comments = `"${document.getElementById('comments').value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        const primaryData = [
            `"${orgName.replace(/"/g, '""')}"`,
            `"${document.getElementById('assessed-by').value.replace(/"/g, '""')}"`,
            `"${dateValue}"`,
            `"${document.getElementById('empic-id').value.replace(/"/g, '""')}"`,
            document.getElementById('policy-avg').textContent,
            document.getElementById('risk-avg').textContent,
            document.getElementById('assurance-avg').textContent,
            document.getElementById('promotion-avg').textContent,
            document.getElementById('additional-avg').textContent,
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
            const [scoringRes, msatRes] = await Promise.all([
                fetch('data/scoring.json'),
                fetch('data/msat_data.json')
            ]);
            scoringRules = await scoringRes.json();
            msatData = await msatRes.json();
        } catch (error) {
            console.error('Failed to load data files:', error);
            alert('ERROR: Could not load data files (scoring.json, msat_data.json). The page cannot function.');
            return;
        }

        buildForm(msatData);
        
        document.querySelectorAll('input[type="text"], input[type="date"], textarea').forEach(el => {
             el.addEventListener('change', saveData);
             el.addEventListener('keyup', saveData);
        });
        document.querySelectorAll('select').forEach(el => {
            el.addEventListener('change', updateCalculations);
        });
        
        document.addEventListener('click', (e) => {
            const popup = document.getElementById('details-popup');

            if (e.target.matches('.popup-opener')) {
                showPopup(e.target);
            } else if (e.target.id === 'popup-close-button') {
                hidePopup();
            } else if (popup.style.display === 'block' && !popup.contains(e.target) && !e.target.matches('.popup-opener')) {
                hidePopup();
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