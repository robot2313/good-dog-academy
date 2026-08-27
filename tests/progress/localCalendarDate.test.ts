import {
  isValidTimeZone,
  LocalCalendarDateError,
  toLocalCalendarDate,
} from '../../src/features/progress/time/localCalendarDate';

describe('localCalendarDate', () => {
  it('uses the requested local calendar date near UTC midnight', () => {
    expect(toLocalCalendarDate(
      '2026-07-23T16:00:00.000Z',
      'Australia/Adelaide',
    )).toBe('2026-07-24');
    expect(toLocalCalendarDate(
      '2026-07-23T02:00:00.000Z',
      'America/New_York',
    )).toBe('2026-07-22');
  });

  it('keeps Adelaide instants on the correct date across spring DST', () => {
    expect(toLocalCalendarDate(
      '2026-10-03T16:20:00.000Z',
      'Australia/Adelaide',
    )).toBe('2026-10-04');
    expect(toLocalCalendarDate(
      '2026-10-03T16:40:00.000Z',
      'Australia/Adelaide',
    )).toBe('2026-10-04');
  });

  it('keeps both repeated New York fall DST hours on the same date', () => {
    expect(toLocalCalendarDate(
      '2026-11-01T05:30:00.000Z',
      'America/New_York',
    )).toBe('2026-11-01');
    expect(toLocalCalendarDate(
      '2026-11-01T06:30:00.000Z',
      'America/New_York',
    )).toBe('2026-11-01');
  });

  it('rejects invalid timezones and timestamps', () => {
    expect(isValidTimeZone('Not/A_Timezone')).toBe(false);
    expect(() => toLocalCalendarDate(
      '2026-07-23T00:00:00.000Z',
      'Not/A_Timezone',
    )).toThrow(expect.objectContaining<Partial<LocalCalendarDateError>>({
      code: 'INVALID_TIMEZONE',
    }));
    expect(() => toLocalCalendarDate(
      'not-a-timestamp',
      'Australia/Adelaide',
    )).toThrow(expect.objectContaining<Partial<LocalCalendarDateError>>({
      code: 'INVALID_TIMESTAMP',
    }));
  });
});
