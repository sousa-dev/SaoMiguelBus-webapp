let currentLanguage = 'pt';
let translations = {};

async function loadTranslations(lang) {
    try {
        const response = await fetch(`locales/${lang}.json`);
        translations = await response.json();
        currentLanguage = lang;
        updatePageContent();
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}

function t(key) {
    return translations[key] || key;
}

function updatePageContent() {
    // Update the page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle && translations['pageTitle']) {
        pageTitle.innerText = translations['pageTitle'];
    }

    // Update navbar labels
    const navBarSearchLabel = document.getElementById('navBarSearchLabel');
    if (navBarSearchLabel && translations['navBarSearchLabel']) {
        navBarSearchLabel.innerText = translations['navBarSearchLabel'];
    }
    const navBarRoutesLabel = document.getElementById('navBarRoutesLabel');
    if (navBarRoutesLabel && translations['navBarRoutesLabel']) {
        navBarRoutesLabel.innerText = translations['navBarRoutesLabel'];
    }
    const navBarAdvertLabel = document.getElementById('navBarAdvertLabel');
    if (navBarAdvertLabel && translations['navBarAdvertLabel']) {
        navBarAdvertLabel.innerText = translations['navBarAdvertLabel'];
    }
    const navBarInfoLabel = document.getElementById('navBarInfoLabel');
    if (navBarInfoLabel && translations['navBarInfoLabel']) {
        navBarInfoLabel.innerText = translations['navBarInfoLabel'];
    }

    // Update form placeholders
    const originInput = document.getElementById('origin');
    if (originInput && translations['originPlaceholder']) {
        originInput.placeholder = translations['originPlaceholder'];
    }

    const destinationInput = document.getElementById('destination');
    if (destinationInput && translations['destinationPlaceholder']) {
        destinationInput.placeholder = translations['destinationPlaceholder'];
    }

    // Update the day select options
    const daySelect = document.getElementById('day');
    if (daySelect) {
        const dayOptions = daySelect.options;
        for (let i = 0; i < dayOptions.length; i++) {
            const option = dayOptions[i];
            switch(option.value) {
                case '1':
                    option.text = translations['weekday'] || option.text;
                    break;
                case '2':
                    option.text = translations['saturday'] || option.text;
                    break;
                case '3':
                    option.text = translations['sunday'] || option.text;
                    break;
                default:
                    break;
            }
        }
    }

    // Update button text
    const btnSubmit = document.getElementById('btnSubmit');
    if (btnSubmit && translations['searchButton']) {
        btnSubmit.innerText = translations['searchButton'];
    }

    // Update No Routes Message
    const noRoutesMessage = document.getElementById('noRoutesMessage');
    if (noRoutesMessage && translations['noRoutesMessage']) {
        noRoutesMessage.innerText = translations['noRoutesMessage'];
    }

    // Update additional static text elements
    const staticElements = [
        { id: 'navBarContactLabel', key: 'navBarContactLabel' },
        { id: 'infoHeader', key: 'infoHeader' },
        { id: 'advertHeader', key: 'advertHeader' },
        // Add more elements as needed
    ];

    staticElements.forEach(element => {
        const elem = document.getElementById(element.id);
        if (elem && translations[element.key]) {
            elem.innerText = translations[element.key];
        }
    });

    // Update placeholders or other attributes if needed
    // Example for placeholders (if any additional)
    const placeholderElements = [
        { id: 'anotherInputId', key: 'anotherPlaceholderKey' },
        // Add more as needed
    ];

    placeholderElements.forEach(element => {
        const elem = document.getElementById(element.id);
        if (elem && translations[element.key]) {
            elem.placeholder = translations[element.key];
        }
    });

    // Update any other dynamic content as required
}

function changeLanguage(lang) {
    loadTranslations(lang);
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadTranslations(currentLanguage);
});