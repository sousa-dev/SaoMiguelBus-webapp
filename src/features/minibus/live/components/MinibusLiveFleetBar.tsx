import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { Card } from '@/components/ui';
import { fleetVehicleSubtitle } from '@/features/minibus/live/lib/fleetVehicleSubtitle';
import { resolveLineForVehicle, vehicleLineColorHex } from '@/features/minibus/live/lib/vehicleColor';
import { vehicleStatusI18nKeys } from '@/features/live/lib/vehicleStatus';
import { cn } from '@/lib/cn';
import type { MinibusLine, MinibusVehicleSummary } from '@/lib/types';

const STATUS_KEYS = vehicleStatusI18nKeys('minibusLive');

/** A count header plus an expandable per-vehicle list — collapses once a vehicle is selected. */
export function MinibusLiveFleetBar({
  vehicles,
  lines,
  selectedVehicleId,
  selectedLine,
  onSelectVehicle,
  onClearVehicle,
}: {
  vehicles: MinibusVehicleSummary[];
  lines: MinibusLine[];
  selectedVehicleId: string | null;
  selectedLine: MinibusLine | null;
  onSelectVehicle: (id: string) => void;
  onClearVehicle: () => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  // Re-derive `expanded` from a prop change during render (not an effect) — the
  // documented React pattern for resetting state when a prop changes.
  const [trackedVehicleId, setTrackedVehicleId] = useState(selectedVehicleId);
  if (selectedVehicleId !== trackedVehicleId) {
    setTrackedVehicleId(selectedVehicleId);
    setExpanded(selectedVehicleId == null);
  }

  const title = selectedLine
    ? t('minibusLiveFleetBarTitleFiltered', { line: selectedLine.code, count: vehicles.length })
    : t('minibusLiveFleetBarTitle', { count: vehicles.length });

  const sorted = [...vehicles].sort((a, b) => {
    const codeA = resolveLineForVehicle(a, lines)?.code ?? '?';
    const codeB = resolveLineForVehicle(b, lines)?.code ?? '?';
    return `${codeA}-${a.id}`.localeCompare(`${codeB}-${b.id}`);
  });

  const onHeaderClick = () => {
    if (!expanded && selectedVehicleId != null) {
      onClearVehicle();
      setExpanded(true);
      return;
    }
    setExpanded((v) => !v);
  };

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={onHeaderClick}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-surface-variant"
      >
        <span className="truncate text-sm font-bold text-content">{title}</span>
        {expanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
      </button>
      {expanded ? (
        <ul className="max-h-56 divide-y divide-border overflow-y-auto border-t border-border">
          {sorted.map((vehicle) => {
            const line = resolveLineForVehicle(vehicle, lines);
            return (
              <li key={vehicle.id}>
                <button
                  type="button"
                  onClick={() => onSelectVehicle(vehicle.id)}
                  className={cn(
                    'flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-surface-variant',
                    vehicle.id === selectedVehicleId && 'bg-surface-variant',
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: vehicleLineColorHex(vehicle, lines) }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-content">
                      {t('minibusLiveFilterLine', { line: line?.code ?? '?' })}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {fleetVehicleSubtitle(vehicle, t, STATUS_KEYS)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Card>
  );
}
