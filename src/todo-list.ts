import { InvalidDueDateError, InvalidTitleError, UnknownTodoError } from "./errors.js";
import type { Todo, TodoId } from "./todo.js";

/** Where the todo list reads "now" from, so it can be measured against a time a test can pin. */
export interface Clock {
  now(): Date;
}

/** The clock a list reads when none is supplied. */
const REAL_CLOCK: Clock = { now: () => new Date() };

/** Which todos a listing asks for. */
export type TodoFilter = "all" | "open" | "completed";

/** What order a listing comes back in. */
export type TodoOrder = "insertion" | "due-date";

/**
 * A list of todos, held in memory, with ids it hands out itself.
 *
 * Insertion order is the list's order: `list` returns todos in the order they
 * were added unless asked for another order, and adding never reorders what
 * is already there.
 */
export class TodoList {
  private readonly todos = new Map<TodoId, Todo>();
  private readonly clock: Clock;

  constructor(clock: Clock = REAL_CLOCK) {
    this.clock = clock;
  }

  /** Add a todo with the given title and optional due date, and answer the todo that was added. */
  add(title: string, dueDate?: Date): Todo {
    const accepted = requireTitle(title);
    const acceptedDueDate = cloneDueDate(requireUsableDueDate(dueDate));
    const todo: Todo = { id: this.mintId(), title: accepted, completed: false, dueDate: acceptedDueDate };
    this.todos.set(todo.id, todo);
    return exposeTodo(todo);
  }

  /** The todo with that id, or a thrown `UnknownTodoError` if the list holds none. */
  get(id: TodoId): Todo {
    const todo = this.todos.get(id);
    if (todo === undefined) throw unknownTodo(id);
    return exposeTodo(todo);
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

  /** The todos the filter asks for, in the order given, or the order they were added if none is given. */
  list(filter: TodoFilter = "all", order: TodoOrder = "insertion"): Todo[] {
    const matching = [...this.todos.values()].filter((todo) => matches(todo, filter));
    const ordered = order === "due-date" ? matching.sort(byDueDate) : matching;
    return ordered.map(exposeTodo);
  }

  /** The dated, open todos due before now, in the order they were added. */
  overdue(): Todo[] {
    const now = this.clock.now();
    return [...this.todos.values()].filter((todo) => isOverdue(todo, now)).map(exposeTodo);
  }

  private replace(todo: Todo): Todo {
    this.todos.set(todo.id, todo);
    return exposeTodo(todo);
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

function unknownTodo(id: TodoId): UnknownTodoError {
  return new UnknownTodoError(`This list holds no todo with id ${id}.`);
}

function requireUsableDueDate(dueDate: Date | undefined): Date | undefined {
  if (dueDate === undefined) return undefined;
  if (Number.isNaN(dueDate.getTime())) {
    throw new InvalidDueDateError("A due date needs to be a usable point in time.");
  }
  return dueDate;
}

/** A todo handed to a caller, its due date a copy so neither side's mutation reaches the other. */
function exposeTodo(todo: Todo): Todo {
  return { ...todo, dueDate: cloneDueDate(todo.dueDate) };
}

function cloneDueDate(dueDate: Date | undefined): Date | undefined {
  return dueDate === undefined ? undefined : new Date(dueDate.getTime());
}

function matches(todo: Todo, filter: TodoFilter): boolean {
  if (filter === "all") return true;
  if (filter === "open") return !todo.completed;
  return todo.completed;
}

function isOverdue(todo: Todo, now: Date): boolean {
  return !todo.completed && todo.dueDate !== undefined && todo.dueDate.getTime() < now.getTime();
}

/** Soonest due date first; every undated todo after every dated one. Stable, so ties keep insertion order. */
function byDueDate(a: Todo, b: Todo): number {
  if (a.dueDate === undefined) return b.dueDate === undefined ? 0 : 1;
  if (b.dueDate === undefined) return -1;
  return a.dueDate.getTime() - b.dueDate.getTime();
}
