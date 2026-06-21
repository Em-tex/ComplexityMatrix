/*
 * Delt tooltip-håndtering for hjelpe-ikonene (.tooltip-container) i skjemaene.
 *
 * Stilarkene viser tooltipen ved :hover, som fungerer fint med mus, men IKKE på
 * touch-skjermer (ingen hover) og ikke for tastatur. Dette skriptet gjør ikonene
 * fokuserbare og lar et trykk/klikk (eller Enter/Space) veksle en .tooltip-open
 * klasse, slik at hjelpeteksten også er tilgjengelig på mobil. Hover-regelen i
 * CSS beholdes uendret for mus.
 *
 * Rent presentasjon: rører ikke select-verdier, data-attributter eller poeng-/
 * kalkulatorlogikk.
 */
(function () {
    function setup() {
        const containers = document.querySelectorAll(".tooltip-container");
        if (!containers.length) return;

        const closeAll = function (except) {
            containers.forEach(function (c) {
                if (c !== except) {
                    c.classList.remove("tooltip-open");
                    const ic = c.querySelector(".tooltip-icon");
                    if (ic) ic.setAttribute("aria-expanded", "false");
                }
            });
        };

        containers.forEach(function (container) {
            if (container.dataset.tooltipReady) return;
            container.dataset.tooltipReady = "true";

            const icon = container.querySelector(".tooltip-icon");
            if (!icon) return;

            // Gjør ikonet til en tilgjengelig, fokuserbar kontroll.
            icon.setAttribute("tabindex", "0");
            icon.setAttribute("role", "button");
            icon.setAttribute("aria-expanded", "false");

            const toggle = function (e) {
                e.preventDefault();
                e.stopPropagation();
                const willOpen = !container.classList.contains("tooltip-open");
                closeAll(container);
                container.classList.toggle("tooltip-open", willOpen);
                icon.setAttribute("aria-expanded", willOpen ? "true" : "false");
            };

            icon.addEventListener("click", toggle);
            icon.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                    toggle(e);
                }
            });
        });

        // Trykk/klikk utenfor, eller Escape, lukker åpne tooltips.
        document.addEventListener("click", function (e) {
            if (!e.target.closest(".tooltip-container")) closeAll(null);
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeAll(null);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", setup);
    } else {
        setup();
    }
})();
