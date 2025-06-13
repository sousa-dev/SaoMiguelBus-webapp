# Guide to Add a New Language to São Miguel Bus

This guide will walk you through the complete process of adding a new language to the São Miguel Bus web application.

## Overview

The São Miguel Bus application uses a custom internationalization (i18n) system with:
- JSON-based translation files stored in `/locales`
- HTML elements with `data-i18n` attributes
- JavaScript functions to load and apply translations
- Cookie-based language preference storage
- A modal interface for language selection

## Current Implementation Analysis

### Available Languages
Currently supported languages:
- Portuguese (`pt`) - Default
- English (`en`)
- Spanish (`es`) 
- German (`de`)
- French (`fr`)

### File Structure
```
/locales/
├── pt.json (13KB, 196 translation keys)
├── en.json (12KB, 196 translation keys)
├── es.json (13KB, 196 translation keys)
├── de.json (13KB, 196 translation keys)
└── fr.json (14KB, 196 translation keys)
```

### Key Components
1. **Translation System**: `js/i18n.js` - Core i18n functionality
2. **Language Modal**: Language selection interface on the info tab
3. **Cookie Storage**: Persistent language preference storage
4. **HTML Attributes**: Various `data-i18n-*` attributes for different use cases

## Step-by-Step Guide to Add a New Language

### Step 1: Create the Translation File

1. **Choose your language code** following ISO 639-1 standards (e.g., `it` for Italian, `ru` for Russian)

2. **Create the new locale file**: Copy an existing locale file as a template
   ```bash
   cp locales/en.json locales/[NEW_LANGUAGE_CODE].json
   ```

3. **Translate all 196 keys** in the new file. The JSON structure contains keys like:
   ```json
   {
     "pageTitle": "São Miguel Bus | Horários e Rotas de Autocarros...",
     "navBarSearchLabel": "Routes",
     "bannerTitle": "Search a Bus",
     // ... 193 more keys
   }
   ```

### Step 2: Update the Core i18n Configuration

Edit `js/i18n.js`:

1. **Add the new language to the available languages array**:
   ```javascript
   // Line 1: Update this array
   let availableLanguages = ['pt', 'en', 'es', 'de', 'fr', '[NEW_LANGUAGE_CODE]'];
   ```

### Step 3: Add the Language to the Modal Interface

Edit `index.html` to add the new language option in the language selection modal:

1. **Find the language modal section** (around line 432-462)
2. **Add a new button** for your language:
   ```html
   <li>
       <button onclick="changeLanguage('[NEW_LANGUAGE_CODE]')" class="w-full text-left py-2" data-umami-event="change-language-[NEW_LANGUAGE_CODE]">
           <span>[FLAG_EMOJI]</span> [LANGUAGE_NAME]
       </button>
   </li>
   ```

### Step 4: Add the Language Flag/Icon

1. **Update the currentLanguage key** in your new translation file:
   ```json
   "currentLanguage": "[FLAG_EMOJI]"
   ```
   
2. **Choose an appropriate flag emoji** or Unicode flag representation

### Step 5: Handle Special Cases

If your language requires special handling in other parts of the system:

1. **Directions API**: Update `js/directionsApiHandler.js` line 82 if the Google Directions API supports your language
2. **Alerts System**: Update `js/offlineHandler.js` lines 63-87 to handle alert translations
3. **Desktop Version**: If applicable, update `desktop/js/languageHandler.js`

### Step 6: Test the Implementation

1. **Add the new language files** to your local environment
2. **Test the language switching** via the modal on the info tab
3. **Verify all text elements** are properly translated using the `data-i18n` attributes
4. **Check persistent storage** - the language preference should persist across browser sessions
5. **Test all pages** - Home, Routes, Tours, Premium, and Info sections

## Technical Details

### How the i18n System Works

1. **Language Detection**: On page load, the system:
   - Checks for saved language preference in cookies
   - Falls back to browser language if supported
   - Defaults to Portuguese

2. **Translation Loading**: `loadTranslations(lang)` function:
   - Fetches the appropriate JSON file from `/locales`
   - Updates the global `translations` object
   - Calls `updatePageContent()` to apply translations

3. **DOM Updates**: `updatePageContent()` processes elements with:
   - `data-i18n`: Updates `innerText` or `innerHTML`
   - `data-i18n-placeholder`: Updates `placeholder` attribute
   - `data-i18n-html`: Updates `innerHTML` specifically
   - `data-i18n-title`: Updates `title` attribute

4. **Language Switching**: `changeLanguage(lang)` function:
   - Loads new translations
   - Saves preference to cookies (30-day expiry)
   - Closes modal and reloads page

### HTML Element Targeting

Elements are targeted for translation using these attributes:

```html
<!-- Basic text content -->
<span data-i18n="keyName">Default Text</span>

<!-- Placeholder text -->
<input data-i18n-placeholder="placeholderKey" placeholder="Default">

<!-- HTML content -->
<div data-i18n-html="htmlContentKey">Default HTML</div>

<!-- Title attributes -->
<button data-i18n-title="tooltipKey" title="Default tooltip">Button</button>
```

## Quality Assurance Checklist

Before deploying a new language:

- [ ] All 196 translation keys are properly translated
- [ ] Cultural and regional adaptations are considered
- [ ] UI elements don't break with longer/shorter text
- [ ] Special characters and encoding work correctly
- [ ] Language switching works in both directions
- [ ] Cookie persistence functions properly
- [ ] All sections of the app display correctly
- [ ] Flag/emoji displays properly across devices
- [ ] Analytics tracking works with the new language

## Maintenance Notes

- **Translation Updates**: When new features are added, all locale files need corresponding updates
- **Key Consistency**: Always use the same translation keys across all language files
- **File Sizes**: Keep locale files optimized but prioritize translation quality
- **Regional Variants**: Consider if your language needs regional variations (e.g., pt-BR vs pt-PT)

## File Locations Summary

- **Translation Files**: `/locales/[LANG_CODE].json`
- **Core i18n Logic**: `js/i18n.js`
- **Language Modal**: `index.html` (lines ~432-462)
- **Utility Functions**: `index.html` (setCookie/getCookie functions)
- **Directions Integration**: `js/directionsApiHandler.js`
- **Alerts System**: `js/offlineHandler.js`

## Support

For issues or questions about adding new languages, contact the developer through the info section of the application or via the project's communication channels.
