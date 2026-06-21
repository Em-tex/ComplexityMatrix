/*
 * Felles skjema-forbedringer for gauge/seksjon-verktøyene.
 *
 * Gjør "Velg…"-plassholderen (option[value=""]) i nedtrekksmenyene
 * ikke-valgbar (disabled). Effekt:
 *   - den kan ikke velges på nytt av brukeren,
 *   - den får ikke den svarte hover-markeringen i åpen liste,
 *   - men den vises fortsatt som standardtekst når feltet er tomt.
 *
 * disabled hindrer KUN brukerklikk – programmatisk nullstilling
 * (clear-form / CSV-import som setter select.value = "") virker som før.
 * Rører ikke option-verdier, så poeng og CSV er uendret.
 */
(function () {
    function setup() {
        document.querySelectorAll('.form-cell select option[value=""]').forEach(function (opt) {
            opt.disabled = true;
        });
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", setup);
    } else {
        setup();
    }
})();
