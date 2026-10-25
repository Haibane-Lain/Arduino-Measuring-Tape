import { clamp, round1, toDisplayDistance } from '@/utils/units';

describe('toDisplayDistance', () => {
  it('formats centimetres to one decimal', () => {
    expect(toDisplayDistance(127.1, 'Centimeter')).toEqual({
      value: 127.1,
      text: '127.1',
      suffix: 'cm',
    });
  });

  it('converts to metres with millimetre precision', () => {
    expect(toDisplayDistance(127.1, 'Meter').text).toBe('1.271');
  });

  it('converts to inches and feet', () => {
    expect(toDisplayDistance(100, 'Inch').text).toBe('39.4');
    expect(toDisplayDistance(100, 'Feet').text).toBe('3.28');
  });
});

describe('numeric helpers', () => {
  it('clamps values', () => {
    expect(clamp(-5, 0, 300)).toBe(0);
    expect(clamp(120, 0, 300)).toBe(120);
    expect(clamp(500, 0, 300)).toBe(300);
  });

  it('rounds to one decimal', () => {
    expect(round1(1.24)).toBe(1.2);
    expect(round1(1.25)).toBe(1.3);
    expect(round1(1.26)).toBe(1.3);
  });
});
