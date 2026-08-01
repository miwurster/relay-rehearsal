import { InvalidDueDateError, InvalidTitleError, UnknownTodoError } from "./errors.js";
import type { Todo, TodoId } from "./todo.js";

/** Which todos a listing asks for. */
export type TodoFilter = "all" | "open" | "completed";

/** What order a listing comes back in. */
export type TodoOrder = "insertion" | "dueDate";

/** What the list reads "now" from, so overdue-ness can be measured against a time other than the real one. */
export type Clock = () => Date;

/**
 * A list of todos, held in memory, with ids it hands out itself.
 *
 * Insertion order is the list's default order: `list` returns todos in the
 * order they were added unless asked for due-date order instead, and adding
 * never reorders what is already there.
 */
export class TodoList {
  private readonly todos = new Map<TodoId, Todo>();

  constructor(private readonly clock: Clock = () => new Date()) {}

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
    return cloneTodo(todo);
  }

  /** The todo with that id, or a thrown `UnknownTodoError` if the list holds none. */
  get(id: TodoId): Todo {
    const todo = this.todos.get(id);
    if (todo === undefined) throw unknownTodo(id);
    return cloneTodo(todo);
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

  /** The todos the filter asks for, in the order asked for (insertion order by default). */
  list(filter: TodoFilter = "all", order: TodoOrder = "insertion"): Todo[] {
    const matching = this.listing((todo) => matches(todo, filter));
    return order === "dueDate" ? matching.sort(compareByDueDate) : matching;
  }

  /** The open, dated todos due before now, in the order they were added. */
  overdue(): Todo[] {
    const now = this.clock();
    return this.listing((todo) => isOverdue(todo, now));
  }

  private replace(todo: Todo): Todo {
    this.todos.set(todo.id, todo);
    return cloneTodo(todo);
  }

  /** The todos the predicate keeps, in the order they were added, each a copy safe to hand to a caller. */
  private listing(keep: (todo: Todo) => boolean): Todo[] {
    return [...this.todos.values()].filter(keep).map(cloneTodo);
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
    throw new InvalidDueDateError("A due date must be a usable point in time.");
  }
  return new Date(dueDate.getTime());
}

/** A todo safe to hand to a caller: its due date, if any, is a copy of the one the list stores. */
function cloneTodo(todo: Todo): Todo {
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

function isOverdue(todo: Todo, now: Date): boolean {
  return !todo.completed && todo.dueDate !== undefined && todo.dueDate.getTime() < now.getTime();
}

/** Soonest due date first; every undated todo after every dated one; ties keep their relative order. */
function compareByDueDate(todo: Todo, other: Todo): number {
  if (todo.dueDate === undefined && other.dueDate === undefined) return 0;
  if (todo.dueDate === undefined) return 1;
  if (other.dueDate === undefined) return -1;
  return todo.dueDate.getTime() - other.dueDate.getTime();
}
