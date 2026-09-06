import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Radio } from 'lucide-react';

import { Dialog } from '@/components/ui/Dialog';
import type { MinibusLiveMapStopPin } from '@/features/minibus/lib/liveNetworkMapStops';

/** What lines serve a tapped network-map stop, and a shortcut into each line's live tracking. */
export function MinibusNetworkStopDialog({
  pin,
  onClose,
  showViewLive = true,
}: {
  pin: MinibusLiveMapStopPin | null;
  onClose: () => void;
  /** Hide the "view live" pill when the dialog is already opened from the live page. */
  showViewLive?: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lines = pin ? [...pin.lines].sort((a, b) => a.code.localeCompare(b.code)) : [];

  return (
    <Dialog open={pin != null} onClose={onClose} title={pin?.stop.name_pt ?? ''} closeLabel={t('close')}>
      {pin ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted">
            {lines.length === 1
              ? t('minibusLiveStopSequence', { sequence: lines[0].sequence })
              : t('minibusLiveStopServedBy')}
          </p>
          <ul className="flex flex-col gap-2">
            {lines.map((line) => (
              <li key={line.slug} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/minibus/${line.slug}`);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border p-2 text-left hover:bg-surface-variant"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-[#111]"
                    style={{ backgroundColor: `#${line.color.replace(/^#/, '')}` }}
                  >
                    {line.code}
                  </span>
                  <span className="truncate text-sm font-semibold text-content">
                    {t('minibusLiveStopViewLine', { line: line.code })}
                  </span>
                </button>
                {showViewLive ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/minibus/live?line=${line.slug}`);
                    }}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-content hover:bg-surface-variant"
                  >
                    <Radio size={12} strokeWidth={2.5} />
                    {t('minibusNetworkStopViewLive')}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          {pin.stop.interchange_lines.length > 0 ? (
            <p className="text-xs text-muted">
              {t('minibusInterchangeWith', { lines: pin.stop.interchange_lines.join(', ') })}
            </p>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}
