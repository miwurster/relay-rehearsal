/**
 * The three ways a caller can be wrong.
 *
 * All three are thrown rather than returned, because a caller that ignores a return
 * value goes on to work with a list that did not change.
 */

/** A title that is empty once trimmed. */
export class InvalidTitleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTitleError";
  }
}

/** An id no todo in the list carries. */
export class UnknownTodoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnknownTodoError";
  }
}

/** A due date that is not a usable point in time. */
export class InvalidDueDateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDueDateError";
  }
}
