import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Lock, Megaphone, ShieldCheck, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui';
import { defaultPurposes, useConsentStore } from '@/lib/consent-store';
import { useBootstrap } from '@/hooks/useBootstrap';
import type { ConsentPurposes } from '@/lib/types';

const PURPOSE_ROWS: Array<{
  key: keyof ConsentPurposes;
  icon: typeof ShieldCheck;
  labelKey: string;
  descKey: string;
  locked?: boolean;
}> = [
  {
    key: 'strictly_necessary',
    icon: Lock,
    labelKey: 'consentPurposeNecessary',
    descKey: 'consentPurposeNecessaryDesc',
    locked: true,
  },
  {
    key: 'analytics',
    icon: BarChart3,
    labelKey: 'consentPurposeAnalytics',
    descKey: 'consentPurposeAnalyticsDesc',
  },
  {
    key: 'ads',
    icon: Megaphone,
    labelKey: 'consentPurposeAds',
    descKey: 'consentPurposeAdsDesc',
  },
  {
    key: 'personalization',
    icon: Sparkles,
    labelKey: 'consentPurposePersonalization',
    descKey: 'consentPurposePersonalizationDesc',
  },
];

export function ConsentBanner() {
  const { t } = useTranslation();
  const decided = useConsentStore((s) => s.decided);
  const acceptAll = useConsentStore((s) => s.acceptAll);
  const rejectNonEssential = useConsentStore((s) => s.rejectNonEssential);
  const saveCustom = useConsentStore((s) => s.saveCustom);
  const { data: bootstrap } = useBootstrap();
  const policyVersion = bootstrap?.consentPolicyVersion;
  const [customizing, setCustomizing] = useState(false);
  const [purposes, setPurposes] = useState<ConsentPurposes>({ ...defaultPurposes });
  const [busy, setBusy] = useState(false);

  if (decided) {
    return null;
  }

  const toggle = (key: keyof ConsentPurposes) => {
    if (key === 'strictly_necessary') {
      return;
    }
    setPurposes((current) => ({ ...current, [key]: !current[key] }));
  };

  const wrap = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1200] border-t border-border bg-surface p-4 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] lg:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-content">{t('consentTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{t('consentIntro')}</p>
        </div>

        {customizing ? (
          <div className="flex flex-col gap-2">
            {PURPOSE_ROWS.map(({ key, icon: Icon, labelKey, descKey, locked }) => (
              <label
                key={key}
                className="flex items-start gap-3 rounded-xl border border-border bg-background px-3 py-3"
              >
                <Icon size={18} className="mt-0.5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-content">{t(labelKey)}</p>
                  <p className="text-xs text-muted">{t(descKey)}</p>
                </div>
                <input
                  type="checkbox"
                  checked={purposes[key]}
                  disabled={locked}
                  onChange={() => toggle(key)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
              </label>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => void wrap(() => acceptAll(policyVersion))}>
            {t('consentAcceptAll')}
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => void wrap(() => rejectNonEssential(policyVersion))}
          >
            {t('consentRejectNonEssential')}
          </Button>
          {customizing ? (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => void wrap(() => saveCustom(purposes, policyVersion))}
            >
              {t('consentSaveChoices')}
            </Button>
          ) : (
            <Button variant="ghost" disabled={busy} onClick={() => setCustomizing(true)}>
              {t('settingsManageConsent')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
