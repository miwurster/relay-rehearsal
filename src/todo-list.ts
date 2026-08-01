import type { Clock } from "./clock.js";
import { realClock } from "./clock.js";
import { InvalidDueDateError, InvalidTitleError, UnknownTodoError } from "./errors.js";
import type { Todo, TodoId } from "./todo.js";

/** Which todos a listing asks for. */
export type TodoFilter = "all" | "open" | "completed";

/** What order a listing comes back in. */
export type TodoOrder = "insertion" | "due-date";

/**
 * A list of todos, held in memory, with ids it hands out itself.
 *
 * Insertion order is the list's order: `list` returns todos in the order they
 * were added, and adding never reorders what is already there.
 */
export class TodoList {
  private readonly todos = new Map<TodoId, Todo>();

  /** A list measures overdue todos against the real clock unless given one of its own. */
  constructor(private readonly clock: Clock = realClock) {}

  /**
   * Add a todo with the given title, and answer the todo that was added.
   *
   * A due date is optional; a todo added without one is undated.
   */
  add(title: string, dueDate?: Date): Todo {
    const accepted = requireTitle(title);
    const acceptedDueDate = requireUsableDueDate(dueDate);
    const todo: Todo = { id: this.mintId(), title: accepted, completed: false, dueDate: acceptedDueDate };
    this.todos.set(todo.id, todo);
    return present(todo);
  }

  /** The todo with that id, or a thrown `UnknownTodoError` if the list holds none. */
  get(id: TodoId): Todo {
    const todo = this.todos.get(id);
    if (todo === undefined) throw unknownTodo(id);
    return present(todo);
  }

  rename(id: TodoId, title: string): Todo {
    return this.replace({ ...this.get(id), title: requireTitle(title) });
  }

  complete(id: TodoId): Todo {
    return this.replace({ ...this.get(id), completed: true });
  }

  reopen(id: TodoId): Todo {
    return this.replace({ ...this.get(id), completed: false });
  }

  remove(id: TodoId): void {
    if (!this.todos.delete(id)) throw unknownTodo(id);
  }

  /**
   * The todos the filter asks for, in the order asked for.
   *
   * Insertion order is the default; due-date order puts the soonest due date
   * first and every undated todo after every dated one.
   */
  list(filter: TodoFilter = "all", order: TodoOrder = "insertion"): Todo[] {
    const matching = this.listing((todo) => matches(todo, filter));
    return order === "due-date" ? sortByDueDate(matching) : matching;
  }

  /** The dated, open todos due before now, in the order they were added. */
  overdue(): Todo[] {
    const now = this.clock();
    return this.listing((todo) => isOverdue(todo, now));
  }

  private replace(todo: Todo): Todo {
    this.todos.set(todo.id, todo);
    return present(todo);
  }

  /** The todos the predicate keeps, in the order they were added. */
  private listing(keep: (todo: Todo) => boolean): Todo[] {
    return [...this.todos.values()].filter(keep).map(present);
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

function requireUsableDueDate(dueDate: Date | undefined): Date | undefined {
  if (dueDate === undefined) return undefined;
  if (Number.isNaN(dueDate.getTime())) {
    throw new InvalidDueDateError("A due date must be a usable point in time.");
  }
  return new Date(dueDate.getTime());
}

/** A todo as handed to a caller: its due date copied, so mutating it cannot reach the stored todo. */
function present(todo: Todo): Todo {
  return { ...todo, dueDate: todo.dueDate === undefined ? undefined : new Date(todo.dueDate.getTime()) };
}

function unknownTodo(id: TodoId): UnknownTodoError {
  return new UnknownTodoError(`This list holds no todo with id ${id}.`);
}

function matches(todo: Todo, filter: TodoFilter): boolean {
  if (filter === "all") return true;
  if (filter === "open") return !todo.completed;
  return todo.completed;
}

/** The todos in due-date order: soonest due date first, undated last, stable within ties. */
function sortByDueDate(todos: Todo[]): Todo[] {
  return [...todos].sort(compareByDueDate);
}

function compareByDueDate(first: Todo, second: Todo): number {
  if (first.dueDate === undefined && second.dueDate === undefined) return 0;
  if (first.dueDate === undefined) return 1;
  if (second.dueDate === undefined) return -1;
  return first.dueDate.getTime() - second.dueDate.getTime();
}

function isOverdue(todo: Todo, now: Date): boolean {
  if (todo.dueDate === undefined) return false;
  if (todo.completed) return false;
  return todo.dueDate.getTime() < now.getTime();
}
