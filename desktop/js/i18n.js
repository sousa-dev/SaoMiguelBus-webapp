let availableLanguages = ['pt', 'en', 'es', 'de', 'fr', 'it', 'uk', 'zh'];
let currentLanguage = getCookie('language') || (availableLanguages.includes((navigator.language||'pt').split('-')[0]) ? (navigator.language||'pt').split('-')[0] : 'pt');
let translations = {};

async function loadTranslations(lang) {
  try {
    const response = await fetch(`/locales/${lang}.json`);
    translations = await response.json();
    currentLanguage = lang;
    updatePageContent();
  } catch (error) {
    console.error('Error loading translations:', error);
  }
}

function t(key, fallback){
  return translations[key] || fallback || key;
}

function updatePageContent() {
  const textElements = document.querySelectorAll('[data-i18n]');
  textElements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = t(key);
    if (translation) {
      if (translation.includes('<') && translation.includes('>')) {
        element.innerHTML = translation;
      } else {
        element.innerText = translation;
      }
    }
  });

  const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
  placeholderElements.forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const translation = t(key);
    if (translation) element.placeholder = translation;
  });
}

function changeLanguage(lang) {
  loadTranslations(lang);
  setCookie('language', lang, 30);
  // Refresh i18n content only (no full reload)
  setTimeout(updatePageContent, 0);
}

document.addEventListener('DOMContentLoaded', () => {
  loadTranslations(currentLanguage);
});
