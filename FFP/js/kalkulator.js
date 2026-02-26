document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'ffp_luftfartshinder_data_v1';
    
    // --- Data Definitions with Icons ---
    const criteriaData = [
        { 
            id: "tverrfaglig", 
            title: "Tverrfaglige innspill", 
            icon: "fa-users",
            info: "FFO, FUL, FFS.",
            options: [
                { val: 0, text: "Ingen innvendinger (0p)" },
                { val: 2, text: "Noen bemerkninger (2p)" },
                { val: 5, text: "Innvendinger/Krav fra fagavd. (5p)" }
            ]
        },
        { 
            id: "hendelser", 
            title: "Hendelser og sikkerhetstilrådninger", 
            icon: "fa-triangle-exclamation",
            info: "Det aktuelle luftfartshinderet har vært årsak/ faktor til luftfartshendelse.",
            options: [
                { val: 0, text: "Ingen kjente hendelser (0p)" },
                { val: 5, text: "Tidligere hendelser/tilrådninger (5p)" }
            ]
        },
        { 
            id: "andre_hindre", 
            title: "Andre luftfartshindre i nærheten", 
            icon: "fa-tower-cell",
            info: "Ref. Gullesfjord: Spesielt relevant hvis ett er merkepliktig, mens tilstøtende ikke er det.",
            options: [
                { val: 0, text: "Ingen andre hindre / Alle merket (0p)" },
                { val: 3, text: "Hindre i nærheten (3p)" },
                { val: 5, text: "Umerkede hindre i umiddelbar nærhet (5p)" }
            ]
        },
        { 
            id: "kryssende", 
            title: "Kryssende luftspenn", 
            icon: "fa-bolt",
            info: "Luftspenn underlagt krav til linjebefaring og som krysser under overliggende luftspenn.",
            options: [
                { val: 0, text: "Nei (0p)" },
                { val: 5, text: "Ja (5p)" }
            ]
        },
        { 
            id: "seilingshoyde", 
            title: "Seilingshøyde", 
            icon: "fa-ship",
            info: "Stor differanse mellom linjestrekk endemaster og seilingshøyde øker risiko.",
            options: [
                { val: 0, text: "Liten/ingen differanse (0p)" },
                { val: 2, text: "Moderat differanse (2p)" },
                { val: 5, text: "Stor differanse / Høy risiko (5p)" }
            ]
        },
        { 
            id: "lufthavner", 
            title: "Lufthavner og landingsplasser", 
            icon: "fa-plane-arrival",
            info: "Nærhet til lufthavner eller innflygingstraséer.",
            options: [
                { val: 0, text: "Ingen i nærheten (>15 km) (0p)" },
                { val: 2, text: "I nærheten (5-15 km) (2p)" },
                { val: 5, text: "I innflygingssone / nær (<5 km) (5p)" }
            ]
        },
        { 
            id: "luftrom", 
            title: "Luftromsaktivitet", 
            icon: "fa-helicopter",
            info: "PINS-ruter, SAR/ HEMS, allmennflyging.",
            options: [
                { val: 0, text: "Lite aktivitet (0p)" },
                { val: 3, text: "Generell flyging (3p)" },
                { val: 5, text: "Kjent SAR/HEMS rute eller PINS (5p)" }
            ]
        },
        { 
            id: "vaer", 
            title: "Lokale værforhold", 
            icon: "fa-cloud-sun",
            info: "Områder spesielt utsatt for lokale værforhold (eks. tåke).",
            options: [
                { val: 0, text: "Normale forhold (0p)" },
                { val: 3, text: "Noe utsatt (3p)" },
                { val: 5, text: "Spesielt utsatt (ofte tåke/lavt skydekke) (5p)" }
            ]
        },
        { 
            id: "grensesnitt", 
            title: "Grensesnitt andre operative miljøer", 
            icon: "fa-bridge-water",
            info: "Eks. kan skipsfarten blendes av sterk lysmerking. Fysisk merking kan medføre fallende objekter.",
            options: [
                { val: 0, text: "Ingen konflikt (0p)" },
                { val: 5, text: "Konflikt identifisert (vei/sjø) (5p)" }
            ]
        },
        { 
            id: "tid", 
            title: "Tidsaspekt", 
            icon: "fa-hourglass-half",
            info: "Gjenværende levetid på luftfartshinderet.",
            options: [
                { val: 0, text: "Kortvarig / Skal rives snart (0p)" },
                { val: 2, text: "Mellomlang sikt (2p)" },
                { val: 5, text: "Permanent / Lang levetid (5p)" }
            ]
        },
        { 
            id: "ugunst", 
            title: "Hindereiers ugunst (Kost/Nytte)",
            icon: "fa-coins",
            info: "Lav ugunst (lav kostnad) taler FOR merking (Høy score). Høy ugunst (høy kostnad) taler MOT merking (Lav/Negativ score).",
            options: [
                { val: 5, text: "Lav ugunst / Enkelt å merke (+5p)" },
                { val: 0, text: "Middels ugunst (0p)" },
                { val: -5, text: "Høy ugunst / Svært kostbart (-5p)" }
            ]
        }
    ];

    const maxTotalScore = 55;

    // --- Build UI ---
    const container = document.getElementById('criteria-container');
    
    criteriaData.forEach(c => {
        const box = document.createElement('div');
        box.className = 'criterion-box';
        
        let optionsHtml = `<option value="">Velg vurdering...</option>`;
        c.options.forEach(opt => {
            optionsHtml += `<option value="${opt.val}">${opt.text}</option>`;
        });

        box.innerHTML = `
            <div class="criterion-header">
                <span class="criterion-title">
                    <i class="fa-solid ${c.icon}"></i> ${c.title}
                </span>
                <div class="tooltip-container">
                    <span class="tooltip-icon">?</span>
                    <span class="tooltip-text">${c.info}</span>
                </div>
            </div>
            <select id="select-${c.id}" class="criterion-select bg-default" data-id="${c.id}">
                ${optionsHtml}
            </select>
            <textarea id="comment-${c.id}" class="criterion-comment" rows="2" placeholder="Kommentar..."></textarea>
        `;
        container.appendChild(box);
    });

    // --- Map Logic (Leaflet) ---
    const map = L.map('map').setView([65.0, 13.0], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    let currentMarker = null;

    map.on('click', function(e) {
        setMarker(e.latlng.lat, e.latlng.lng);
        saveToLocalStorage(); 
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
        saveToLocalStorage();
    });

    // --- Color Coding ---
    function updateSelectColor(select) {
        const val = parseInt(select.value);
        select.classList.remove('bg-default', 'bg-green', 'bg-yellow', 'bg-red');

        if (isNaN(val)) {
            select.classList.add('bg-default');
        } else if (val <= 0) {
            select.classList.add('bg-green'); 
        } else if (val < 5) {
            select.classList.add('bg-yellow');
        } else {
            select.classList.add('bg-red');
        }
    }

    // --- Calculation Logic ---
    function updateScore() {
        let total = 0;
        criteriaData.forEach(c => {
            const select = document.getElementById(`select-${c.id}`);
            const val = parseInt(select.value);
            if (!isNaN(val)) {
                total += val;
            }
            updateSelectColor(select);
        });

        document.getElementById('total-score').textContent = total;
        document.getElementById('max-score').textContent = maxTotalScore;

        let displayTotal = Math.max(0, total);
        const percentage = Math.min(1, displayTotal / maxTotalScore);
        const rotation = -90 + (percentage * 180);
        const needle = document.getElementById('risk-needle');
        needle.style.transform = `translateX(-50%) rotate(${Math.min(90, Math.max(-90, rotation))}deg)`;

        const label = document.getElementById('risk-label-text');
        if (total < 15) { 
            label.textContent = "Lav Risiko / Tiltak ikke anbefalt"; 
            label.style.color = "#2e7d32"; 
        } else if (total < 30) { 
            label.textContent = "Middels Risiko / Vurder merking"; 
            label.style.color = "#f9a825"; 
        } else { 
            label.textContent = "Høy Risiko / Tiltak anbefales"; 
            label.style.color = "#c62828"; 
        }
        
        saveToLocalStorage();
    }

    // --- Local Storage Functions ---
    function saveToLocalStorage() {
        const data = {
            filledBy: document.getElementById('filled-by').value,
            date: document.getElementById('date').value,
            eier: document.getElementById('hindereier').value,
            type: document.getElementById('hindertype').value,
            sted: document.getElementById('sted').value,
            lat: document.getElementById('latitude').value,
            lng: document.getElementById('longitude').value,
            mainComment: document.getElementById('main-comment').value,
            criteria: {}
        };

        criteriaData.forEach(c => {
            data.criteria[c.id] = {
                val: document.getElementById(`select-${c.id}`).value,
                comment: document.getElementById(`comment-${c.id}`).value
            };
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function loadFromLocalStorage() {
        const json = localStorage.getItem(STORAGE_KEY);
        if (!json) return;

        try {
            const data = JSON.parse(json);
            document.getElementById('filled-by').value = data.filledBy || '';
            document.getElementById('date').value = data.date || '';
            document.getElementById('hindereier').value = data.eier || '';
            document.getElementById('hindertype').value = data.type || '';
            document.getElementById('sted').value = data.sted || '';
            document.getElementById('main-comment').value = data.mainComment || '';

            if (data.lat && data.lng) {
                const lat = parseFloat(data.lat);
                const lng = parseFloat(data.lng);
                setMarker(lat, lng);
                map.setView([lat, lng], 10);
            }

            if (data.criteria) {
                criteriaData.forEach(c => {
                    if (data.criteria[c.id]) {
                        document.getElementById(`select-${c.id}`).value = data.criteria[c.id].val || "";
                        document.getElementById(`comment-${c.id}`).value = data.criteria[c.id].comment || "";
                    }
                });
            }
            updateScore();
        } catch (e) {
            console.error("Feil ved lasting av lagrede data", e);
        }
    }

    document.querySelectorAll('select, input, textarea').forEach(el => {
        el.addEventListener('change', updateScore);
        el.addEventListener('input', () => {
             if(el.tagName !== 'SELECT') saveToLocalStorage(); 
        });
    });


    // --- File Export/Import Logic (.dat) ---
    document.getElementById('download-dat-button').addEventListener('click', () => {
        // Hent verdier
        const eier = document.getElementById('hindereier').value.trim() || "UkjentEier";
        const type = document.getElementById('hindertype').value.trim() || "UkjentType";
        const sted = document.getElementById('sted').value.trim() || "UkjentSted";
        const fyltUtAv = document.getElementById('filled-by').value.trim() || "Ukjent";
        
        // Hent dato og formater den til dd-mm-åååå
        const rawDate = document.getElementById('date').value || new Date().toISOString().slice(0,10);
        const dateParts = rawDate.split('-'); // Antar yyyy-mm-dd
        const datoFormatted = (dateParts.length === 3) 
            ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` // dd-mm-yyyy
            : rawDate; 

        // Rens filnavn for ulovlige tegn og mellomrom (erstatt med underscore)
        const safeEier = eier.replace(/[^\wæøåÆØÅ0-9]/g, '_');
        const safeType = type.replace(/[^\wæøåÆØÅ0-9]/g, '_');
        const safeSted = sted.replace(/[^\wæøåÆØÅ0-9]/g, '_');
        const safeFyltUtAv = fyltUtAv.replace(/[^\wæøåÆØÅ0-9]/g, '_');

        // Konstruer filnavn: Eier_Hindertype_Sted_FyltUtAv_Dato.dat
        const filnavn = `${safeEier}_${safeType}_${safeSted}_${safeFyltUtAv}_${datoFormatted}.dat`;

        // CSV/Data Headers
        let csvContent = "Eier;Hindertype;Sted;Fylt ut av;Dato;Breddegrad;Lengdegrad;Total Score;Overordnet Kommentar;";
        criteriaData.forEach(c => {
            csvContent += `${c.title} (Verdi);${c.title} (Kommentar);`;
        });
        
        // VIKTIG ENDRING: Bruker \r\n (CRLF) for at Power Automate split() skal virke likt som på andre skjema
        csvContent += "\r\n";

        // Values
        const lat = document.getElementById('latitude').value;
        const long = document.getElementById('longitude').value;
        const score = document.getElementById('total-score').textContent;
        const mainComment = document.getElementById('main-comment').value.replace(/(\r\n|\n|\r)/gm, " ").replace(/"/g, '""');

        let row = [
            `"${document.getElementById('hindereier').value.replace(/"/g, '""')}"`,
            `"${document.getElementById('hindertype').value.replace(/"/g, '""')}"`,
            `"${document.getElementById('sted').value.replace(/"/g, '""')}"`,
            `"${document.getElementById('filled-by').value.replace(/"/g, '""')}"`,
            `"${rawDate}"`, // Beholder ISO-format inni filen for systemlesbarhet (valgfritt, men tryggere for SharePoint/Excel)
            lat,
            long,
            score,
            `"${mainComment}"`
        ];

        criteriaData.forEach(c => {
            const val = document.getElementById(`select-${c.id}`).value;
            const comm = document.getElementById(`comment-${c.id}`).value.replace(/(\r\n|\n|\r)/gm, " ").replace(/"/g, '""');
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

    const fileInput = document.getElementById('dat-file-input');
    document.getElementById('load-dat-button').addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const lines = e.target.result.split(/\r?\n/);
            if(lines.length < 2) return alert("Ugyldig fil.");
            
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
            
            if (values[8]) {
                 document.getElementById('main-comment').value = values[8];
            }

            let idx = 9;
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
        if(confirm("Er du sikker på at du vil tømme skjemaet?")) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    });

    if(!document.getElementById('date').value) {
        document.getElementById('date').valueAsDate = new Date();
    }

    loadFromLocalStorage();
});