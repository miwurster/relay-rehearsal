import { InvalidDueDateError, InvalidTitleError, UnknownTodoError } from "./errors.js";
import type { Todo, TodoId } from "./todo.js";

/** Which todos a listing asks for. */
export type TodoFilter = "all" | "open" | "completed";

/** What order a listing comes back in. */
export type TodoOrder = "insertion" | "due-date";

/** What the list measures due dates against. Answers the current point in time. */
export type Clock = () => Date;

/**
 * A list of todos, held in memory, with ids it hands out itself.
 *
 * Insertion order is the list's order: `list` returns todos in the order they
 * were added when no other order is asked for, and adding never reorders what
 * is already there.
 */
export class TodoList {
  private readonly todos = new Map<TodoId, Todo>();
  private nextId = 1;
  private readonly clock: Clock;

  /** A list measured against the given clock, or the real one if none is given. */
  constructor(clock: Clock = () => new Date()) {
    this.clock = clock;
  }

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
    return this.present(todo);
  }

  /** The todo with that id, or a thrown `UnknownTodoError` if the list holds none. */
  get(id: TodoId): Todo {
    const todo = this.todos.get(id);
    if (todo === undefined) throw unknownTodo(id);
    return this.present(todo);
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
   * The todos the filter asks for, in the order they were added when no other
   * order is asked for.
   *
   * Asked for in `"due-date"` order, dated todos come back soonest due date first,
   * every undated todo after every dated one, each stable within its own group.
   */
  list(filter: TodoFilter = "all", order: TodoOrder = "insertion"): Todo[] {
    const todos = this.select((todo) => matches(todo, filter));
    if (order === "due-date") todos.sort(compareByDueDate);
    return todos;
  }

  /** The dated, open todos due before now, in the order they were added. */
  overdue(): Todo[] {
    const now = this.clock();
    return this.select((todo) => isOverdue(todo, now));
  }

  private replace(todo: Todo): Todo {
    this.todos.set(todo.id, todo);
    return this.present(todo);
  }

  /** The todos matching the predicate, in the order they were added, as a fresh array. */
  private select(predicate: (todo: Todo) => boolean): Todo[] {
    return [...this.todos.values()].filter(predicate).map((todo) => this.present(todo));
  }

  /** A copy of the todo, safe to hand to a caller without exposing the stored due date. */
  private present(todo: Todo): Todo {
    return { ...todo, dueDate: copyDueDate(todo.dueDate) };
  }

  /** The next unused id. Only a todo that is about to be added takes one. */
  private mintId(): TodoId {
    const id = String(this.nextId);
    this.nextId += 1;
    return id;
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
    throw new InvalidDueDateError("A due date needs to be a usable point in time.");
  }
  return copyDueDate(dueDate);
}

function copyDueDate(dueDate: Date | undefined): Date | undefined {
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
  return todo.dueDate !== undefined && !todo.completed && todo.dueDate.getTime() < now.getTime();
}

/** Orders todos soonest due date first, undated ones after, stable within each group. */
function compareByDueDate(first: Todo, second: Todo): number {
  if (first.dueDate === undefined) return second.dueDate === undefined ? 0 : 1;
  if (second.dueDate === undefined) return -1;
  return first.dueDate.getTime() - second.dueDate.getTime();
}
