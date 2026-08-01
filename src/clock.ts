/** A source of now, so a todo list's notion of the present can be pinned in a test. */
export interface Clock {
  now(): Date;
}

/** The clock that reads the system's real time. */
export const realClock: Clock = {
  now: () => new Date(),
};
