import { InvalidDueDateError, InvalidTitleError, UnknownTodoError } from "./errors.js";
import type { Todo, TodoId } from "./todo.js";

/** Which todos a listing asks for. */
export type TodoFilter = "all" | "open" | "completed" | "overdue";

/** What order a listing comes back in. */
export type TodoOrder = "insertion" | "due-date";

/** A source of the current moment, so what counts as overdue can be pinned in tests instead of read from the system clock. */
export interface Clock {
  now(): Date;
}

const systemClock: Clock = { now: () => new Date() };

/**
 * A list of todos, held in memory, with ids it hands out itself.
 *
 * Insertion order is the order a listing comes back in when no order is
 * asked for: `list` returns todos in the order they were added unless asked
 * for in due-date order, and adding never reorders what is already there.
 */
export class TodoList {
  private readonly todos = new Map<TodoId, Todo>();
  private readonly clock: Clock;

  /** A list measured against the given clock, or the real one if none is given. */
  constructor(clock: Clock = systemClock) {
    this.clock = clock;
  }

  /**
   * Add a todo with the given title, and answer the todo that was added.
   *
   * A due date is optional; a todo added without one is undated. A due date
   * that is not a usable point in time is refused.
   */
  add(title: string, dueDate?: Date): Todo {
    const accepted = requireTitle(title);
    const acceptedDueDate = requireDueDate(dueDate);
    const todo: Todo = { id: this.mintId(), title: accepted, completed: false, dueDate: acceptedDueDate };
    this.todos.set(todo.id, todo);
    return exposed(todo);
  }

  /** The todo with that id, or a thrown `UnknownTodoError` if the list holds none. */
  get(id: TodoId): Todo {
    return exposed(this.stored(id));
  }

  rename(id: TodoId, title: string): Todo {
    return exposed(this.replace({ ...this.stored(id), title: requireTitle(title) }));
  }

  complete(id: TodoId): Todo {
    return exposed(this.replace({ ...this.stored(id), completed: true }));
  }

  reopen(id: TodoId): Todo {
    return exposed(this.replace({ ...this.stored(id), completed: false }));
  }

  remove(id: TodoId): void {
    if (!this.todos.delete(id)) throw unknownTodo(id);
  }

  /** The todos the filter asks for, in the given order; insertion order if none is given. */
  list(filter: TodoFilter = "all", order: TodoOrder = "insertion"): Todo[] {
    const now = this.clock.now();
    const matched = [...this.todos.values()].filter((todo) => matches(todo, filter, now));
    const ordered = order === "due-date" ? matched.sort(byDueDate) : matched;
    return ordered.map(exposed);
  }

  /** The stored todo with that id, or a thrown `UnknownTodoError` if the list holds none. */
  private stored(id: TodoId): Todo {
    const todo = this.todos.get(id);
    if (todo === undefined) throw unknownTodo(id);
    return todo;
  }

  private replace(todo: Todo): Todo {
    this.todos.set(todo.id, todo);
    return todo;
  }

  /** The next unused id. Only a todo that is about to be added takes one. */
  private mintId(): TodoId {
    return String(this.todos.size + 1);
  }
}

function requireTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed === "") throw new InvalidTitleError("A todo needs a title with something in it.");
  return trimmed;
}

/** The given due date, cloned so a caller's later mutation of it cannot reach the list; `null` if none was given. */
function requireDueDate(dueDate: Date | undefined): Date | null {
  if (dueDate === undefined) return null;
  if (Number.isNaN(dueDate.getTime())) {
    throw new InvalidDueDateError("A due date needs to be a usable point in time.");
  }
  return new Date(dueDate.getTime());
}

/** The given todo, with its due date cloned so a caller's later mutation of it cannot reach the list. */
function exposed(todo: Todo): Todo {
  return { ...todo, dueDate: todo.dueDate === null ? null : new Date(todo.dueDate.getTime()) };
}

function unknownTodo(id: TodoId): UnknownTodoError {
  return new UnknownTodoError(`This list holds no todo with id ${id}.`);
}

function matches(todo: Todo, filter: TodoFilter, now: Date): boolean {
  switch (filter) {
    case "all":
      return true;
    case "open":
      return !todo.completed;
    case "completed":
      return todo.completed;
    case "overdue":
      return isOverdue(todo, now);
  }
}

/** A todo is overdue when it is open, dated, and its due date has passed as of `now`. */
function isOverdue(todo: Todo, now: Date): boolean {
  return !todo.completed && todo.dueDate !== null && todo.dueDate.getTime() < now.getTime();
}

/** Orders two todos soonest due date first, with every undated todo after every dated one. */
function byDueDate(first: Todo, second: Todo): number {
  if (first.dueDate === null) return second.dueDate === null ? 0 : 1;
  if (second.dueDate === null) return -1;
  return first.dueDate.getTime() - second.dueDate.getTime();
}
