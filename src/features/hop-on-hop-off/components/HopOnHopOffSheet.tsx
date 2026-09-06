import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui';
import { Dialog } from '@/components/ui/Dialog';

/** Pure — driven entirely by props so it's easy to test without the modal store. */
export function HopOnHopOffSheet({
  open,
  onClose,
  onBook,
}: {
  open: boolean;
  onClose: () => void;
  onBook: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} title={t('hopOnOffSheetTitle')} closeLabel={t('close')}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-content">{t('hopOnOffSheetBody')}</p>
        <ul className="flex flex-col gap-1 text-sm text-muted">
          <li>{t('hopOnOffSheetBullet1')}</li>
          <li>{t('hopOnOffSheetBullet2')}</li>
          <li>{t('hopOnOffSheetBullet3')}</li>
        </ul>
        <p className="text-xs text-muted">{t('hopOnOffSheetDisclaimer')}</p>
        <Button onClick={onBook}>{t('hopOnOffSheetBookButton')}</Button>
        <button
          type="button"
          onClick={onClose}
          className="self-center text-xs text-muted underline-offset-2 hover:underline"
        >
          {t('hopOnOffSheetClose')}
        </button>
      </div>
    </Dialog>
  );
}
