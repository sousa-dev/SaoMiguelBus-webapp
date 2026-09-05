import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui';
import type { MinibusNetworkStop } from '@/lib/types';

import { displayStopSequence } from '../lib/stops';

export function MinibusLineStopsList({
  stops,
  lineColor,
  selectedStopKey,
  onStopClick,
}: {
  stops: MinibusNetworkStop[];
  lineColor: string;
  selectedStopKey?: string | null;
  onStopClick?: (stopKey: string) => void;
}) {
  const { t } = useTranslation();
  const ordered = [...stops].sort((a, b) => a.sequence - b.sequence);

  return (
    <Card className="overflow-hidden">
      <ol className="max-h-[28rem] divide-y divide-border overflow-auto">
        {ordered.map((stop, index) => {
          const otherLines = stop.interchange_lines;
          return (
            <li key={stop.key}>
              <button
                type="button"
                onClick={() => onStopClick?.(stop.key)}
                className={
                  'flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-surface-variant' +
                  (selectedStopKey === stop.key ? ' bg-surface-variant' : '')
                }
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#111]"
                  style={{ backgroundColor: lineColor }}
                >
                  {displayStopSequence(stop, ordered)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-content">{stop.name_pt}</span>
                  {otherLines.length > 0 ? (
                    <span className="block truncate text-xs text-muted">
                      {t('minibusInterchangeWith', { lines: otherLines.join(', ') })}
                    </span>
                  ) : null}
                </span>
                {index < ordered.length - 1 ? (
                  <span aria-hidden className="mt-2.5 h-full w-px shrink-0 bg-border" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
