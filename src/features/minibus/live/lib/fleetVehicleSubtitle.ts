import { formatVehicleStatusLabel, type VehicleStatusI18nKeys } from '@/features/live/lib/vehicleStatus';
import type { MinibusVehicleSummary } from '@/lib/types';

type Translate = (key: string, opts?: Record<string, unknown>) => string;

/**
 * The fleet-bar row subtitle. Mobile also derives a "current stop" phrase from a
 * per-vehicle detail fetch; web's fleet bar only has the summary-list vehicle
 * (no per-row detail query), so this reads status/fleet id off the summary alone.
 */
export function fleetVehicleSubtitle(
  vehicle: MinibusVehicleSummary,
  t: Translate,
  keys: VehicleStatusI18nKeys,
): string {
  if (vehicle.fleetId) {
    return t('minibusLiveFleetId', { id: vehicle.fleetId });
  }
  return formatVehicleStatusLabel(vehicle.status, t, { keys });
}
