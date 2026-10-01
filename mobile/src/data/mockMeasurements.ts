import type { Measurement } from '@/services/device';

const MINUTE = 60_000;

const seedAt = (id: string, valueCm: number, minutesAgo: number): Measurement => ({
  id,
  valueCm,
  timestamp: Date.now() - minutesAgo * MINUTE,
});

/**
 * Seed readings used by the mockup. The first entry mirrors the "127.1 cm"
 * hero value from the design and is the one the simulated feed keeps alive.
 */
export const seedMeasurements: Measurement[] = [
  seedAt('m-001', 127.1, 0),
  seedAt('m-002', 138.5, 8),
  seedAt('m-003', 129.4, 14),
  seedAt('m-004', 124.5, 21),
  seedAt('m-005', 118.2, 27),
  seedAt('m-006', 130.0, 33),
  seedAt('m-007', 95.7, 41),
  seedAt('m-008', 102.3, 47),
  seedAt('m-009', 110.8, 53),
  seedAt('m-010', 120.1, 61),
  seedAt('m-011', 134.6, 72),
];
