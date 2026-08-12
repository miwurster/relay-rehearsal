/** Where a listing reads "now" from, so it can be measured against a time a test can pin. */
export interface Clock {
  now(): Date;
}

/** The clock a list reads when none is supplied. */
export const REAL_CLOCK: Clock = { now: () => new Date() };
