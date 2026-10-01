import type { DistanceUnit } from '@/services/device';

/** Display suffix for each supported unit. */
export const UNIT_SUFFIX: Record<DistanceUnit, string> = {
  Centimeter: 'cm',
  Meter: 'm',
  Inch: 'in',
  Feet: 'ft',
};

/** Decimal places that keep each unit readable. */
const UNIT_DECIMALS: Record<DistanceUnit, number> = {
  Centimeter: 1,
  Meter: 3,
  Inch: 1,
  Feet: 2,
};

const CM_PER_UNIT: Record<DistanceUnit, number> = {
  Centimeter: 1,
  Meter: 100,
  Inch: 2.54,
  Feet: 30.48,
};

export type DisplayDistance = {
  /** Numeric value in the target unit (already rounded for display). */
  value: number;
  /** Pre-formatted string, e.g. `127.1`. */
  text: string;
  /** Unit suffix, e.g. `cm`. */
  suffix: string;
};

/** Convert a canonical centimetre reading into the user's chosen unit. */
export function toDisplayDistance(valueCm: number, unit: DistanceUnit): DisplayDistance {
  const value = valueCm / CM_PER_UNIT[unit];
  const decimals = UNIT_DECIMALS[unit];
  return {
    value: Number(value.toFixed(decimals)),
    text: value.toFixed(decimals),
    suffix: UNIT_SUFFIX[unit],
  };
}

/** Clamp a value to the `[min, max]` interval. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Round to a single decimal (the precision the sensor can realistically hold). */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
