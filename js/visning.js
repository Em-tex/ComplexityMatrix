/*
 * Felles presentasjonsvelger for gauge/seksjon-verktøyene.
 *
 * Legger en bytteknapp (Måler | Stolper) over resultat-instrumentene og bygger
 * en alternativ stolpevisning ved siden av de eksisterende gaugene:
 *   - Stolper: vannrette stolper for hver kategori + total.
 * For verktøy som har tilsynspakke (FixedWing/Rotor) vises totalen som en
 * TERSKEL-SKALA med gruppe-grensene markert i stolpevisningen.
 *
 * Helt datadrevet: leser tall/etiketter rett fra de eksisterende
 * gauge-blokkene (.gauge-block-summary "verdi / maks" + .gauge-block-title) og
 * holder seg oppdatert via en MutationObserver. Rører IKKE kalkulatorene,
 * select-verdier eller poeng – ren presentasjon. Valget huskes i localStorage.
 */
(function () {
    const STORAGE_KEY = "skjema_visning"; // 'gauge' | 'bars'
    const MODES = ["gauge", "bars"];
    const GROUP_COLORS = { 1: "#dc3545", 2: "#fd7e14", 3: "#ffc107", 4: "#6CB04A", 5: "#28a745" };

    function lerp(a, b, u) { return Math.round(a + (b - a) * u); }
    // Samme grønn→gul→rød-gradient som gauge-bakgrunnen, som funksjon av andel.
    function colorFor(f) {
        f = Math.max(0, Math.min(1, f));
        let r, g, b;
        if (f < 0.5) { const u = f / 0.5; r = lerp(0, 255, u); g = lerp(145, 240, u); b = lerp(34, 37, u); }
        else { const u = (f - 0.5) / 0.5; r = lerp(255, 255, u); g = lerp(240, 0, u); b = lerp(37, 25, u); }
        return `rgb(${r},${g},${b})`;
    }

    function esc(s) {
        return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    }

    function setup() {
        const gaugeView = document.querySelector(".all-gauges-container");
        if (!gaugeView) return;
        const host = gaugeView.parentNode;
        if (host.dataset.visningReady) return;
        host.dataset.visningReady = "true";

        const badge = host.querySelector(".tilsynspakke-badge");

        // --- Bytteknapp ---
        const toggle = document.createElement("div");
        toggle.className = "visning-toggle";
        toggle.setAttribute("role", "group");
        toggle.setAttribute("aria-label", "Visning");
        toggle.innerHTML =
            `<span class="visning-label" data-i18n="view.label">Visning:</span>` +
            `<div class="visning-buttons">` +
            `<button type="button" class="visning-btn" data-mode="gauge"><i class="fa-solid fa-gauge-high"></i><span data-i18n="view.gauge">Måler</span></button>` +
            `<button type="button" class="visning-btn" data-mode="bars"><i class="fa-solid fa-chart-simple"></i><span data-i18n="view.bars">Stolper</span></button>` +
            `</div>`;

        const barsView = document.createElement("div");
        barsView.className = "visning-bars";

        gaugeView.insertAdjacentElement("afterend", barsView);
        host.insertBefore(toggle, badge || gaugeView);
        if (window.I18n) window.I18n.apply(toggle);

        // --- Datauttrekk fra de eksisterende gauge-blokkene ---
        function extract() {
            const blocks = Array.from(gaugeView.querySelectorAll(".gauge-block"));
            const cats = []; let total = null;
            blocks.forEach(b => {
                const titleEl = b.querySelector(".gauge-block-title");
                const title = titleEl ? titleEl.textContent.trim() : b.id;
                // Gjenbruk kategoriens ikon (samme som gauge-visningen viser).
                const iconEl = titleEl ? titleEl.querySelector("i, .material-icons, .material-symbols-outlined") : null;
                const icon = iconEl ? iconEl.outerHTML : "";
                const sumEl = b.querySelector(".gauge-block-summary");
                let value = 0, max = 0;
                if (sumEl) {
                    const nums = sumEl.textContent.match(/-?\d+(?:[.,]\d+)?/g);
                    if (nums && nums.length >= 2) {
                        value = parseFloat(nums[0].replace(",", "."));
                        max = parseFloat(nums[1].replace(",", "."));
                    }
                }
                const key = b.id.replace("gauge-block-", "");
                const entry = { key, title, value, max, icon };
                if (b.id === "gauge-block-total") total = entry; else cats.push(entry);
            });
            return { cats, total };
        }

        // Terskler for tilsynspakke leses fra chip-radene (min-poeng + gruppe + lenke).
        function thresholds() {
            const chips = Array.from(document.querySelectorAll(".tp-chip"));
            if (!chips.length) return null;
            const items = chips.map(c => {
                const grp = (c.className.match(/group-(\d+)/) || [])[1];
                const range = (c.querySelector(".tp-range") || {}).textContent || "";
                const min = parseInt((range.match(/\d+/) || [])[0], 10);
                const label = ((c.querySelector(".tp-group") || {}).textContent || "").trim();
                return { group: grp, min, url: c.getAttribute("href"), label };
            }).filter(x => !isNaN(x.min));
            items.sort((a, b) => a.min - b.min);
            return items.length ? items : null;
        }

        // --- Stolpevisning ---
        // Hver stolpe er normalisert til andel av sin egen maks (0–100 %), så de
        // deler samme x-akse/rutenett. Tallet til høyre viser faktisk verdi/maks.
        function barRow(e, cls) {
            const f = e.max > 0 ? e.value / e.max : 0;
            return `<div class="vb-row${cls ? " " + cls : ""}">` +
                `<span class="vb-label">${e.icon || ""}${esc(e.title)}</span>` +
                `<div class="vb-plot"><div class="vb-fill" style="width:${(f * 100).toFixed(1)}%;background:${colorFor(f)}"></div></div>` +
                `<span class="vb-num">${e.value} / ${e.max}</span>` +
                `</div>`;
        }

        function renderBars() {
            const { cats, total } = extract();
            const th = total ? thresholds() : null;
            let rows = cats.map(c => barRow(c)).join("");
            // Tools uten tilsynspakke: ta totalen med som siste (uthevet) rad i diagrammet.
            if (total && !th) rows += barRow(total, "vb-total-row");
            const axis = `<div class="vb-row vb-axis-row"><span class="vb-label"></span>` +
                `<div class="vb-axis"><span>0</span><span>25</span><span>50</span><span>75</span><span>100%</span></div>` +
                `<span class="vb-num"></span></div>`;
            let html = `<div class="vb-chart">${rows}${axis}</div>`;
            // Tools med tilsynspakke: totalen som terskel-skala under diagrammet.
            if (total && th) html += `<div class="vb-total-sep"></div>` + scaleHTML(total, th);
            barsView.innerHTML = html;
        }

        // --- Terskel-skala for totalen ---
        function scaleHTML(total, th) {
            const max = total.max || 1;
            const activeGroup = (() => {
                let g = null;
                th.forEach(item => { if (total.value >= item.min) g = item.group; });
                return g;
            })();
            // Segmenter: fra 0 til laveste terskel = "ingen pakke" (grått), deretter
            // ett segment per gruppe opp til neste terskel / maks.
            let segs = "";
            const bounds = th.map(x => x.min);
            // grått segment under laveste terskel
            const lowest = bounds[0];
            segs += `<div class="vs-seg" style="width:${(lowest / max * 100).toFixed(2)}%;background:#e9ecef"></div>`;
            for (let i = 0; i < th.length; i++) {
                const from = th[i].min;
                const to = (i + 1 < th.length) ? th[i + 1].min : max;
                const w = (to - from) / max * 100;
                const col = GROUP_COLORS[th[i].group] || "#adb5bd";
                const on = String(th[i].group) === String(activeGroup);
                segs += `<div class="vs-seg${on ? " active" : ""}" style="width:${w.toFixed(2)}%;background:${col}"></div>`;
            }
            const markerPct = Math.max(0, Math.min(100, total.value / max * 100));
            const ticks = th.map(x =>
                `<span class="vs-tick" style="left:${(x.min / max * 100).toFixed(2)}%"><span class="vs-tick-val">${x.min}</span></span>`
            ).join("");
            // Gruppen vises av tilsynspakke-chipene rett under – ikke gjenta den her.
            return `<div class="vb-scale">` +
                `<div class="vb-scale-head"><strong>${esc(total.title)}</strong>: ${total.value} / ${total.max}</div>` +
                `<div class="vs-track">${segs}<span class="vs-marker" style="left:${markerPct.toFixed(2)}%"></span></div>` +
                `<div class="vs-ticks">${ticks}<span class="vs-tick" style="left:100%"><span class="vs-tick-val">${max}</span></span></div>` +
                `</div>`;
        }

        // --- Modus-håndtering ---
        let current = localStorage.getItem(STORAGE_KEY);
        if (!MODES.includes(current)) current = "gauge";

        function rerender() {
            if (current === "bars") renderBars();
        }

        function applyMode(m) {
            current = m;
            localStorage.setItem(STORAGE_KEY, m);
            // gaugeView faller tilbake til sin CSS-default (grid) med "";
            // stolpevisningen har CSS-default none, så den må settes eksplisitt.
            gaugeView.style.display = m === "gauge" ? "" : "none";
            barsView.style.display = m === "bars" ? "block" : "none";
            // Tilsynspakke-chipene (PDF-lenkene) er synlige i begge visninger, men
            // plasseres OVER gaugene i målervisning og UNDER stolpene ellers.
            if (badge) {
                if (m === "gauge") host.insertBefore(badge, gaugeView);
                else barsView.insertAdjacentElement("afterend", badge);
            }
            toggle.querySelectorAll(".visning-btn").forEach(b =>
                b.classList.toggle("active", b.getAttribute("data-mode") === m));
            rerender();
        }

        toggle.querySelectorAll(".visning-btn").forEach(b =>
            b.addEventListener("click", () => applyMode(b.getAttribute("data-mode"))));

        // Hold de alternative visningene oppdatert når kalkulatoren endrer tallene.
        let scheduled = false;
        const obs = new MutationObserver(() => {
            if (current === "gauge" || scheduled) return;
            scheduled = true;
            requestAnimationFrame(() => { scheduled = false; rerender(); });
        });
        obs.observe(gaugeView, { subtree: true, childList: true, characterData: true });

        // Oversett knappetekstene på nytt ved språkbytte.
        window.addEventListener("languageChanged", () => {
            if (window.I18n) window.I18n.apply(toggle);
            rerender();
        });

        applyMode(current);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", setup);
    } else {
        setup();
    }
})();
