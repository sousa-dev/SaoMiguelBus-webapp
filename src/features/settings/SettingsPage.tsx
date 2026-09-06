import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

import { GetTheAppCard } from '@/components/AppInstall';
import { PageHeader } from '@/components/layout/Page';
import { Seo } from '@/components/Seo';
import { Button, Card } from '@/components/ui';
import { AccountSection } from '@/features/account/components/AccountSection';
import { PremiumSettingsSection } from '@/features/premium/components/PremiumSettingsSection';
import { PRIVACY_PATH, TERMS_PATH } from '@/lib/app-links';
import { cn } from '@/lib/cn';
import { useConsentStore } from '@/lib/consent-store';
import { LANGUAGE_NAMES, SUPPORTED_LOCALES } from '@/lib/i18n';
import { getAppVersion } from '@/lib/platform';

function LanguageSection() {
  const { t, i18n } = useTranslation();
  const current = i18n.language?.split('-')[0] ?? 'pt';
  return (
    <Card as="section" className="p-5">
      <h2 className="mb-3 text-base font-bold text-content">{t('settingsLanguage')}</h2>
      <div className="flex flex-wrap gap-2">
        {SUPPORTED_LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => void i18n.changeLanguage(locale)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
              locale === current
                ? 'border-primary bg-primary text-on-primary'
                : 'border-border bg-surface text-content hover:border-outline',
            )}
          >
            {locale === current ? <Check size={14} /> : null}
            {LANGUAGE_NAMES[locale]}
          </button>
        ))}
      </div>
    </Card>
  );
}

function PrivacySection() {
  const { t } = useTranslation();
  const requireReconsent = useConsentStore((s) => s.requireReconsent);
  return (
    <Card as="section" className="p-5">
      <h2 className="mb-3 text-base font-bold text-content">{t('settingsPrivacy')}</h2>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={requireReconsent}>
          {t('settingsManageConsent')}
        </Button>
        <a href={TERMS_PATH} className="text-sm text-muted underline-offset-2 hover:underline">
          {t('termsAndConditions')}
        </a>
        <a href={PRIVACY_PATH} className="text-sm text-muted underline-offset-2 hover:underline">
          {t('privacyPolicy')}
        </a>
      </div>
    </Card>
  );
}

function AboutSection() {
  const { t } = useTranslation();
  return (
    <Card as="section" className="p-5">
      <h2 className="mb-3 text-base font-bold text-content">{t('settingsAbout')}</h2>
      <p className="mb-4 text-sm text-muted">
        {t('settingsVersion')}: {getAppVersion()}
      </p>
      <GetTheAppCard />
    </Card>
  );
}

/** `/settings` — the web counterpart of the Expo settings sheet (no appearance/dev sections). */
export function SettingsPage() {
  const { t } = useTranslation();
  return (
    <>
      <Seo title={t('settingsTitle')} />
      <PageHeader title={t('settingsTitle')} />
      <div className="flex max-w-2xl flex-col gap-4">
        <AccountSection />
        <PremiumSettingsSection />
        <LanguageSection />
        <PrivacySection />
        <AboutSection />
      </div>
    </>
  );
}
