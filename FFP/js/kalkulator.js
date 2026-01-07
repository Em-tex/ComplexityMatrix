document.addEventListener('DOMContentLoaded', () => {
    // --- Data Definitions ---
    const criteriaData = [
        { 
            id: "tverrfaglig", 
            title: "Tverrfaglige innspill", 
            info: "FFO, FUL, FFS.",
            options: [
                { val: 0, text: "Ingen innvendinger" },
                { val: 2, text: "Noen bemerkninger" },
                { val: 5, text: "Innvendinger/Krav fra fagavd." }
            ]
        },
        { 
            id: "hendelser", 
            title: "Hendelser og sikkerhetstilrådninger", 
            info: "Det aktuelle luftfartshinderet har vært årsak/ faktor til luftfartshendelse.",
            options: [
                { val: 0, text: "Ingen kjente hendelser" },
                { val: 5, text: "Tidligere hendelser/tilrådninger" }
            ]
        },
        { 
            id: "andre_hindre", 
            title: "Andre luftfartshindre i nærheten", 
            info: "Ref. Gullesfjord: Spesielt relevant hvis ett er merkepliktig, mens tilstøtende ikke er det.",
            options: [
                { val: 0, text: "Ingen andre hindre / Alle merket" },
                { val: 3, text: "Hindre i nærheten" },
                { val: 5, text: "Umerkede hindre i umiddelbar nærhet" }
            ]
        },
        { 
            id: "kryssende", 
            title: "Kryssende luftspenn", 
            info: "Luftspenn underlagt krav til linjebefaring og som krysser under overliggende luftspenn (Ref forskrift 2023 nr. 2158).",
            options: [
                { val: 0, text: "Nei" },
                { val: 5, text: "Ja" }
            ]
        },
        { 
            id: "seilingshoyde", 
            title: "Seilingshøyde", 
            info: "Stor differanse mellom linjestrekk endemaster og seilingshøyde øker risiko (Ref. Gullesfjord: Rapportert 96m, reell 27m).",
            options: [
                { val: 0, text: "Liten/ingen differanse" },
                { val: 2, text: "Moderat differanse" },
                { val: 5, text: "Stor differanse / Høy risiko" }
            ]
        },
        { 
            id: "lufthavner", 
            title: "Lufthavner og landingsplasser", 
            info: "Nærhet til lufthavner eller innflygingstraséer.",
            options: [
                { val: 0, text: "Ingen i nærheten (>15 km)" },
                { val: 2, text: "I nærheten (5-15 km)" },
                { val: 5, text: "I innflygingssone / nær (<5 km)" }
            ]
        },
        { 
            id: "luftrom", 
            title: "Luftromsaktivitet", 
            info: "PINS-ruter, SAR/ HEMS, allmennflyging.",
            options: [
                { val: 0, text: "Lite aktivitet" },
                { val: 3, text: "Generell flyging" },
                { val: 5, text: "Kjent SAR/HEMS rute eller PINS" }
            ]
        },
        { 
            id: "vaer", 
            title: "Lokale værforhold", 
            info: "Områder spesielt utsatt for lokale værforhold (eks. tåke ved Røssvoll).",
            options: [
                { val: 0, text: "Normale forhold" },
                { val: 3, text: "Noe utsatt" },
                { val: 5, text: "Spesielt utsatt (ofte tåke/lavt skydekke)" }
            ]
        },
        { 
            id: "grensesnitt", 
            title: "Grensesnitt andre operative miljøer", 
            info: "Eks. kan skipsfarten blendes av sterk lysmerking. Fysisk merking kan medføre fallende objekter.",
            options: [
                { val: 0, text: "Ingen konflikt" },
                { val: 5, text: "Konflikt identifisert (vei/sjø)" }
            ]
        },
        { 
            id: "tid", 
            title: "Tidsaspekt", 
            info: "Gjenværende levetid på luftfartshinderet.",
            options: [
                { val: 0, text: "Kortvarig / Skal rives snart" },
                { val: 2, text: "Mellomlang sikt" },
                { val: 5, text: "Permanent / Lang levetid" }
            ]
        },
        { 
            id: "ugunst", 
            title: "Hindereiers ugunst", 
            info: "Kost/nytte-vurdering. Risiko for arbeid og vedlikehold.",
            options: [
                { val: 0, text: "Høy nytte / Lav ugunst ved merking" },
                { val: 2, text: "Moderat" },
                { val: 5, text: "Stor ugunst / Høy kostnad/risiko ved merking" }
            ]
        }
    ];

    const maxTotalScore = 55; // 11 kriterier * maks 5 poeng

    // --- Build UI ---
    const container = document.getElementById('criteria-container');
    
    criteriaData.forEach(c => {
        const box = document.createElement('div');
        box.className = 'criterion-box';
        
        let optionsHtml = `<option value="0">Velg vurdering...</option>`;
        c.options.forEach(opt => {
            optionsHtml += `<option value="${opt.val}">${opt.text} (${opt.val}p)</option>`;
        });

        box.innerHTML = `
            <div class="criterion-header">
                <span class="criterion-title">${c.title}</span>
                <div class="tooltip-container">
                    <span class="tooltip-icon">?</span>
                    <span class="tooltip-text">${c.info}</span>
                </div>
            </div>
            <select id="select-${c.id}" class="criterion-select" data-id="${c.id}">
                ${optionsHtml}
            </select>
            <textarea id="comment-${c.id}" class="criterion-comment" rows="2" placeholder="Kommentar..."></textarea>
        `;
        container.appendChild(box);
    });

    // --- Map Logic (Leaflet) ---
    // Startposisjon: Norge (omtrent midt i)
    const map = L.map('map').setView([65.0, 13.0], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    let currentMarker = null;

    map.on('click', function(e) {
        setMarker(e.latlng.lat, e.latlng.lng);
    });

    function setMarker(lat, lng) {
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }
        currentMarker = L.marker([lat, lng]).addTo(map);
        document.getElementById('latitude').value = lat.toFixed(6);
        document.getElementById('longitude').value = lng.toFixed(6);
        document.getElementById('koordinater-visning').textContent = `Valgt: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    document.getElementById('undo-map-button').addEventListener('click', () => {
        if (currentMarker) {
            map.removeLayer(currentMarker);
            currentMarker = null;
        }
        document.getElementById('latitude').value = '';
        document.getElementById('longitude').value = '';
        document.getElementById('koordinater-visning').textContent = 'Ingen plassering valgt';
    });

    // --- Calculation Logic ---
    function updateScore() {
        let total = 0;
        criteriaData.forEach(c => {
            const select = document.getElementById(`select-${c.id}`);
            total += parseInt(select.value) || 0;
        });

        document.getElementById('total-score').textContent = total;
        document.getElementById('max-score').textContent = maxTotalScore;

        // Update Needle
        const needle = document.getElementById('risk-needle');
        const percentage = total / maxTotalScore;
        const rotation = -90 + (percentage * 180);
        needle.style.transform = `translateX(-50%) rotate(${Math.min(90, Math.max(-90, rotation))}deg)`;

        // Update Label text
        const label = document.getElementById('risk-label-text');
        if (total < 15) { label.textContent = "Lav Risiko (Ingen tiltak)"; label.style.color = "green"; }
        else if (total < 35) { label.textContent = "Middels Risiko (Vurder merking)"; label.style.color = "#d4ac0d"; }
        else { label.textContent = "Høy Risiko (Tiltak påkreves)"; label.style.color = "red"; }
    }

    // Add listeners
    document.querySelectorAll('select').forEach(el => el.addEventListener('change', updateScore));

    // --- CSV Export/Import Logic ---
    document.getElementById('download-csv-button').addEventListener('click', () => {
        const eier = document.getElementById('hindereier').value || "Ukjent";
        const dato = document.getElementById('date').value || new Date().toISOString().slice(0,10);
        const filnavn = `Risiko_${eier.replace(/\s/g, '_')}_${dato}.dat`;

        // Headers
        let csvContent = "Eier;Hindertype;Sted;Fylt ut av;Dato;Breddegrad;Lengdegrad;Total Score;";
        criteriaData.forEach(c => {
            csvContent += `${c.title} (Verdi);${c.title} (Kommentar);`;
        });
        csvContent += "\n";

        // Values
        const lat = document.getElementById('latitude').value;
        const long = document.getElementById('longitude').value;
        const score = document.getElementById('total-score').textContent;

        let row = [
            `"${document.getElementById('hindereier').value.replace(/"/g, '""')}"`,
            `"${document.getElementById('hindertype').value.replace(/"/g, '""')}"`,
            `"${document.getElementById('sted').value.replace(/"/g, '""')}"`,
            `"${document.getElementById('filled-by').value.replace(/"/g, '""')}"`,
            `"${dato}"`,
            lat,
            long,
            score
        ];

        criteriaData.forEach(c => {
            const val = document.getElementById(`select-${c.id}`).value;
            const comm = document.getElementById(`comment-${c.id}`).value.replace(/\n/g, ' ').replace(/"/g, '""');
            row.push(val);
            row.push(`"${comm}"`);
        });

        csvContent += row.join(';');

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'application/octet-stream' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filnavn;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Import logic
    const fileInput = document.getElementById('csv-file-input');
    document.getElementById('load-csv-button').addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const lines = e.target.result.split(/\r?\n/);
            if(lines.length < 2) return alert("Ugyldig fil");
            
            // Enkel parsing som håndterer semikolon. OBS: For robusthet bør en ordentlig CSV-parser brukes.
            // Her splitter vi enkelt, og fjerner anførselstegn manuelt.
            const values = lines[1].split(';').map(v => {
                if(v.startsWith('"') && v.endsWith('"')) return v.substring(1, v.length-1).replace(/""/g, '"');
                return v;
            });
            
            document.getElementById('hindereier').value = values[0] || '';
            document.getElementById('hindertype').value = values[1] || '';
            document.getElementById('sted').value = values[2] || '';
            document.getElementById('filled-by').value = values[3] || '';
            document.getElementById('date').value = values[4] || '';
            
            const lat = parseFloat(values[5]);
            const long = parseFloat(values[6]);
            if (!isNaN(lat) && !isNaN(long)) {
                setMarker(lat, long);
                map.setView([lat, long], 10);
            }

            // Fill criteria (starting at index 8)
            let idx = 8;
            criteriaData.forEach(c => {
                if(values[idx] !== undefined) document.getElementById(`select-${c.id}`).value = values[idx];
                if(values[idx+1] !== undefined) document.getElementById(`comment-${c.id}`).value = values[idx+1];
                idx += 2;
            });
            updateScore();
            alert("Fil lastet inn!");
        };
        reader.readAsText(file);
    });

    document.getElementById('clear-form-button').addEventListener('click', () => {
        if(confirm("Tømme skjema?")) location.reload();
    });

    // Set default date
    if(!document.getElementById('date').value) {
        document.getElementById('date').valueAsDate = new Date();
    }
});