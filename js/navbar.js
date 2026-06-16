document.addEventListener("DOMContentLoaded", function() {
    // Finner riktig rot-sti fra script-taggen (f.eks. "./" på forsiden, "../" i undermapper)
    const scriptTag = document.currentScript || document.querySelector('script[src*="navbar.js"]');
    const rootPath = scriptTag.getAttribute('data-root') || './';

    const navbarHTML = `
    <nav class="top-navbar">
        <div class="nav-brand">
            <a href="${rootPath}index.html" title="Home" class="home-icon-link">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="home-icon">
                    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.06 1.06l8.69-8.69z" />
                    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                </svg>
            </a>
        </div>
        
        <!-- Holdes skjult som standard -->
        <div class="nav-options" id="msat-options" style="display: none;">
            <label for="msat-profile-selector">MSAT Profile:</label>
            <select id="msat-profile-selector">
                <option value="Standard">Standard</option>
                <option value="AirOps">Air Operations / Aircrew</option>
            </select>
        </div>
    </nav>
    `;
    
    const navContainer = document.getElementById("navbar-container");
    if (navContainer) {
        navContainer.innerHTML = navbarHTML;
    }

    const currentPage = window.location.pathname;

    // Tvinger profilvelgeren til KUN å vises hvis filnavnet slutter på eller inneholder msat.html
    if (currentPage.toLowerCase().includes("msat.html")) {
        const optionsDiv = document.getElementById("msat-options");
        if (optionsDiv) {
            optionsDiv.style.display = "flex"; // Viser den kun her
            
            const selector = document.getElementById("msat-profile-selector");
            const currentProfile = localStorage.getItem("msat_profile") || "Standard";
            selector.value = currentProfile;
            
            selector.addEventListener("change", (e) => {
                localStorage.setItem("msat_profile", e.target.value);
                // Fyrer av eventet til kalkulatoren
                window.dispatchEvent(new Event('msatProfileChanged'));
            });
        }
    }
});