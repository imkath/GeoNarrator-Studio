import { describe, expect, it } from 'vitest';
import { parseCoordinates } from './coordinates';

describe('parseCoordinates', () => {
  it('reads the decimal pair Google Maps produces and returns [lng, lat]', () => {
    expect(parseCoordinates('-33.4489, -70.6693')).toEqual([-70.6693, -33.4489]);
    expect(parseCoordinates('-33.4489 -70.6693')).toEqual([-70.6693, -33.4489]);
    expect(parseCoordinates('  -33.4489,-70.6693  ')).toEqual([-70.6693, -33.4489]);
  });

  it('applies the sign from N/S/E/W suffixes', () => {
    expect(parseCoordinates('33.4489 S, 70.6693 W')).toEqual([-70.6693, -33.4489]);
    expect(parseCoordinates('33.4489°S, 70.6693°W')).toEqual([-70.6693, -33.4489]);
    expect(parseCoordinates('40.7128 N, 74.0060 W')).toEqual([-74.006, 40.7128]);
  });

  it('rejects coordinates outside the valid range', () => {
    expect(parseCoordinates('91, 0')).toBeNull();
    expect(parseCoordinates('0, 181')).toBeNull();
    expect(parseCoordinates('-90.1, -180.1')).toBeNull();
  });

  it('accepts the exact bounds', () => {
    expect(parseCoordinates('90, 180')).toEqual([180, 90]);
    expect(parseCoordinates('-90, -180')).toEqual([-180, -90]);
  });

  it('returns null for anything that is not a pair', () => {
    expect(parseCoordinates('Santiago')).toBeNull();
    expect(parseCoordinates('')).toBeNull();
    expect(parseCoordinates('-33.4489')).toBeNull();
    expect(parseCoordinates('a, b')).toBeNull();
  });
});
