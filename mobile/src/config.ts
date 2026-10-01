/**
 * Runtime configuration for the mockup build.
 *
 * Once the Arduino UNO link is wired up (see `src/services/device.ts`),
 * `SIMULATE_LIVE_DATA` can be switched off and the app will render only the
 * measurements it receives over the device transport.
 */

/** Full scale of the tape, used by the gauge and range checks. */
export const MAX_RANGE_CM = 200;

/** Upper bound on how many measurements are kept in memory / shown. */
export const HISTORY_LIMIT = 50;

/** Flip to `false` to stop the fake sensor feed. */
export const SIMULATE_LIVE_DATA = true;

/** How often the simulated sensor produces a reading (ms). */
export const LIVE_TICK_MS = 2000;

/** +/- jitter applied to the simulated reading, in cm. */
export const SENSOR_NOISE_CM = 0.9;
