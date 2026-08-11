/** A source of "now", so a todo list's caller can supply their own for tests. */
export interface Clock {
  now(): Date;
}

/** The real clock: reads the system's current time. */
export const systemClock: Clock = {
  now: () => new Date(),
};
