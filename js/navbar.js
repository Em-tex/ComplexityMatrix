document.addEventListener("DOMContentLoaded", function() {
    const scriptTag = document.currentScript || document.querySelector('script[src*="navbar.js"]');
    const rootPath = scriptTag.getAttribute('data-root') || './';

    // Inline SVG-flagg (rendres likt på alle plattformer, i motsetning til flagg-emoji).
    const flagNO = `<svg class="lang-flag" viewBox="0 0 22 16" aria-hidden="true"><rect width="22" height="16" fill="#ba0c2f"/><rect x="6" width="4" height="16" fill="#fff"/><rect y="6" width="22" height="4" fill="#fff"/><rect x="7" width="2" height="16" fill="#00205b"/><rect y="7" width="22" height="2" fill="#00205b"/></svg>`;
    const flagEN = `<svg class="lang-flag" viewBox="0 0 60 30" aria-hidden="true"><clipPath id="navbar-uk-clip"><path d="M30,15 h30 v15 z v-15 h-30 z h-30 v-15 z v15 h30 z"/></clipPath><rect width="60" height="30" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#navbar-uk-clip)" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></svg>`;

    const navbarHTML = `
    <nav class="top-navbar">
        <div class="nav-brand">
            <a href="${rootPath}index.html" title="Home" data-i18n-title="navbar.home" class="home-icon-link">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="home-icon">
                    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.06 1.06l8.69-8.69z" />
                    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                </svg>
            </a>
        </div>

        <div class="nav-actions" id="nav-actions"></div>

        <div class="nav-help" id="nav-help"></div>

        <div class="nav-lang" id="nav-lang" aria-label="Language">
            <button type="button" class="lang-toggle" aria-haspopup="true" aria-expanded="false">
                <span class="lang-current"></span>
                <svg class="lang-caret" viewBox="0 0 10 6" aria-hidden="true"><path d="M0 0 L5 6 L10 0 Z" fill="currentColor"/></svg>
            </button>
            <div class="lang-menu" role="menu"></div>
        </div>
    </nav>
    `;
    
    const navContainer = document.getElementById("navbar-container");
    if (navContainer) {
        navContainer.innerHTML = navbarHTML;
        // Oversett navbarens egne strenger (den settes inn etter i18n sin første apply).
        if (window.I18n) window.I18n.apply(navContainer);
    }

    // Speil knapperaden nederst (#action-buttons-container) opp i verktøylinjen som
    // kompakte omriss-knapper. Knappene proxy-klikker bunnknappene, slik at all
    // logikk i hvert verktøys kalkulator gjenbrukes uendret. Lenker (Sharepoint/
    // Profiloversikt) bygges fra de samme data-attributtene som felles_knapper.js.
    function buildNavActions() {
        const host = document.getElementById("nav-actions");
        if (!host) return;

        const footer = document.getElementById("footer-links-container") ||
                       document.getElementById("action-buttons-container");
        const spUrl = footer && footer.getAttribute("data-sharepoint-url");
        const listUrl = footer && footer.getAttribute("data-list-url");
        const isMsat = footer && footer.getAttribute("data-is-msat") === "true";

        const proxy = (id) => () => {
            const btn = document.getElementById(id);
            if (btn) btn.click();
        };

        const actions = [];
        if (document.getElementById("download-csv-button"))
            actions.push({ icon: "fa-download", i18n: "buttons.downloadData", text: "Last ned data", onClick: proxy("download-csv-button") });
        if (spUrl)
            actions.push({ icon: "fa-folder", i18n: "buttons.sharepointFolder", text: "Sharepoint mappe", href: spUrl });
        if (listUrl)
            actions.push({ icon: "fa-list", i18n: isMsat ? "buttons.profileListMsat" : "buttons.profileList", text: isMsat ? "MSAT Profiloversikt" : "Profiloversikt", href: listUrl });
        if (document.getElementById("print-pdf-button"))
            actions.push({ icon: "fa-print", i18n: "buttons.printPdf", text: "Print til PDF", onClick: proxy("print-pdf-button") });
        if (document.getElementById("load-csv-button"))
            actions.push({ icon: "fa-upload", i18n: "buttons.loadData", text: "Last inn data", onClick: proxy("load-csv-button") });
        if (document.getElementById("clear-form-button"))
            actions.push({ icon: "fa-trash", i18n: "buttons.resetForm", text: "Reset skjema", danger: true, onClick: proxy("clear-form-button") });

        if (!actions.length) return;

        // Hjelp-knapp høyrestilt, rett til venstre for språkvelgeren (egen beholder).
        const navHelp = document.getElementById("nav-help");
        if (navHelp) {
            const helpBtn = document.createElement("button");
            helpBtn.type = "button";
            helpBtn.className = "nav-action-btn nav-help-btn";
            helpBtn.setAttribute("data-i18n-title", "help.button");
            helpBtn.innerHTML =
                `<i class="fa-solid fa-circle-question"></i>` +
                `<span class="nav-action-label" data-i18n="help.button">Hjelp</span>`;
            helpBtn.addEventListener("click", openHelp);
            navHelp.appendChild(helpBtn);
            buildHelpModal();
            if (window.I18n) window.I18n.apply(navHelp);
        }

        actions.forEach((a) => {
            const el = document.createElement(a.href ? "a" : "button");
            el.className = "nav-action-btn" + (a.danger ? " danger" : "");
            el.setAttribute("data-i18n-title", a.i18n);
            if (a.href) {
                el.href = a.href;
                el.target = "_blank";
                el.rel = "noopener";
            } else {
                el.type = "button";
                el.addEventListener("click", a.onClick);
            }
            el.innerHTML =
                `<i class="fa-solid ${a.icon}"></i>` +
                `<span class="nav-action-label" data-i18n="${a.i18n}">${a.text}</span>`;
            host.appendChild(el);
        });

        if (window.I18n) window.I18n.apply(host);
    }

    // Hjelp-dialog med enkle instruksjoner. Bygges én gang og gjenbrukes.
    function buildHelpModal() {
        if (document.getElementById("help-modal-overlay")) return;
        const overlay = document.createElement("div");
        overlay.id = "help-modal-overlay";
        overlay.className = "help-modal-overlay";
        overlay.innerHTML = `
            <div class="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-modal-title">
                <button type="button" class="help-modal-close" id="help-modal-close" aria-label="Lukk" data-i18n-title="help.close">&times;</button>
                <h2 id="help-modal-title" data-i18n="help.title">Hvordan bruke skjemaet</h2>
                <h3 data-i18n="help.newTitle">Lage ny profil</h3>
                <ol>
                    <li data-i18n="help.new1"></li>
                    <li data-i18n="help.new2"></li>
                    <li data-i18n="help.new3"></li>
                    <li data-i18n="help.new4"></li>
                </ol>
                <h3 data-i18n="help.loadTitle">Laste inn en tidligere profil</h3>
                <ol>
                    <li data-i18n="help.load1"></li>
                    <li data-i18n="help.load2"></li>
                </ol>
            </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) closeHelp();
        });
        document.getElementById("help-modal-close").addEventListener("click", closeHelp);
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeHelp();
        });
        if (window.I18n) window.I18n.apply(overlay);
    }

    function openHelp() {
        const o = document.getElementById("help-modal-overlay");
        if (o) o.classList.add("open");
    }

    function closeHelp() {
        const o = document.getElementById("help-modal-overlay");
        if (o) o.classList.remove("open");
    }

    buildNavActions();

    // Språkvelger som nedtrekksmeny. Knappen viser valgt språk (flagg + bokstaver)
    // med en liten pil ned; klikk åpner en meny med de(t) andre språket/-ene.
    // Kompakt på mobil framfor to knapper side ved side. Krever at i18n.js er
    // lastet før dette skriptet.
    const langGroup = document.getElementById("nav-lang");
    if (langGroup && window.I18n) {
        const toggleBtn = langGroup.querySelector(".lang-toggle");
        const currentEl = langGroup.querySelector(".lang-current");
        const menu = langGroup.querySelector(".lang-menu");

        // Rekkefølge styrer menyen: EN først (= standard), så NO.
        const langDefs = {
            en: { label: "EN", flag: flagEN, title: "English" },
            no: { label: "NO", flag: flagNO, title: "Norsk" }
        };

        const closeMenu = function () {
            langGroup.classList.remove("open");
            toggleBtn.setAttribute("aria-expanded", "false");
        };
        const openMenu = function () {
            langGroup.classList.add("open");
            toggleBtn.setAttribute("aria-expanded", "true");
        };

        const render = function () {
            const current = window.I18n.getLang();
            const cur = langDefs[current] || langDefs.en;
            // Valgt språk på knappen: flagg + de to bokstavene.
            currentEl.innerHTML = cur.flag + "<span>" + cur.label + "</span>";
            toggleBtn.setAttribute("title", cur.title);

            // Bygg menyen med de øvrige språkene.
            menu.innerHTML = "";
            Object.keys(langDefs).forEach(function (code) {
                if (code === current) return;
                const d = langDefs[code];
                const opt = document.createElement("button");
                opt.type = "button";
                opt.className = "lang-option";
                opt.setAttribute("title", d.title);
                opt.setAttribute("role", "menuitem");
                opt.innerHTML = d.flag + "<span>" + d.label + "</span>";
                opt.addEventListener("click", function () {
                    closeMenu();
                    window.I18n.setLang(code);
                });
                menu.appendChild(opt);
            });
        };

        toggleBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            if (langGroup.classList.contains("open")) closeMenu();
            else openMenu();
        });
        // Klikk utenfor eller Escape lukker menyen.
        document.addEventListener("click", function (e) {
            if (!langGroup.contains(e.target)) closeMenu();
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeMenu();
        });

        // Hold knappen synkronisert hvis språket endres et annet sted.
        window.addEventListener("languageChanged", render);
        render();
    } else if (langGroup) {
        // i18n.js mangler – skjul velgeren framfor å vise en knapp som ikke virker.
        langGroup.style.display = "none";
    }

});