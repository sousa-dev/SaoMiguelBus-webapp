import { useTranslation } from 'react-i18next';

import { azoresbusColorHex, toggleLineCode } from '@/features/transit/live/lib/vehicleLine';
import { cn } from '@/lib/cn';
import type { AzoresbusRoute } from '@/lib/types';

type Props = {
  /** Lines currently carrying a bus (from `azoresbusFleetLines`). */
  lines: AzoresbusRoute[];
  selected: string[];
  onChange: (codes: string[]) => void;
};

/** One chip per line in service; an empty selection means all. */
export function LiveLineFilter({ lines, selected, onChange }: Props) {
  const { t } = useTranslation();
  if (lines.length === 0) return null;

  const chip = (active: boolean) =>
    cn(
      'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold transition',
      active ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface text-content hover:border-outline',
    );

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t('azoresbusLiveFilterTitle')}>
      <button type="button" onClick={() => onChange([])} className={chip(selected.length === 0)}>
        {t('azoresbusLiveFilterAll')}
      </button>
      {lines.map((line) => (
        <button
          key={line.id}
          type="button"
          aria-pressed={selected.includes(line.nameShort)}
          title={line.name}
          onClick={() => onChange(toggleLineCode(selected, line.nameShort))}
          className={chip(selected.includes(line.nameShort))}
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: azoresbusColorHex(line.color) }} />
          {line.nameShort}
        </button>
      ))}
    </div>
  );
}
