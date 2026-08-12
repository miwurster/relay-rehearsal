/** A source of the current moment, so code that cares about "now" can be given one instead of asking the system directly. */
export interface Clock {
  now(): Date;
}

/** The clock that reads the system's actual time. */
export const systemClock: Clock = {
  now: () => new Date(),
};
