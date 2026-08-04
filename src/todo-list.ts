import { InvalidDueDateError, InvalidTitleError, UnknownTodoError } from "./errors.js";
import type { Todo, TodoId } from "./todo.js";

/** Which todos a listing asks for. */
export type TodoFilter = "all" | "open" | "completed" | "overdue";

/** What order a listing comes back in. */
export type TodoOrder = "insertion" | "due-date";

/** Where the list reads "now" from. */
export type Clock = () => Date;

/**
 * A list of todos, held in memory, with ids it hands out itself.
 *
 * Insertion order is the list's order: `list` returns todos in the order they
 * were added, and adding never reorders what is already there.
 */
export class TodoList {
  private readonly todos = new Map<TodoId, Todo>();
  private readonly clock: Clock;

  constructor(clock: Clock = () => new Date()) {
    this.clock = clock;
  }

  /** Add a todo with the given title and, optionally, a due date, and answer the todo that was added. */
  add(title: string, dueDate?: Date): Todo {
    const acceptedTitle = requireTitle(title);
    const acceptedDueDate = requireDueDate(dueDate);
    const todo: Todo = { id: this.mintId(), title: acceptedTitle, completed: false, dueDate: acceptedDueDate };
    this.todos.set(todo.id, todo);
    return expose(todo);
  }

  /** The todo with that id, or a thrown `UnknownTodoError` if the list holds none. */
  get(id: TodoId): Todo {
    const todo = this.todos.get(id);
    if (todo === undefined) throw unknownTodo(id);
    return expose(todo);
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

  /** The todos the filter asks for, in the order asked for. */
  list(filter: TodoFilter = "all", order: TodoOrder = "insertion"): Todo[] {
    const now = this.clock();
    const matching = [...this.todos.values()].filter((todo) => matches(todo, filter, now));
    if (order === "due-date") matching.sort(byDueDate);
    return matching.map(expose);
  }

  private replace(todo: Todo): Todo {
    this.todos.set(todo.id, todo);
    return expose(todo);
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

function requireDueDate(dueDate: Date | undefined): Date | undefined {
  if (dueDate === undefined) return undefined;
  if (Number.isNaN(dueDate.getTime())) throw new InvalidDueDateError("A due date must be a usable point in time.");
  return new Date(dueDate.getTime());
}

/** A copy of the todo safe to hand to a caller: its due date is its own instance, not the list's. */
function expose(todo: Todo): Todo {
  return todo.dueDate === undefined ? todo : { ...todo, dueDate: new Date(todo.dueDate.getTime()) };
}

function unknownTodo(id: TodoId): UnknownTodoError {
  return new UnknownTodoError(`This list holds no todo with id ${id}.`);
}

function matches(todo: Todo, filter: TodoFilter, now: Date): boolean {
  if (filter === "all") return true;
  if (filter === "open") return !todo.completed;
  if (filter === "completed") return todo.completed;
  return isOverdue(todo, now);
}

function isOverdue(todo: Todo, now: Date): boolean {
  return todo.dueDate !== undefined && !todo.completed && todo.dueDate.getTime() < now.getTime();
}

/** Soonest due date first; undated todos after every dated one; ties left as they were. */
function byDueDate(a: Todo, b: Todo): number {
  if (a.dueDate === undefined) return b.dueDate === undefined ? 0 : 1;
  if (b.dueDate === undefined) return -1;
  return a.dueDate.getTime() - b.dueDate.getTime();
}
