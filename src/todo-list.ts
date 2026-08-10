import { InvalidDueDateError, InvalidTitleError, UnknownTodoError } from "./errors.js";
import type { Todo, TodoId } from "./todo.js";

/** Which todos a listing asks for. */
export type TodoFilter = "all" | "open" | "completed";

/** The order a listing comes back in. */
export type TodoOrder = "insertion" | "due-date";

/** The source of "now" a todo list measures overdue todos against. */
export type Clock = () => Date;

/**
 * A list of todos, held in memory, with ids it hands out itself.
 *
 * `list` returns todos in the order they were added — the order a listing
 * comes back in when it is not asked for another — unless asked for
 * due-date order, and adding never reorders what is already there.
 */
export class TodoList {
  private readonly todos = new Map<TodoId, Todo>();

  /** A list measured against the given clock, or the real one if none is given. */
  constructor(private readonly clock: Clock = () => new Date()) {}

  /**
   * Add a todo with the given title and, if given, its due date, and answer
   * the todo that was added. A todo added without a due date is undated.
   */
  add(title: string, dueDate?: Date): Todo {
    const accepted = requireTitle(title);
    const acceptedDueDate = requireDueDate(dueDate);
    const todo: Todo = { id: this.mintId(), title: accepted, completed: false, dueDate: acceptedDueDate };
    this.todos.set(todo.id, todo);
    return todo;
  }

  /** The todo with that id, or a thrown `UnknownTodoError` if the list holds none. */
  get(id: TodoId): Todo {
    const todo = this.todos.get(id);
    if (todo === undefined) throw unknownTodo(id);
    return todo;
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
    const filtered = [...this.todos.values()].filter((todo) => matches(todo, filter));
    return order === "due-date" ? filtered.sort(byDueDate) : filtered;
  }

  /** The open, dated todos due before the clock's now, in the order they were added. */
  overdue(): Todo[] {
    const now = this.clock();
    return [...this.todos.values()].filter((todo) => isOverdue(todo, now));
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

function requireDueDate(dueDate: Date | undefined): Date | undefined {
  if (dueDate === undefined) return undefined;
  if (Number.isNaN(dueDate.getTime())) {
    throw new InvalidDueDateError("A due date needs to be a usable point in time.");
  }
  return new Date(dueDate.getTime());
}

function unknownTodo(id: TodoId): UnknownTodoError {
  return new UnknownTodoError(`This list holds no todo with id ${id}.`);
}

function matches(todo: Todo, filter: TodoFilter): boolean {
  if (filter === "all") return true;
  if (filter === "open") return !todo.completed;
  return todo.completed;
}

function isDated(todo: Todo): todo is Todo & { dueDate: Date } {
  return todo.dueDate !== undefined;
}

function isOverdue(todo: Todo, now: Date): boolean {
  return isDated(todo) && !todo.completed && todo.dueDate.getTime() < now.getTime();
}

function byDueDate(a: Todo, b: Todo): number {
  if (!isDated(a) && !isDated(b)) return 0;
  if (!isDated(a)) return 1;
  if (!isDated(b)) return -1;
  return a.dueDate.getTime() - b.dueDate.getTime();
}
