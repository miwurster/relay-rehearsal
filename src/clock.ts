/** A source of "now", so a caller can supply their own instead of the system clock. */
export interface Clock {
  now(): Date;
}

/** The system clock: reads the real current time. */
export const systemClock: Clock = {
  now: () => new Date(),
};
