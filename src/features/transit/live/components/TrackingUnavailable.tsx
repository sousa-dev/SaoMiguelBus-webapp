import { useTranslation } from 'react-i18next';
import { Radio, WifiOff } from 'lucide-react';

import { Button } from '@/components/ui';

type Common = {
  /** Copy namespace: the two operators share the vocabulary, not the strings. */
  keyPrefix?: 'azoresbusLive' | 'minibusLive';
};

type UpstreamProps = Common & {
  variant?: 'upstream';
  onTryAgain: () => void;
  tryAgainDisabled: boolean;
  tryAgainLabel: string;
};

type OfflineProps = Common & { variant: 'offline' };

export type TrackingUnavailableProps = UpstreamProps | OfflineProps;

/** Offline gets no retry button: there is nothing to retry until signal returns. */
export function TrackingUnavailable(props: TrackingUnavailableProps) {
  const { t } = useTranslation();
  const prefix = props.keyPrefix ?? 'azoresbusLive';
  const isOffline = props.variant === 'offline';

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface px-6 py-12 text-center">
      {isOffline ? (
        <WifiOff size={40} className="text-muted" strokeWidth={1.5} />
      ) : (
        <Radio size={40} className="text-muted" strokeWidth={1.5} />
      )}
      <p className="mt-4 text-base font-bold text-content">
        {t(isOffline ? `${prefix}Offline` : `${prefix}Unavailable`)}
      </p>
      <p className="mt-2 max-w-md text-sm text-muted">
        {t(isOffline ? `${prefix}OfflineHint` : `${prefix}UnavailableHint`)}
      </p>
      {!isOffline ? (
        <Button variant="outline" className="mt-5" onClick={props.onTryAgain} disabled={props.tryAgainDisabled}>
          {props.tryAgainLabel}
        </Button>
      ) : null}
    </div>
  );
}
