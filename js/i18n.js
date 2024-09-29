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
    // Update elements with data-i18n attribute (innerText)
    const textElements = document.querySelectorAll('[data-i18n]');
    textElements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        if (translation) {
            element.innerText = translation;
        }
    });

    // Update elements with data-i18n-placeholder attribute (placeholders)
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const translation = t(key);
        if (translation) {
            element.placeholder = translation;
        }
    });

    // Update elements with data-i18n-html attribute (innerHTML)
    const htmlElements = document.querySelectorAll('[data-i18n-html]');
    htmlElements.forEach(element => {
        const key = element.getAttribute('data-i18n-html');
        const translation = t(key);
        if (translation) {
            element.innerHTML = translation;
        }
    });

    // Update elements with data-i18n-title attribute (title attribute)
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        const translation = t(key);
        if (translation) {
            element.title = translation;
        }
    });

    // Update <option> elements within <select> elements
    const selectElements = document.querySelectorAll('select[data-i18n]');
    selectElements.forEach(select => {
        const key = select.getAttribute('data-i18n');
        const translation = t(key);
        if (translation) {
            select.options[0].text = translation; // Update the select label
        }
        const options = select.querySelectorAll('option[data-i18n]');
        options.forEach(option => {
            const optionKey = option.getAttribute('data-i18n');
            const optionTranslation = t(optionKey);
            if (optionTranslation) {
                option.text = optionTranslation; // Update the option text
            }
        });
    });
}

function changeLanguage(lang) {
    loadTranslations(lang);
    const languageModal = document.getElementById('languageModal');
    if (languageModal) {
        languageModal.style.display = 'none';
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadTranslations(currentLanguage);
});