/* Felles norske strenger (navbar + knapper som deles på tvers av verktøy).
 * Lastes etter js/i18n.js og før js/navbar.js.
 * NB: Norske verdier er de opprinnelige tekstene fra prosjektet – ikke endre dem. */
I18n.register("no", {
    navbar: {
        home: "Hjem",
        msatProfile: "MSAT-profil:",
        profileExtension: "Vurdering av forlengelse",
        profileStandard: "Standard"
    },
    buttons: {
        downloadData: "Last ned data",
        sharepointFolder: "Sharepoint mappe",
        profileList: "Profiloversikt",
        profileListMsat: "MSAT Profiloversikt",
        printPdf: "Print til PDF",
        loadData: "Last inn data",
        resetForm: "Reset skjema"
    },
    nameValidation: {
        placeholder: "For- og etternavn",
        help: "Skriv inn fullt navn (for- og etternavn)",
        warning: "Både for- og etternavn må fylles inn."
    }
});
