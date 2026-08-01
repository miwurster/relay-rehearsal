/** What the list reads "now" from, so a listing can be measured against a time a caller controls rather than the wall clock. */
export interface Clock {
  now(): Date;
}

/** The clock a list reads when none is supplied: the system's own time. */
export const systemClock: Clock = {
  now: () => new Date(),
};
