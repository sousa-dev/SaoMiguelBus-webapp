const fs = require('fs');
const path = require('path');

// Read all locale files
const localeDir = 'locales';
const localeFiles = ['en.json', 'pt.json', 'zh.json', 'fr.json', 'de.json', 'es.json', 'it.json', 'uk.json'];

const locales = {};
const allKeys = new Set();

// Load all locale files
localeFiles.forEach(file => {
    const filePath = path.join(localeDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    const lang = file.replace('.json', '');
    locales[lang] = data;
    
    // Add all keys to the master set
    Object.keys(data).forEach(key => allKeys.add(key));
});

console.log(`Total unique keys found: ${allKeys.size}`);
console.log('\n=== MISSING KEYS BY LANGUAGE ===\n');

// Check missing keys for each language
Object.keys(locales).forEach(lang => {
    const missingKeys = [];
    allKeys.forEach(key => {
        if (!locales[lang].hasOwnProperty(key)) {
            missingKeys.push(key);
        }
    });
    
    console.log(`${lang.toUpperCase()}: ${Object.keys(locales[lang]).length} keys (missing ${missingKeys.length})`);
    if (missingKeys.length > 0) {
        console.log(`Missing keys: ${missingKeys.join(', ')}`);
    }
    console.log('');
});

// Find the most complete locale to use as reference
let mostCompleteLocale = '';
let maxKeys = 0;
Object.keys(locales).forEach(lang => {
    const keyCount = Object.keys(locales[lang]).length;
    if (keyCount > maxKeys) {
        maxKeys = keyCount;
        mostCompleteLocale = lang;
    }
});

console.log(`Most complete locale: ${mostCompleteLocale} with ${maxKeys} keys`);

// Export results for use in fixing files
module.exports = {
    locales,
    allKeys: Array.from(allKeys),
    mostCompleteLocale
}; 