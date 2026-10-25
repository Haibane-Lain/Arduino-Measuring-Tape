import { DEFAULT_SETTINGS, type Settings } from '@/services/device';
import { shouldPlayAlert } from '@/utils/alerts';

const settings = (patch: Partial<Settings>): Settings => ({ ...DEFAULT_SETTINGS, ...patch });

describe('shouldPlayAlert', () => {
  it('alerts below the threshold', () => {
    expect(shouldPlayAlert(20, settings({ alertThresholdCm: 30 }))).toBe(true);
  });

  it('does not alert at or above the threshold', () => {
    expect(shouldPlayAlert(30, settings({ alertThresholdCm: 30 }))).toBe(false);
    expect(shouldPlayAlert(31, settings({ alertThresholdCm: 30 }))).toBe(false);
  });

  it('does not alert when sound is off', () => {
    expect(shouldPlayAlert(10, settings({ alertThresholdCm: 30, alertSound: 'Off' }))).toBe(false);
  });

  it('does not alert for invalid readings', () => {
    expect(shouldPlayAlert(-1, settings({ alertThresholdCm: 30 }))).toBe(false);
    expect(shouldPlayAlert(Number.NaN, settings({ alertThresholdCm: 30 }))).toBe(false);
  });
});
