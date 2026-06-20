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

        <div class="nav-options" id="msat-options" style="display: none; justify-content: center; flex-grow: 1;">
            <label for="msat-profile-selector" style="margin-right: 10px;" data-i18n="navbar.msatProfile">MSAT Profile:</label>
            <select id="msat-profile-selector">
                <option value="AirOps" data-i18n="navbar.profileExtension">Extension consideration</option>
                <option value="Standard" data-i18n="navbar.profileStandard">Standard</option>
            </select>
        </div>

        <div class="nav-lang" id="nav-lang" role="group" aria-label="Language">
            <button type="button" class="lang-btn" data-lang="en" title="English">${flagEN}<span>EN</span></button>
            <span class="lang-sep">|</span>
            <button type="button" class="lang-btn" data-lang="no" title="Norsk"><span>NO</span>${flagNO}</button>
        </div>
    </nav>
    `;
    
    const navContainer = document.getElementById("navbar-container");
    if (navContainer) {
        navContainer.innerHTML = navbarHTML;
        // Oversett navbarens egne strenger (den settes inn etter i18n sin første apply).
        if (window.I18n) window.I18n.apply(navContainer);
    }

    // Språkvelger (NO | EN). Krever at i18n.js er lastet før dette skriptet.
    const langGroup = document.getElementById("nav-lang");
    if (langGroup && window.I18n) {
        const buttons = langGroup.querySelectorAll(".lang-btn");

        const markActive = function () {
            const current = window.I18n.getLang();
            buttons.forEach(function (btn) {
                btn.classList.toggle("active", btn.getAttribute("data-lang") === current);
            });
        };

        buttons.forEach(function (btn) {
            btn.addEventListener("click", function () {
                window.I18n.setLang(btn.getAttribute("data-lang"));
            });
        });

        // Hold knappene synkronisert hvis språket endres et annet sted.
        window.addEventListener("languageChanged", markActive);
        markActive();
    } else if (langGroup) {
        // i18n.js mangler – skjul velgeren framfor å vise en knapp som ikke virker.
        langGroup.style.display = "none";
    }

    const currentPage = window.location.pathname.toLowerCase();
    if (currentPage.includes("msat.html")) {
        const optionsDiv = document.getElementById("msat-options");
        optionsDiv.style.display = "flex";
        
        const selector = document.getElementById("msat-profile-selector");
        
        // Hent lagret valg, eller default til AirOps
        const savedProfile = localStorage.getItem("msat_profile") || "AirOps";
        selector.value = savedProfile;
        
        selector.addEventListener("change", (e) => {
            localStorage.setItem("msat_profile", e.target.value);
            window.dispatchEvent(new Event('msatProfileChanged'));
        });
    }
});