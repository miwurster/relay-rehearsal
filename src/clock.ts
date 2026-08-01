/** A source of "now", so a caller can measure the list against a time of its own choosing. */
export type Clock = () => Date;

/** The real clock: the current moment, read afresh each time it is called. */
export const realClock: Clock = () => new Date();
