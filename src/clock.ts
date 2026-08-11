/** A source of "now", so a todo list can be measured against a time other than the real one. */
export interface Clock {
  now(): Date;
}

/** The clock a todo list reads when none is supplied: the real one. */
export const systemClock: Clock = {
  now: () => new Date(),
};
