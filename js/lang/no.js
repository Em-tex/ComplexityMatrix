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
    },
    home: {
        common: "Felles",
        luftfartshinder: "Luftfartshinder"
    },
    common: {
        version: "Versjon",
        dropHint: "Slipp filen for å laste inn",
        dropOnlyData: "Slipp kun .csv-, .dat- eller .txt-filer."
    },
    view: {
        label: "Visning:",
        gauge: "Måler",
        bars: "Stolper"
    },
    help: {
        button: "Hjelp",
        title: "Hvordan bruke skjemaet",
        newTitle: "Lage ny profil",
        new1: "Fyll ut skjemaet.",
        new2: "Trykk «Last ned data» og lagre filen.",
        new3: "Gå til SharePoint-mappen («Sharepoint mappe») og last opp filen du nettopp lastet ned.",
        new4: "Etter omtrent ett minutt er dataene lagt inn som en ny rad i profiloversikten.",
        loadTitle: "Laste inn en tidligere profil",
        load1: "Åpne SharePoint-mappen og last ned filen du skal bruke.",
        load2: "Trykk «Last inn data» og velg filen – eller dra filen rett inn i nettleservinduet.",
        close: "Lukk"
    }
});
