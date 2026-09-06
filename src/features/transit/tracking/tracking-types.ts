// Ported from SaoMiguelBus/lib/profile-store.ts (tracking slice). The web has no OS alarms, so
// `notify` / `notificationIds` are intentionally absent from `ActiveTrack`.
import type { TransitDataset, TripStop } from '@/lib/types';

/**
 * A stop within a tracked leg, with the day it actually falls on. `TripStop.time` is a wall
 * clock with no date, so a leg that crosses midnight reads 23h50 → 00h10 as going BACKWARDS.
 * `dayOffset` is days after the itinerary's first departure; absent means the same day.
 */
export interface TrackedStop extends TripStop {
  dayOffset?: number;
}

/** One bus within a pinned/tracked itinerary. Mirrors `TransitRideLeg`, trimmed. */
export interface TrackedLeg {
  /** Optional: the cutover migration drops it, and a pin's job is to re-run a search. */
  tripId?: number;
  routeNumber: string;
  /** Board and alight for THIS leg — not the journey endpoints. */
  origin: string;
  destination: string;
  start: string; // 'HHhMM'
  end: string;
  /** Already board..alight-trimmed by the server. */
  stops: TrackedStop[];
  /** Sequences the server chose, so nothing is re-matched by name. */
  boardSequence?: number;
  alightSequence?: number;
}

export interface TrackedTransfer {
  at: string;
  from: string;
  waitMinutes: number;
  walkMinutes: number;
  tight: boolean;
}

export interface ActiveTrack {
  id: string;
  routeNumber: string;
  /** Journey endpoints — the first leg's board and the last leg's alight. */
  origin: string;
  destination: string;
  searchDay: string;
  searchDate: string;
  /** The journey id when tracked from a journey card; absent for single trips. */
  journeyId?: string;
  /** Which network this was built against. Absent = created before this change. */
  dataset?: TransitDataset;
  legs: TrackedLeg[];
  transfers: TrackedTransfer[];
  nextDeparture: string;
  estimatedArrival: string;
  expiresAt: number;
  createdAt: number;
  /** Armed by the pinned-route sweep rather than by a tap. */
  auto?: boolean;

  // --- legacy fields, kept so persisted state from the mobile shape still reads ---
  /** @deprecated use `legs[0].tripId` */ tripId?: number;
  /** @deprecated use `legs[0].stops` */ stops?: TripStop[];
}

export interface PinnedRoute {
  id: string;
  /** The journey id when pinned from a journey card; absent for legacy pins. */
  journeyId?: string;
  /** Which network this was created against. Absent = created before this change. */
  dataset?: TransitDataset;
  /** `"110"` when direct, `"110 → 205"` across a change. */
  routeNumber: string;
  /** Journey endpoints — the first leg's board and the last leg's alight. */
  origin: string;
  destination: string;
  searchDay: string;
  legs: TrackedLeg[];
  transfers: TrackedTransfer[];
  pinnedAt: number;
  /** Set by the migration when the pin no longer resolves. Shown greyed, never deleted. */
  unavailable?: boolean;

  // --- legacy fields ---
  /** @deprecated use `legs[0].tripId` */ tripId?: number;
  /** @deprecated use `legs[0].stops` */ stops?: TripStop[];
}

export interface TrackingState {
  active: ActiveTrack[];
  pinned: PinnedRoute[];
  lastCleanup: number;
  /**
   * Pins the auto-track sweep has already armed, keyed `${pinId}|${YYYY-MM-DD}`. At most once
   * per pin per day, so stopping an auto-started track is not undone by the next sweep.
   * Yesterday's keys are dropped on write, so this cannot grow.
   */
  autoTracked?: Record<string, number>;
}

/** Why a pin did or did not land. */
export type PinResult = 'ok' | 'duplicate' | 'cap';
