import { describe, expect, it } from 'vitest';

import { fleetVehicleSubtitle } from '@/features/minibus/live/lib/fleetVehicleSubtitle';
import { vehicleStatusI18nKeys } from '@/features/live/lib/vehicleStatus';
import type { MinibusVehicleSummary } from '@/lib/types';

const keys = vehicleStatusI18nKeys('minibusLive');
const t = (key: string, opts?: Record<string, unknown>) => {
  if (!opts) return key;
  return `${key}(${Object.entries(opts).map(([k, v]) => `${k}=${v}`).join(',')})`;
};

describe('fleetVehicleSubtitle', () => {
  it('prefers the fleet id when present', () => {
    const vehicle = { id: 'v1', position: { lat: 0, lon: 0 }, status: 'inTransitTo', fleetId: '42' } as MinibusVehicleSummary;
    expect(fleetVehicleSubtitle(vehicle, t, keys)).toBe('minibusLiveFleetId(id=42)');
  });

  it('falls back to the vehicle status label without a fleet id', () => {
    const vehicle = { id: 'v1', position: { lat: 0, lon: 0 }, status: 'idleAt' } as MinibusVehicleSummary;
    expect(fleetVehicleSubtitle(vehicle, t, keys)).toBe('minibusLiveVehicleStatusIdleAt');
  });
});
