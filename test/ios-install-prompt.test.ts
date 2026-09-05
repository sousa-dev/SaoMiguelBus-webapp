import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const appStoreUrl = 'https://apps.apple.com/pt/app/s%C3%A3o-miguel-bus/id6777066837';

function readRepoFile(path: string): string {
  return readFileSync(join(repoRoot, path), 'utf8');
}

describe('iOS install prompt copy', () => {
  it('uses download copy instead of register copy in all active locale bundles', () => {
    const localeFiles = [
      'src/locales/de.json',
      'src/locales/en.json',
      'src/locales/es.json',
      'src/locales/fr.json',
      'src/locales/it.json',
      'src/locales/pt.json',
      'src/locales/uk.json',
      'src/locales/zh.json',
      'legacy/locales/de.json',
      'legacy/locales/en.json',
      'legacy/locales/es.json',
      'legacy/locales/fr.json',
      'legacy/locales/it.json',
      'legacy/locales/pt.json',
      'legacy/locales/uk.json',
      'legacy/locales/zh.json',
    ];

    for (const localeFile of localeFiles) {
      const locale = JSON.parse(readRepoFile(localeFile)) as Record<string, string>;

      expect(locale.registerToDownloadIOSApp, localeFile).toBeUndefined();
      expect(locale.downloadIOSApp, localeFile).toBeTruthy();
      expect(locale.downloadIOSApp, localeFile).not.toMatch(/register|registar|registr/i);
    }
  });

  it('opens a popup from the legacy iOS install button with the live App Store link', () => {
    const legacyHtml = readRepoFile('legacy/index.html');

    expect(legacyHtml).toContain('onclick="showIOSInstallPrompt()"');
    expect(legacyHtml).toContain('setTimeout(showIOSInstallPrompt, 700)');
    expect(legacyHtml).toContain('data-i18n="downloadIOSApp"');
    expect(legacyHtml).toContain('id="iosInstallPromptModal"');
    expect(legacyHtml).toContain(appStoreUrl);
  });
});
