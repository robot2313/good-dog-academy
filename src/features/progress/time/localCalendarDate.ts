export type LocalCalendarDateErrorCode = 'INVALID_TIMESTAMP' | 'INVALID_TIMEZONE';

export class LocalCalendarDateError extends Error {
  constructor(
    readonly code: LocalCalendarDateErrorCode,
    readonly context: Readonly<Record<string, unknown>> = {},
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'LocalCalendarDateError';
  }
}

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone.trim()) return false;
  try {
    createDateFormatter(timeZone).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

export function toLocalCalendarDate(timestamp: string, timeZone: string): string {
  const instant = new Date(timestamp);
  if (!timestamp.trim() || !Number.isFinite(instant.getTime())) {
    throw new LocalCalendarDateError('INVALID_TIMESTAMP', { timestamp });
  }
  if (!isValidTimeZone(timeZone)) {
    throw new LocalCalendarDateError('INVALID_TIMEZONE', { timeZone });
  }

  const values = new Map(
    createDateFormatter(timeZone)
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  const year = values.get('year');
  const month = values.get('month');
  const day = values.get('day');
  if (!year || !month || !day) {
    throw new LocalCalendarDateError(
      'INVALID_TIMESTAMP',
      { timestamp, timeZone },
    );
  }
  return `${year}-${month}-${day}`;
}

function createDateFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-CA', {
    calendar: 'gregory',
    numberingSystem: 'latn',
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
