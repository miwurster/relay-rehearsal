/** The identity a todo keeps for as long as the list holds it. */
export type TodoId = string;

/**
 * One thing somebody means to do.
 *
 * A todo is read-only to callers: the list replaces it rather than mutating it,
 * so a todo handed out earlier never changes underneath the code holding it.
 */
export interface Todo {
  readonly id: TodoId;
  readonly title: string;
  readonly completed: boolean;
  /** The point in time this todo is meant to be done by, or `null` if it is undated. */
  readonly dueDate: Date | null;
}
