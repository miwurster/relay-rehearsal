import { InvalidDueDateError, InvalidTitleError, UnknownTodoError } from "./errors.js";
import type { Todo, TodoId } from "./todo.js";

/** Which todos a listing asks for. */
export type TodoFilter = "all" | "open" | "completed";

/** What order a listing comes back in. */
export type TodoOrder = "insertion" | "due-date";

/** What the list measures "now" against. */
export type Clock = () => Date;

/**
 * A list of todos, held in memory, with ids it hands out itself.
 *
 * Insertion order is the order a listing comes back in when it is not asked
 * for another: todos come back in the order they were added, and adding
 * never reorders what is already there.
 */
export class TodoList {
  private readonly todos = new Map<TodoId, Todo>();
  private readonly clock: Clock;

  /** A list measured against the given clock, or the real clock if none is given. */
  constructor(clock: Clock = () => new Date()) {
    this.clock = clock;
  }

  /** Add a todo with the given title and, optionally, a due date, and answer the todo that was added. */
  add(title: string, dueDate?: Date): Todo {
    const acceptedTitle = requireTitle(title);
    const acceptedDueDate = requireDueDate(dueDate);
    const todo: Todo = {
      id: this.mintId(),
      title: acceptedTitle,
      completed: false,
      dueDate: acceptedDueDate,
    };
    this.todos.set(todo.id, todo);
    return handOut(todo);
  }

  /** The todo with that id, or a thrown `UnknownTodoError` if the list holds none. */
  get(id: TodoId): Todo {
    const todo = this.todos.get(id);
    if (todo === undefined) throw unknownTodo(id);
    return handOut(todo);
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

  /** The todos the filter asks for, in the given order. */
  list(filter: TodoFilter = "all", order: TodoOrder = "insertion"): Todo[] {
    const filtered = [...this.todos.values()].filter((todo) => matches(todo, filter));
    if (order === "due-date") filtered.sort(byDueDate);
    return filtered.map(handOut);
  }

  /** The open, dated todos due before now, in the order they were added. */
  overdue(): Todo[] {
    return this.list("open").filter((todo) => isOverdue(todo, this.clock()));
  }

  private replace(todo: Todo): Todo {
    this.todos.set(todo.id, todo);
    return handOut(todo);
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
  if (Number.isNaN(dueDate.getTime())) {
    throw new InvalidDueDateError("A due date needs to be a usable point in time.");
  }
  return cloneDueDate(dueDate);
}

/** A todo as handed to a caller: its own copy of the due date, so the caller can't reach into the list's state. */
function handOut(todo: Todo): Todo {
  return { ...todo, dueDate: cloneDueDate(todo.dueDate) };
}

function cloneDueDate(dueDate: Date | undefined): Date | undefined {
  return dueDate === undefined ? undefined : new Date(dueDate.getTime());
}

function unknownTodo(id: TodoId): UnknownTodoError {
  return new UnknownTodoError(`This list holds no todo with id ${id}.`);
}

function matches(todo: Todo, filter: TodoFilter): boolean {
  if (filter === "all") return true;
  if (filter === "open") return !todo.completed;
  return todo.completed;
}

function isOverdue(todo: Todo, now: Date): boolean {
  return todo.dueDate !== undefined && todo.dueDate < now;
}

function byDueDate(a: Todo, b: Todo): number {
  if (a.dueDate === undefined) return b.dueDate === undefined ? 0 : 1;
  if (b.dueDate === undefined) return -1;
  return a.dueDate.getTime() - b.dueDate.getTime();
}
