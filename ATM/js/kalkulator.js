document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('complexity-form');
    const totalScoreDisplay = document.getElementById('total-score');
    const complexityLevel = document.getElementById('complexity-level');
    const progressCircle = document.getElementById('score-progress');
    
    const MAX_SCORE = 130; // Juster denne basert på teoretisk maks (sum av alle høyeste verdier)
    const RADIUS = 60;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

    progressCircle.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;

    function setProgress(score) {
        const percent = Math.min((score / MAX_SCORE) * 100, 100);
        const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
        progressCircle.style.strokeDashoffset = offset;
        
        // Fargekoding av sirkel
        if (percent < 35) progressCircle.style.stroke = "#28a745";
        else if (percent < 70) progressCircle.style.stroke = "#ffc107";
        else progressCircle.style.stroke = "#dc3545";
    }

    function calculateScore() {
        let total = 0;
        const selects = form.querySelectorAll('select');
        selects.forEach(select => {
            total += parseInt(select.value) || 0;
        });

        totalScoreDisplay.textContent = total;
        setProgress(total);

        // Nivå-logikk
        if (total <= 40) {
            complexityLevel.textContent = "Lav";
            complexityLevel.className = "complexity-level low";
        } else if (total <= 85) {
            complexityLevel.textContent = "Middels";
            complexityLevel.className = "complexity-level medium";
        } else {
            complexityLevel.textContent = "Høy";
            complexityLevel.className = "complexity-level high";
        }
    }

    form.addEventListener('change', calculateScore);
    
    // Knappe-funksjoner (CSV, Print, Reset)
    document.getElementById('clear-form-button').addEventListener('click', () => {
        if(confirm("Nullstille skjemaet?")) {
            form.reset();
            calculateScore();
        }
    });

    document.getElementById('print-pdf-button').addEventListener('click', () => window.print());

    document.getElementById('download-csv-button').addEventListener('click', () => {
        let csv = "Spørsmål,Poeng\n";
        form.querySelectorAll('select').forEach(s => {
            csv += `${s.name},${s.value}\n`;
        });
        csv += `TOTAL,${totalScoreDisplay.textContent}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "ATM_Vurdering.csv");
        link.click();
    });

    calculateScore(); // Kjør ved start
});