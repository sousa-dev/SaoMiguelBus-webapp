import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function MinibusAttributionFooter({
  sourceUrl,
  importedAt,
}: {
  sourceUrl?: string | null;
  importedAt?: string | null;
}) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 flex flex-col gap-1.5 border-t border-border pt-4">
      <p className="text-xs text-muted">{t('minibusDisclaimer')}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span>{t('minibusAttribution')}</span>
        {importedAt ? <span>{t('minibusImportedAt', { date: importedAt })}</span> : null}
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            <ExternalLink size={12} />
            {t('minibusSourceLink')}
          </a>
        ) : null}
      </div>
    </div>
  );
}
