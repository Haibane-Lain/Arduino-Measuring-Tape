import type { Settings } from '@/services/device';

/** True when a successful reading should trigger the phone-side alert. */
export function shouldPlayAlert(valueCm: number, settings: Settings): boolean {
  return (
    settings.alertSound !== 'Off' &&
    Number.isFinite(valueCm) &&
    valueCm > 0 &&
    valueCm < settings.alertThresholdCm
  );
}
