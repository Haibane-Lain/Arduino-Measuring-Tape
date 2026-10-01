/**
 * Central design tokens for the Measuring Tape app.
 *
 * Values are taken from the "User Interface-1" mockup so screens can be
 * described with tokens instead of raw hex values.
 */

export const colors = {
  /** App canvas behind every screen. */
  background: '#161B27',
  /** Cards, sheets and the tab bar. */
  surface: '#212838',
  /** Slightly lighter surface used for inputs and pressed states. */
  surfaceAlt: '#2A3242',
  /** Hairline separators and outlines. */
  border: '#2E3648',
  /** Translucent overlay for modal scrims. */
  scrim: 'rgba(8, 11, 18, 0.66)',

  textPrimary: '#EAF0FA',
  textSecondary: '#8B94AA',
  textMuted: '#6A7390',

  /** Primary brand blue (buttons, progress). */
  accent: '#3AA0FF',
  /** Cyan end of the accent gradient (gauge, active tab). */
  accentBright: '#22D3EE',
  /** Light blue used for the hero distance reading. */
  accentText: '#7CC7FF',
  /** Low-opacity accent used for the active tab pill. */
  accentSoft: 'rgba(58, 160, 255, 0.16)',
  /** Text/icon color used on top of accent fills. */
  onAccent: '#F5F9FF',

  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.14)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.14)',
  danger: '#F87171',
} as const;

/** Gradient stops expressed as `[start, end]` pairs. */
export const gradients = {
  accent: ['#5BE3FF', '#2F8BFF'],
  historyBar: ['#3FD8FF', '#1E3A5F'],
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  headerTitle: { fontSize: 20, fontWeight: '700' },
  screenTitle: { fontSize: 18, fontWeight: '700' },
  value: { fontSize: 66, fontWeight: '700' },
  valueUnit: { fontSize: 24, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '600', letterSpacing: 2 },
  body: { fontSize: 15, fontWeight: '500' },
  label: { fontSize: 14, fontWeight: '500' },
  meta: { fontSize: 12, fontWeight: '500' },
} as const;
