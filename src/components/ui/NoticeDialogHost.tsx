import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui';
import { Dialog } from '@/components/ui/Dialog';
import { useNoticeStore } from '@/lib/notice-store';

/** Mount once in the shell; renders the head of the notice queue. */
export function NoticeDialogHost() {
  const { t } = useTranslation();
  const notice = useNoticeStore((s) => s.queue[0]);
  const dismiss = useNoticeStore((s) => s.dismiss);

  return (
    <Dialog
      open={Boolean(notice)}
      onClose={dismiss}
      title={notice?.title ?? ''}
      size="sm"
      closeLabel={t('close', { defaultValue: 'Close' })}
      footer={<Button onClick={dismiss}>{t('okButton', { defaultValue: 'OK' })}</Button>}
    >
      {notice?.message ? <p className="text-muted">{notice.message}</p> : null}
    </Dialog>
  );
}
