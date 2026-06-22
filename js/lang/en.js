/* Felles engelske strenger (navbar + knapper som deles på tvers av verktøy).
 * Lastes etter js/i18n.js og før js/navbar.js. */
I18n.register("en", {
    navbar: {
        home: "Home",
        msatProfile: "MSAT Profile:",
        profileExtension: "Extension consideration",
        profileStandard: "Standard"
    },
    buttons: {
        downloadData: "Download data",
        sharepointFolder: "Sharepoint folder",
        profileList: "Profile overview",
        profileListMsat: "MSAT Profile overview",
        printPdf: "Print to PDF",
        loadData: "Load in data",
        resetForm: "Reset form"
    },
    nameValidation: {
        placeholder: "First and last name",
        help: "Enter full name (first and last name)",
        warning: "Both first and last name must be entered."
    },
    home: {
        common: "Common",
        luftfartshinder: "Aviation obstacle"
    },
    common: {
        version: "Version",
        dropHint: "Drop the file to load it",
        dropOnlyData: "Drop only .csv, .dat or .txt files."
    },
    view: {
        label: "View:",
        gauge: "Gauge",
        bars: "Bars"
    },
    help: {
        button: "Help",
        title: "How to use the form",
        newTitle: "Create a new profile",
        new1: "Fill in the form.",
        new2: "Click “Download data” and save the file.",
        new3: "Go to the SharePoint folder (“Sharepoint folder”) and upload the file you just downloaded.",
        new4: "After about a minute the data appears as a new row in the profile overview.",
        loadTitle: "Load a previous profile",
        load1: "Open the SharePoint folder and download the file you want.",
        load2: "Click “Load in data” and select the file – or drag the file straight into the browser window.",
        close: "Close"
    }
});
