import { useTranslation } from 'react-i18next';
import { ArrowUpDown, Route } from 'lucide-react';

import { MinibusStopPicker } from './MinibusStopPicker';

/** Origin/destination/swap/search — the planner shared by the MiniBus hub and `/minibus/search`. */
export function MinibusPlannerForm({
  origin,
  onOriginChange,
  destination,
  onDestinationChange,
  stops,
  onSwap,
  onSearch,
}: {
  origin: string;
  onOriginChange: (value: string) => void;
  destination: string;
  onDestinationChange: (value: string) => void;
  stops: string[];
  onSwap: () => void;
  onSearch: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
      <MinibusStopPicker
        value={origin}
        onChange={onOriginChange}
        stops={stops}
        placeholder={t('minibusStopPlaceholder')}
        clearLabel={t('clearInput')}
      />

      <div className="flex justify-center">
        <button
          type="button"
          aria-label={t('minibusSwap')}
          onClick={onSwap}
          className="rounded-full bg-[#f47216]/[0.14] p-2 text-[#f47216] hover:bg-[#f47216]/20"
        >
          <ArrowUpDown size={16} />
        </button>
      </div>

      <MinibusStopPicker
        value={destination}
        onChange={onDestinationChange}
        stops={stops}
        placeholder={t('minibusStopPlaceholder')}
        clearLabel={t('clearInput')}
      />

      <button
        type="button"
        onClick={onSearch}
        disabled={!origin.trim() || !destination.trim()}
        className="mt-2 flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#f47216] text-sm font-semibold text-[#f47216] transition hover:bg-[#f47216]/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Route size={18} />
        {t('minibusSearchCta')}
      </button>
    </div>
  );
}
